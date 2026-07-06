# Backend API Development Skill

## Purpose
This skill guides AI agents in creating, fixing, reviewing, and refactoring backend API features in the NestJS application following Loop Engineering principles. It ensures safe, consistent, and pattern-compliant backend development.

## When to Use
- Adding new API endpoints
- Modifying existing endpoints
- Fixing bugs in backend logic
- Refactoring backend code
- Adding validation to endpoints
- Changing request/response formats
- Adding authentication/authorization to endpoints
- Optimizing database queries

## Required Files to Read First
Before starting any backend task, read these files in order:
1. `.project-ai/project-context.md` - Understand project structure and tech stack
2. `.project-ai/architecture.md` - Understand system architecture and layers
3. `.project-ai/backend-guide.md` - Backend development patterns and examples
4. `.project-ai/api-map.md` - Understand existing API structure and endpoints
5. `.project-ai/database-map.md` - Understand database schema and entities
6. `.project-ai/domain-rules.md` - Understand business rules and constraints
7. `.project-ai/coding-rules.md` - Follow coding standards and conventions

## Backend Workflow

Follow this loop for every backend task:

### 1. Read Context
- Read all required context files listed above
- Understand the module you're working with (auth, materials, products, sales, etc.)
- Identify the task type (create, fix, refactor)

### 2. Identify Existing Pattern
- Search for similar endpoints in the same module
- Read controller, service, and entity files for the module
- Identify the pattern used (e.g., pagination, filtering, transactions)
- Note authentication/authorization pattern used

### 3. Trace Route → Controller → Service → Model/Database
- **Route**: Check controller decorator and HTTP method
- **Controller**: Read controller method, parameters, and decorators
- **Service**: Read service method, business logic, and database operations
- **Model/Database**: Read entity definition, column mappings, and relationships
- **Validation**: Check DTOs and validation decorators

### 4. Confirm Business Rule
- Verify business rule in domain-rules.md
- Check if rule is marked as "Needs confirmation"
- If unclear, mark as "Needs confirmation" and stop
- Document the business rule being applied

### 5. Make Small Change
- Make only ONE logical change per loop:
  - Add/update DTO only
  - Add/update service method only
  - Add/update controller route only
  - Add/update entity field only
  - Add migration only
- Follow existing patterns exactly
- Use ResponseHelper for consistent responses
- Keep changes minimal and reversible

### 6. Validate Response Format
- Ensure response uses ResponseHelper.success() or ResponseHelper.error()
- Verify response structure matches existing endpoints
- Check pagination format if applicable
- Verify error responses include proper error codes

### 7. Run Tests or Manual Verification
- Run linter: `pnpm run lint`
- Check TypeScript compilation
- Run tests: `pnpm run test` (if applicable)
- Manual test the endpoint if possible
- Verify database operations work correctly

### 8. Summarize Changes
- Document what was changed
- List files modified
- Note any side effects
- Identify any risks or needs confirmation

## Backend Rules

### Pattern Consistency
- **Do not create new API patterns if an existing pattern already exists** - Always search for similar endpoints in the same module and follow the exact same pattern
- **Do not guess database column names** - Always read the entity file to verify column names use @Column decorator mapping (snake_case in DB, camelCase in TypeScript)
- **Do not change response shape without checking existing usage** - Check api-map.md and existing endpoints to maintain consistent response format
- **Do not bypass authentication or permission checks** - Always use @RequirePermissions decorator or appropriate guards for protected endpoints
- **Do not hardcode business logic without documenting it** - Document complex business logic in comments and update domain-rules.md
- **Keep changes minimal and reversible** - One logical change per loop, easy to rollback if needed

### Database Access
- **Always use TypeORM repository or QueryBuilder** - Never write raw SQL unless absolutely necessary
- **Use transactions for multi-step operations** - Use dataSource.transaction() for operations involving multiple tables
- **Verify entity column mappings** - Check @Column decorator name parameter matches database column name
- **Use proper relationship decorators** - @ManyToOne, @OneToMany, @JoinColumn for relationships
- **Check schema in @Entity decorator** - Ensure schema parameter matches database schema (auth, master, sales, logs, public)

### Response Format
- **Always use ResponseHelper** - Use ResponseHelper.success() for success, ResponseHelper.error() for errors
- **Maintain consistent structure** - { success, message, data, timestamp } format
- **Use proper HTTP status codes** - 200 for success, 201 for creation, 400 for validation errors, 404 for not found
- **Include pagination for list endpoints** - Use ResponseHelper.paginated() or manual pagination object
- **Error responses must include error code** - Use PcErrorCode enum from shared/errors

### Authentication & Authorization
- **Use @RequirePermissions decorator** - Specify permission code (e.g., 'sales_order.read')
- **Resolve user from request** - Use authUserService.resolveUsernameFromRequest(req) for username
- **Extract user ID from headers** - Use x-user-id header or req.user.id
- **Never bypass permission checks** - Always add guards to protected endpoints
- **Check department scoping** - If applicable, verify user has access to the department

### Validation
- **Use class-validator decorators in DTOs** - @IsString, @IsNotEmpty, @IsOptional, etc.
- **Validate input in service layer** - Don't rely solely on DTO validation
- **Provide clear error messages** - Use Thai or English consistently with existing code
- **Handle edge cases** - Null checks, empty arrays, invalid IDs
- **Use custom validators for complex rules** - Add to src/common/validation/ if needed

### Error Handling
- **Use NestJS built-in exceptions** - BadRequestException, NotFoundException, ForbiddenException
- **Log errors appropriately** - Use logger.error() with stack trace
- **Never expose sensitive data in errors** - Don't include passwords, tokens, or internal details
- **Use consistent error format** - Through global HttpExceptionFilter
- **Handle database errors gracefully** - Catch and translate to user-friendly messages

## Output Format

Every backend task must end with this summary:

```markdown
## Backend Task Summary

### Files Changed
- src/modules/[module]/[filename].ts
- src/modules/[module]/dto/[filename].ts
- [other files modified]

### API Affected
- **Endpoint**: [HTTP method] [path]
- **Change Type**: [add/modify/delete/fix]
- **Impact**: [description of impact]

### Business Rule Applied
- **Rule**: [business rule from domain-rules.md]
- **Status**: [Confirmed/Needs confirmation]
- **Reference**: [section in domain-rules.md]

### Validation Done
- ✅ Linter passes (pnpm run lint)
- ✅ TypeScript compiles
- ✅ Response format matches existing pattern
- ✅ Authentication/authorization working (if applicable)
- ✅ Manual test completed (if possible)
- ✅ Database operations verified (if applicable)

### Risks / Needs Confirmation
- [Any identified risks]
- [Any business rules that need confirmation]
- [Any potential breaking changes]
- [Any performance concerns]
```

## Final Checklist

Before completing any backend task, verify:

### Context & Understanding
- [ ] Read all required context files
- [ ] Identified existing pattern in codebase
- [ ] Traced route → controller → service → model/database
- [ ] Confirmed business rule in domain-rules.md
- [ ] Understood module structure and dependencies

### Implementation Quality
- [ ] Followed existing patterns exactly
- [ ] Made only ONE logical change per loop
- [ ] Used ResponseHelper for responses
- [ ] Used proper HTTP methods and status codes
- [ ] Added appropriate validation
- [ ] Used correct database column names (verified in entity)
- [ ] Used proper authentication/authorization
- [ ] No hardcoded values or business logic

### Code Quality
- [ ] No linting errors (pnpm run lint)
- [ ] TypeScript compiles successfully
- [ ] Code follows coding-rules.md
- [ ] Added comments for complex logic
- [ ] No TODO comments left

### Testing & Validation
- [ ] Response format matches existing endpoints
- [ ] Manual test completed (if possible)
- [ ] Database operations verified (if applicable)
- [ ] Error handling tested (if applicable)
- [ ] No breaking changes introduced

### Documentation
- [ ] Updated api-map.md (if endpoint changed)
- [ ] Updated domain-rules.md (if business rule changed)
- [ ] Updated database-map.md (if schema changed)
- [ ] Added code comments for complex logic

### Safety
- [ ] Changes are minimal and reversible
- [ ] No sensitive data exposed
- [ ] SQL injection prevented (TypeORM handles)
- [ ] Authentication/authorization not bypassed
- [ ] Transaction used for multi-table operations (if needed)

### Summary
- [ ] Provided task summary with all required fields
- [ ] Listed all files changed
- [ ] Documented API affected
- [ ] Noted business rule applied
- [ ] Identified any risks or needs confirmation

## Common Patterns Reference

### Controller Pattern
```typescript
@Controller('resource-path')
export class ResourceController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Get()
  @RequirePermissions('resource.read')
  async findAll(@Query() query: QueryDto) {
    return this.resourceService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('resource.read')
  async findOne(@Param('id') id: string) {
    return this.resourceService.findOne(id);
  }

  @Post()
  @RequirePermissions('resource.create')
  async create(@Body() dto: CreateDto, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.resourceService.create(dto, username);
  }
}
```

### Service Pattern
```typescript
@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(ResourceEntity)
    private readonly repository: Repository<ResourceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const qb = this.repository.createQueryBuilder('r');

    // Add filters
    if (query.status) {
      qb.andWhere('r.status = :status', { status: query.status });
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return ResponseHelper.success(
      { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
      'OK'
    );
  }

  async create(dto: CreateDto, username: string) {
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(ResourceEntity, {
        ...dto,
        createBy: username,
      });
      const saved = await manager.save(entity);
      return ResponseHelper.success(saved, 'Created successfully');
    });
  }
}
```

### Entity Pattern
```typescript
@Entity({ schema: 'schema_name', name: 'table_name' })
export class ResourceEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'column_name', length: 255 })
  columnName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;

  @ManyToOne(() => RelatedEntity)
  @JoinColumn({ name: 'related_id' })
  related?: RelatedEntity;
}
```

### DTO Pattern
```typescript
export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}

export class QueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
```

## When to Stop and Ask
- Business rule is unclear → Mark as "Needs confirmation" and stop
- Multiple valid approaches exist → Ask for preference
- Breaking change required → Get approval first
- Performance impact uncertain → Ask for review
- Security implications unclear → Get security review
- Database migration needed → Get approval for migration
- Pattern doesn't exist for required feature → Ask for guidance

## Emergency Procedures
If something breaks:
1. **Stop immediately** - Don't make more changes
2. **Identify the last change** - What was just modified?
3. **Revert the change** - Use git or manually revert
4. **Investigate why it broke** - Check logs, error messages
5. **Try different approach** - Use existing patterns
6. **Ask for help if stuck** - Don't spin on issues
