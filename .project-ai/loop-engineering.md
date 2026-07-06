# Loop Engineering

## Core Principle

AI must not solve everything at once. It must work in small loops:

**Context → Plan → Change → Validate → Summarize**

Each loop focuses on one logical change, validates it, and summarizes before proceeding to the next loop. This ensures safety, reduces token usage, and prevents cascading errors.

## Loop Steps

For every task, follow these steps in order:

### 1. Read Project Context
- Read relevant `.project-ai/` documentation files
- Start with summary docs (project-context.md, architecture.md)
- Then read specific docs (api-map.md, database-map.md, domain-rules.md)
- Read coding-rules.md for standards
- Only read source files after understanding context

### 2. Identify Affected Area
- Determine which module is affected (auth, materials, products, sales, etc.)
- Identify the layer (controller, service, entity, DTO)
- Check for related files and dependencies
- Note any cross-module dependencies

### 3. Find Existing Pattern
- Search for similar code in the same module
- Read existing controller, service, entity patterns
- Identify authentication/authorization patterns used
- Note validation patterns and response formats
- Follow the exact same pattern unless there's a reason not to

### 4. Create a Small Plan
- Define ONE logical change for this loop
- Examples of valid single changes:
  - Add one DTO field
  - Add one service method
  - Add one controller route
  - Add one entity column
  - Fix one bug
- Estimate which files need to be modified
- Plan validation approach

### 5. Modify Only Necessary Files
- Make only the planned change
- Modify only the files identified in the plan
- Follow existing patterns exactly
- Use ResponseHelper for consistent responses
- Add comments for complex logic
- Do not make "while I'm here" additions

### 6. Validate with Tests, Build, Lint, or Manual Check
- Run linter: `pnpm run lint`
- Check TypeScript compilation
- Run tests: `pnpm run test` (if applicable)
- Manual test the endpoint if possible
- Verify database operations work (if applicable)
- Check logs for errors
- Verify response format matches existing patterns

### 7. Summarize Result
- Document what was changed
- List files modified
- Note any side effects
- Identify any remaining risks
- Recommend next loop if needed

### 8. Stop When Unclear
- If business rule is unclear, mark as "Needs confirmation" and stop
- If multiple valid approaches exist, ask for preference
- If change affects critical system, get approval
- If unsure about next step, ask for guidance
- Never proceed with uncertainty

## Stop Rules

AI must stop and ask/mark "Needs confirmation" when:

### Business Rule is Unclear
- The business logic is not documented in domain-rules.md
- Multiple interpretations of a requirement exist
- The rule is marked as "Needs confirmation" in documentation
- Unclear about approval workflows, validation rules, or status transitions

### Database Field Meaning is Unclear
- Column name is ambiguous (e.g., "type", "status", "flag")
- Field purpose is not clear from entity or migration
- Relationship between tables is unclear
- Data type or constraints are uncertain

### Existing Behavior Conflicts with Requirement
- Current implementation works differently than requested
- Changing behavior might break existing functionality
- Requirement contradicts established patterns
- No clear way to reconcile conflict

### Change May Affect Critical Systems
AI must stop when the change affects:
- **Payment or financial data** - Any calculations, totals, discounts
- **Status transitions** - Order status, production status, approval status
- **Approval workflows** - Who can approve, approval levels, approval chains
- **Permissions** - Access control, role assignments, department scoping
- **Audit logs** - What gets logged, when, by whom

### Document Uncertainty
When stopping, document as:
```markdown
# Uncertainty: [Topic]
**Status**: Needs confirmation
**Question**: [What is unclear]
**Context**: [Relevant information]
**Options**: [Possible approaches]
**Decision**: Pending user input
```

## Token-Saving Rules

### Read Summary Docs First Before Reading Many Source Files
- Always start with `.project-ai/project-context.md`
- Then read `.project-ai/architecture.md`
- Read specific docs (api-map.md, database-map.md, domain-rules.md) as needed
- Only read source files after understanding the big picture
- This prevents loading unnecessary files

### Search Targeted Files Only
- Use grep to find specific patterns instead of reading entire directories
- Search for specific function names, class names, or decorators
- Use file search with specific extensions (e.g., `*.controller.ts`)
- Read only the files that are directly relevant to the change

### Reuse API Map and Database Map
- Check `api-map.md` for endpoint information instead of reading controllers
- Check `database-map.md` for schema information instead of reading entities
- Use these maps to understand structure without loading source files
- Only read source files when implementation details are needed

### Avoid Loading Unrelated Folders
- Don't read entire module directories
- Focus on specific files within the module
- Skip test files unless writing tests
- Skip migration files unless making schema changes
- Avoid reading libs/ unless using shared utilities

### Update Documentation After Discovering New Rules
- When you discover a new pattern or rule, update the relevant .project-ai/ file
- Add learned patterns to `coding-rules.md`
- Update `domain-rules.md` with confirmed business rules
- Update `api-map.md` with new endpoints
- This helps future loops be more efficient

## Output Template

Every AI loop must report in this format:

```markdown
## Loop Summary

### Goal
[Brief description of what this loop accomplished]

### Files Inspected
- [file path 1]
- [file path 2]
- [file path 3]

### Files Changed
- [file path 1] - [brief change description]
- [file path 2] - [brief change description]

### Validation Result
- ✅ Linter passes (pnpm run lint)
- ✅ TypeScript compiles
- ✅ Tests pass (if applicable)
- ✅ Manual test completed (if applicable)
- ✅ Response format verified (if API change)
- ✅ Database operations verified (if applicable)

### Remaining Risk
- [Any identified risks or concerns]
- [Any areas that need further testing]
- [Any dependencies that might be affected]

### Next Recommended Loop
[Description of what should be done in the next loop, if needed]
[If task is complete, state "Task complete"]
```

## Example Loop Output

```markdown
## Loop Summary

### Goal
Add delivery_round field to orders table and entity

### Files Inspected
- .project-ai/database-map.md
- src/modules/sales/entities/order.entity.ts
- database/migrations/ (checked latest migration number)

### Files Changed
- database/migrations/088-add-delivery-round-fields.sql - Created migration to add delivery_round column
- src/modules/sales/entities/order.entity.ts - Added deliveryRound property with @Column decorator

### Validation Result
- ✅ Linter passes (pnpm run lint)
- ✅ TypeScript compiles
- ✅ Migration SQL syntax verified
- ✅ Entity mapping verified

### Remaining Risk
- Migration needs to be run on development database
- DTOs need to be updated to include delivery_round field
- API responses will include new field - need to verify frontend compatibility

### Next Recommended Loop
Update CreateOrderDto and UpdateOrderDto to include delivery_round field with validation decorators
```
