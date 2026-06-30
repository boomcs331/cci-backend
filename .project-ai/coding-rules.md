# Coding Rules

## TypeScript/JavaScript Rules

### General
- Use **TypeScript strict mode** - no `any` types unless absolutely necessary
- Use **ESLint** for linting - run `pnpm run lint` before committing
- Use **Prettier** for formatting - run `pnpm run format`
- Use **meaningful variable/function names** - avoid abbreviations
- Add **JSDoc comments** for complex functions and public APIs

### File Naming
- **Files**: kebab-case (e.g., `auth.controller.ts`, `user-role-assignment.entity.ts`)
- **Classes**: PascalCase (e.g., `AuthService`, `UserController`)
- **Interfaces/Types**: PascalCase (e.g., `UserRole`, `LoginDto`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_DEV_ORIGIN_PATTERN`)

### Import Order
```typescript
// 1. Node.js built-in modules
import { join } from 'path';

// 2. External packages
import { Module } from '@nestjs/common';
import { Entity, Column } from 'typeorm';

// 3. Internal modules (from @app/...)
import { DatabaseModule } from '@app/common';

// 4. Relative imports
import { User } from './entities/user.entity';
```

## NestJS Specific Rules

### Module Structure
Each module MUST contain:
- `*.module.ts` - Module definition
- `controllers/` - HTTP controllers
- `services/` - Business logic
- `entities/` - TypeORM entities (if database interaction)
- `dto/` - Data transfer objects
- `guards/` - Authorization guards (if needed)
- `interceptors/` - Request/response transformers (if needed)

### Controller Rules
- Use **@Controller()** decorator with route prefix
- Use **HTTP method decorators** (@Get, @Post, @Put, @Patch, @Delete)
- Use **@Body(), @Param(), @Query()** decorators for parameters
- Return **consistent response format** using response helper
- Add **appropriate status codes** (201 for creation, 204 for no content)

### Service Rules
- Use **@Injectable()** decorator
- Inject dependencies via **constructor**
- Use **async/await** for database operations
- Handle errors appropriately
- Keep business logic in services, not controllers

### DTO Rules
- Use **class-validator** decorators for validation
- Use **class-transformer** for transformation if needed
- Extend **base DTO classes** if common fields exist
- Use **partial types** for update DTOs (e.g., `PartialType(CreateDto)`)

### Entity Rules
- Use **@Entity()** decorator with schema parameter
- Use **@Column()** with appropriate type options
- Define **@PrimaryGeneratedColumn()** for primary keys
- Use **@Index()** for frequently queried columns
- Define **relations** with @OneToMany, @ManyToOne, etc.
- Use **cascade** options carefully

### Guard Rules
- Implement **CanActivate** interface
- Use **@UseGuards()** decorator on controllers or methods
- Set **metadata** using custom decorators (@Roles, @Departments)
- Return **boolean** from canActivate method

## Database Rules

### Entity Definitions
- Always specify **schema** in @Entity decorator
- Use **snake_case** for database column names
- Use **camelCase** for TypeScript property names
- Add **@Column({ name: 'snake_case_name' })** mapping if different
- Define **appropriate column types** (varchar, int, timestamp, etc.)

### Migration Rules
- Use **sequential numbering** (e.g., 088-add-new-feature.sql)
- Use **descriptive names** for migration files
- Write **idempotent migrations** (can be run multiple times safely)
- Add **rollback comments** if possible
- Test migrations on development database first

### Query Rules
- Use **TypeORM QueryBuilder** for complex queries
- Use **repository methods** for simple CRUD
- Avoid **N+1 queries** - use relations or joins
- Use **pagination** for large result sets
- Add **indexes** for frequently queried columns

## API Design Rules

### Route Naming
- Use **kebab-case** for route paths (e.g., `/production-orders`)
- Use **plural nouns** for collections (e.g., `/products`, `/materials`)
- Use **RESTful conventions**:
  - GET /resource - List all
  - GET /resource/:id - Get one
  - POST /resource - Create
  - PUT /resource/:id - Update (full)
  - PATCH /resource/:id - Update (partial)
  - DELETE /resource/:id - Delete

### Response Format
Use consistent response format:
```typescript
{
  success: true,
  data: {...},
  message: "Success message",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

Error response:
```typescript
{
  success: false,
  code: "ERROR_CODE",
  message: "Error message",
  errors: [...],
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### Validation
- Use **class-validator** decorators in DTOs
- Add **custom validators** in `src/common/validation/` for complex rules
- Use **global ValidationPipe** for automatic validation
- Return **detailed validation errors** with field names

## Error Handling Rules

### Error Codes
Use **PcErrorCode** enum from `src/shared/errors/pc-error.codes.ts`:
- VALIDATION_FAILED
- UNAUTHORIZED
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- INTERNAL_ERROR

### Exception Handling
- Use **NestJS built-in exceptions** (BadRequestException, NotFoundException, etc.)
- Use **global HttpExceptionFilter** for consistent error responses
- Log errors appropriately using logger
- Never expose sensitive information in error messages

## Security Rules

### Authentication
- Use **JWT** for authentication
- Validate **JWT tokens** using JwtAuthGuard
- Set **appropriate token expiration**
- Store secrets in environment variables

### Authorization
- Use **role-based access control (RBAC)**
- Use **department-scoped permissions**
- Apply **guards** at controller level
- Use **custom decorators** (@Roles, @Departments) for metadata

### Data Validation
- **Never trust user input**
- Validate on **both client and server**
- Sanitize data before database operations
- Use **parameterized queries** (TypeORM handles this)

### Sensitive Data
- Never commit **.env** files
- Never log **passwords, tokens, or sensitive data**
- Use **environment variables** for configuration
- Implement **rate limiting** for public endpoints

## Testing Rules

### Unit Tests
- Write tests for **complex business logic**
- Mock external dependencies
- Test **happy path and error cases**
- Use **descriptive test names**

### Integration Tests
- Test **API endpoints**
- Use **test database**
- Clean up test data after tests
- Test **authentication and authorization**

## Code Organization Rules

### File Size
- Keep files under **300 lines** when possible
- Split large files into smaller, focused modules
- Extract common logic to shared utilities

### Code Duplication
- **DRY principle** - Don't Repeat Yourself
- Extract common code to **shared libraries** or **utilities**
- Use **inheritance** or **composition** for shared behavior

### Comments
- Add comments for **complex business logic**
- Add comments for **non-obvious decisions**
- Keep comments **up-to-date**
- Remove **obsolete comments**

## Performance Rules

### Database
- Use **indexes** on frequently queried columns
- Avoid **SELECT *** - specify columns needed
- Use **pagination** for large datasets
- Use **caching** for frequently accessed data

### API
- Use **lazy loading** for relations
- Implement **pagination** for list endpoints
- Use **compression** for large responses
- Optimize **N+1 queries**

## Git Workflow Rules

### Commit Messages
- Use **conventional commits** format:
  - `feat: add new feature`
  - `fix: fix bug`
  - `refactor: refactor code`
  - `docs: update documentation`
  - `test: add tests`
  - `chore: maintenance tasks`

### Branch Naming
- `feature/feature-name`
- `fix/bug-description`
- `refactor/refactor-description`
- `hotfix/critical-fix`

## Environment-Specific Rules

### Development
- Use **start:dev** for hot reload
- Enable **debug logging**
- Use **development database**

### Production
- Use **start:prod** for production build
- Disable **debug logging**
- Use **production database**
- Enable **CORS restrictions**
