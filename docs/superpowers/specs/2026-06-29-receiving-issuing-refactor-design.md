# Design: Refactor `receiving-issuing.service.ts` (1962 lines)

**Date:** 2026-06-29
**Status:** Awaiting approval
**Type:** Pure refactor (behavior-preserving)
**Target file:** `src/modules/materials/receiving-issuing/receiving-issuing.service.ts`

---

## 1. Goal

Reduce `receiving-issuing.service.ts` (1962 lines) from a single "God Service" into a thin Facade that delegates to focused sub-services — **without changing any externally observable behavior**. Approach: **Facade + sub-services**, following the pattern already established by `production-orders` (`production-authorization.service.ts` / `production-workflow.service.ts` / `production-tracking.service.ts`).

### Constraints (decided with user)
- **Pure refactor**: 0% behavior change. No bug fixes, no consistency normalizing (e.g. `createProductionIssue` keeps using `manager.decrement()` while siblings subtract manually — that stays as-is).
- **Characterization tests FIRST**: before any move/extract, snapshot current behavior on the main methods so regressions are caught.
- **Controller untouched**: `ReceivingIssuingController` keeps injecting `ReceivingIssuingService`. Only its internals change.

### Non-goals (explicitly out of scope)
- Fixing inconsistencies between the 6 issuing methods (manual vs `decrement()`, transaction vs queryRunner).
- Unifying the 5 FIFO loops into one beyond a single shared helper (behavior-preserving extraction only).
- Refactoring `controller.ts`, DTOs, or entities.
- Adding new features.

---

## 2. Current State Analysis

### 2.1 Method inventory (24 methods, grouped by concern)

| Concern | Method | Lines | Notes |
|---------|--------|-------|-------|
| **Receiving (1)** | `createReceiving` | 89–230 | Uses `pcReceivingBusiness`, `dataSource.transaction` |
| **Issuing (6)** | `createIssuingWithDocument` | 232–373 | `dataSource.transaction` |
| | `createIssuingFromBom` | 669–839 | Product BOM FIFO |
| | `createIssuingFromMaterialBom` | 1836–1961 | Material BOM FIFO |
| | `createManualIssue` | 841–1039 | `queryRunner`, no `MaterialTransaction` |
| | `createProductionIssue` | 1041–1213 | `queryRunner`, no `MaterialTransaction`, uses `decrement()` |
| | `previewProductionIssue` | 1215–1253 | Read-only preview |
| **Query (9)** | `getLotByQrCode` | 375–411 | + QR scan logging |
| | `getLotTransactions` | 413–435 | + QR scan logging |
| | `getAllLots` | 437–495 | |
| | `getAllReceivings` | 497–572 | |
| | `getAllIssuings` | 574–652 | |
| | `getAllIssuingTypes` | 654–659 | |
| | `getIssuingTypeById` | 661–667 | |
| | `getMaterialsStock` | 1358–1376 | |
| | `getMaterialStock` | 1378–1385 | |
| **Material Issue CRUD (4)** | `findAllIssues` | 1255–1318 | |
| | `findOneIssue` | 1320–1327 | |
| | `getIssueDocuments` | 1329–1336 | |
| | `generateIssueNo` (private) | 1338–1356 | |
| **Traceability (3)** | `getTraceabilityByLot` | 1458–1550 | Uses private `packIssuingTraceback` |
| | `getTraceabilityByIssuing` | 1552–1577 | |
| | `getTraceabilityByProductionOrder` | 1579–1621 | |
| **Report (1)** | `getTransactionReport` | 1623–1834 | Complex aggregation (~210 lines) |

### 2.2 The 5 duplicated FIFO lot-fetch blocks

All 5 are **byte-identical** (only `materialId` variable name differs):
```
line 248  (createIssuingWithDocument)
line 708  (createIssuingFromBom)
line 962  (createManualIssue)
line 1156 (createProductionIssue)
line 1857 (createIssuingFromMaterialBom)
```
```ts
manager.createQueryBuilder(MaterialReceivingLot, 'lot')
  .where('lot.materialId = :materialId', { materialId })
  .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
  .andWhere('lot.remainingQuantity > 0')
  .orderBy('lot.createDate', 'ASC')
  .addOrderBy('lot.id', 'ASC')
  .getMany();
```

### 2.3 The 5 FIFO consumption loops — differences that MUST be preserved

| Caller | Creates `MaterialIssuingLot` | Creates `MaterialTransaction` | Stock update | Tx manager |
|--------|:---:|:---:|---|---|
| `createIssuingWithDocument` | yes | yes | manual subtract | `manager` (dataSource.tx) |
| `createIssuingFromBom` | yes | yes | manual subtract | `manager` (dataSource.tx) |
| `createManualIssue` | yes | yes | manual subtract | `queryRunner.manager` |
| `createProductionIssue` | yes | **NO** | `manager.decrement()` | `queryRunner.manager` |
| `createIssuingFromMaterialBom` | yes | **NO** | manual subtract | `manager` (dataSource.tx) |

→ The shared helper must accept a **manager** parameter (works for both `dataSource.tx` and `queryRunner` — both are `EntityManager`) plus **option flags** (`createTransaction`, `stockUpdateMode`).

---

## 3. Target Structure

```
src/modules/materials/receiving-issuing/
├── receiving-issuing.module.ts          (updated — register sub-services)
├── receiving-issuing.controller.ts      (UNCHANGED — still injects facade)
├── receiving-issuing.service.ts         (FACADE — ~90 lines, pure delegation)
├── services/
│   ├── receiving.service.ts             ~140 lines
│   ├── issuing.service.ts               ~450 lines (6 issuing methods)
│   ├── transaction-query.service.ts     ~360 lines (9 query methods)
│   ├── material-issue.service.ts        ~120 lines (4 CRUD + generateIssueNo)
│   ├── traceability.service.ts          ~190 lines (3 methods + packIssuingTraceback)
│   └── transaction-report.service.ts    ~230 lines (getTransactionReport)
├── helpers/
│   └── fifo-lot-consumption.helper.ts   ~130 lines (1 fetch + 1 consume, parameterized)
├── entities/                            (UNCHANGED)
├── dto/                                 (UNCHANGED)
└── index.ts                             (UNCHANGED)
```

### 3.1 Facade contract (receiving-issuing.service.ts)

The facade preserves the **exact same public method signatures** the controller calls today — this is what makes the refactor transparent to the controller.

```ts
@Injectable()
export class ReceivingIssuingService {
  constructor(
    private readonly receiving: ReceivingService,
    private readonly issuing: IssuingService,
    private readonly query: TransactionQueryService,
    private readonly issue: MaterialIssueService,
    private readonly traceability: TraceabilityService,
    private readonly report: TransactionReportService,
  ) {}

  // Receiving
  createReceiving = (dto) => this.receiving.createReceiving(dto);

  // Issuing (6)
  createIssuingWithDocument = (dto) => this.issuing.createIssuingWithDocument(dto);
  createIssuingFromBom = (dto) => this.issuing.createIssuingFromBom(dto);
  createIssuingFromMaterialBom = (dto, user) => this.issuing.createIssuingFromMaterialBom(dto, user);
  createManualIssue = (dto, user) => this.issuing.createManualIssue(dto, user);
  createProductionIssue = (dto, user) => this.issuing.createProductionIssue(dto, user);
  previewProductionIssue = (dto) => this.issuing.previewProductionIssue(dto);

  // Query (9) → query.*
  // Material Issue (4) → issue.*
  // Traceability (3) → traceability.*
  // Report (1) → report.*
}
```

> **Note:** Final facade will use normal methods (not arrow-field shorthand) to match existing code style. Shown as arrow fields only to keep this spec compact.

### 3.2 Sub-service dependency map

| Sub-service | Owns (repositories) | Depends on |
|-------------|---------------------|------------|
| `ReceivingService` | MaterialReceiving, MaterialReceivingLot, MaterialTransaction, Material, MaterialsStock | `PcReceivingBusiness`, `DataSource`, `FifoLotConsumptionHelper` (no — receiving creates lots, doesn't consume) |
| `IssuingService` | MaterialIssuing, MaterialIssuingLot, MaterialIssuingDocument, MaterialTransaction, Material, MaterialsStock, IssuingType, MaterialIssue, MaterialIssueItem, MaterialIssueDocument, Product, ProductBom | `DataSource`, `FifoLotConsumptionHelper` |
| `TransactionQueryService` | MaterialReceiving, MaterialReceivingLot, MaterialIssuing, IssuingType, MaterialsStock | `QrScanLogService` |
| `MaterialIssueService` | MaterialIssue, MaterialIssueItem, MaterialIssueDocument | — |
| `TraceabilityService` | MaterialReceivingLot, MaterialIssuingLot, MaterialIssuing, ProductionOrder | — |
| `FifoLotConsumptionHelper` | — (stateless, takes `EntityManager`) | — |

### 3.3 The FIFO helper signature

```ts
@Injectable()
export class FifoLotConsumptionHelper {
  /** Identical to the 5 duplicated blocks. */
  async findAvailableLots(
    manager: EntityManager,
    materialId: number,
  ): Promise<MaterialReceivingLot[]>;

  /** Parameterized consume loop — preserves every behavior variant. */
  async consumeLotsFifo(
    manager: EntityManager,
    ctx: {
      issuingId: number;
      materialId: number;
      quantity: number;
      unit: string;
      /** 'subtract' = manual load/save, 'decrement' = manager.decrement() */
      stockUpdateMode: 'subtract' | 'decrement';
      /** Whether to write MaterialTransaction rows. */
      createTransactions: boolean;
      /** Transaction row context (required when createTransactions=true). */
      transactionContext?: {
        referenceNo: string;
        remark: string;
        createBy: string;
        transactionDate: Date;
      };
    },
  ): Promise<void>;
}
```

The 5 call sites collapse to:
```ts
await this.fifoHelper.consumeLotsFifo(manager, {
  issuingId: savedIssuing.id,
  materialId: dto.materialId,
  quantity: dto.quantity,
  unit: material.unitMaster?.code || 'PCS',
  stockUpdateMode: 'subtract',
  createTransactions: true,
  transactionContext: { referenceNo: issuingNo, remark: dto.remark, createBy: ..., transactionDate: new Date() },
});
```

---

## 4. Refactor Strategy — Behavior Preservation

### 4.1 The golden rule
**At no point during the refactor may a green test turn red.** Every commit must leave the suite green. If the test suite goes red on a move/extract, the move was not behavior-preserving and must be reverted and re-tried.

### 4.2 Characterization tests written BEFORE refactor

**Test infra reality (verified during spec self-review):** The project currently has **zero DB test infrastructure**. The 3 existing specs (`app.controller.spec.ts`, `common.service.spec.ts`, `auth-sanitize-user.interceptor.spec.ts`) are pure unit tests with no database. There is no `.env.test`, no test DB connection helper, no transactional-rollback-per-test utility.

Given the goal is a **pure refactor** (not adding infra), we will **not** spin up a real test PostgreSQL in this refactor. Instead we use **mocked-repository characterization tests**, which is the appropriate safety net for a MOVE refactor:

> For a move/extract refactor, what we must prove is that the new code issues **the same sequence of DB operations with the same arguments** as the old inline code. Mock-based tests verify exactly this — they assert "given lots X/Y/Z, the code under test calls `manager.save(MaterialIssuingLot)` 3 times with these exact payloads, then `manager.decrement(MaterialsStock, ...)` once". That is the regression guard a pure refactor needs.

If a real-DB integration suite is wanted later (recommended as a follow-up), that is a separate effort — see §6.

Target: cover the methods with the highest duplication risk (FIFO) and the most complex pure logic (report). All tests use `jest.mock` / manual `EntityManager` stubs.

| Test file | Covers | What it snapshots |
|-----------|--------|-------------------|
| `receiving-issuing.service.spec.ts` | All 5 FIFO call sites (pre-extraction) | The ordered sequence of `manager.create` / `manager.save` / `manager.decrement` calls and their payloads per variant — proving the behavior we must preserve |
| `transaction-report.service.spec.ts` | `getTransactionReport` | Row count, grouping key, running balance, sort order — fed a canned `transactionRepository.createQueryBuilder(...).getMany()` result |
| `traceability.service.spec.ts` | All 3 traceability methods | Shape of returned object, `direction` field, nested mapping — with canned repository returns |
| `fifo-lot-consumption.helper.spec.ts` | `consumeLotsFifo` directly (written alongside extraction in Phase 1) | Every option combination (`createTransactions` true/false × `stockUpdateMode` subtract/decrement) — this becomes the post-refactor regression guard |

> These tests assert **current** behavior (including quirks like `createProductionIssue` not writing transactions), not "correct" behavior. They are the safety net.

### 4.3 Move/extract order (each step = 1 commit, tests green)

Executed incrementally. Each phase below is independently revertible.

**Phase 0 — Tests (no production code changes)**
1. Write the 4 spec files above against the current `ReceivingIssuingService`.
2. Run `pnpm test` — all green. Commit.

**Phase 1 — Extract `FifoLotConsumptionHelper` (highest-risk extraction first)**
3. Create `helpers/fifo-lot-consumption.helper.ts` with `findAvailableLots`.
4. Replace the 5 identical fetch blocks with `helper.findAvailableLots(...)`. Run tests. Commit.
5. Move the 5 consume-loop bodies into `helper.consumeLotsFifo(...)`, parameterized by options. Replace each call site. Run tests after **each** of the 5 call sites. Commit.
   - This is the riskiest step. The table in §2.3 is the checklist for option flags per call site.

**Phase 2 — Extract query sub-services (mechanical moves, lowest risk)**
6. Create `transaction-query.service.ts`. Move 9 query methods + their repositories + `QrScanLogService` dep. Facade delegates. Run tests. Commit.
7. Create `material-issue.service.ts`. Move 4 issue-CRUD methods + `generateIssueNo`. Run tests. Commit.
8. Create `traceability.service.ts`. Move 3 methods + private `packIssuingTraceback`. Run tests. Commit.
9. Create `transaction-report.service.ts`. Move `getTransactionReport`. Run tests. Commit.

**Phase 3 — Extract write sub-services**
10. Create `receiving.service.ts`. Move `createReceiving`. Run tests. Commit.
11. Create `issuing.service.ts`. Move the 6 issuing methods (they now call `FifoLotConsumptionHelper` from step 5). Run tests. Commit.

**Phase 4 — Facade thinning + module wiring**
12. Reduce `receiving-issuing.service.ts` to pure delegation (§3.1). Run tests. Commit.
13. Update `receiving-issuing.module.ts` to register all sub-services as providers and wire exports. Run tests + `pnpm build`. Commit.

### 4.4 Verification at the end
- `pnpm test` — all characterization tests still green (behavior unchanged).
- `pnpm build` — type-check passes.
- `pnpm lint` — no new lint errors.
- File-size check: every new file ≤ 300 lines (matches `coding-rules.md`).
- Git diff review: controller diff = 0 lines changed.

---

## 5. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| FIFO helper changes transaction semantics | High | Mock-based characterization tests on all 5 call sites **before** extraction (Phase 0); tests re-run after **each** call-site replacement |
| `createProductionIssue`'s `decrement()` produces different SQL than manual subtract | Medium | The `stockUpdateMode` option preserves the original code path — no unification. Test covers both modes by asserting the exact `manager.decrement` vs `manager.save(stock)` call. |
| Mock-based tests miss a real-DB behavior (e.g. a TypeORM quirk) | Medium | Acknowledged limitation. Mocks verify *the operations we write*, which is what a pure refactor changes. A real-DB integration suite is parked as a follow-up (§6), not in scope here. |
| Facade delegation breaks DI (circular import) | Low | Sub-services depend only on TypeORM repos + helper + audit service; facade depends on sub-services only — one-directional |
| `queryRunner` vs `dataSource.transaction` manager behaves differently in helper | Medium | Helper takes `EntityManager` (common base of both). No `queryRunner`-specific API used in the loops. |

---

## 6. Out-of-scope follow-ups (parked, not done now)

These were noticed during analysis but are explicitly **not** part of this refactor (would violate "pure refactor"):
- **Set up real-DB integration test infra** (test PostgreSQL, `.env.test`, per-test transactional rollback). The refactor here uses mock-based tests as its safety net (see §4.2); a real-DB suite is a worthwhile separate effort.
- Normalize the 6 issuing methods' transaction style (`queryRunner` vs `dataSource.transaction`).
- Make `createProductionIssue` write `MaterialTransaction` rows like its siblings.
- The `createIssuingFromMaterialBom(dto: any, ...)` untyped DTO.
- Extract `packIssuingTraceback` to a separate mapper if traceability.service.ts still feels heavy.

---

## 7. Success Criteria

- [ ] `receiving-issuing.service.ts` ≤ 100 lines (pure facade)
- [ ] Every new file ≤ 300 lines
- [ ] `pnpm test` green before and after refactor (same assertions)
- [ ] `pnpm build` passes
- [ ] `receiving-issuing.controller.ts` has **zero** diff
- [ ] No public method signature changes on the facade
- [ ] FIFO duplication eliminated: 5 → 1 shared helper
