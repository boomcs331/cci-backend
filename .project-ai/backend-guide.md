# Backend Guide

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- pnpm package manager
- PostgreSQL database
- Git

### Installation
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=cci_backend

# Server
PORT=3006
NODE_ENV=development

# CORS (optional)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_DEV_ALLOW_LAN=1

# Docker (if using)
DOCKER_CONTAINER=0
```

### Running the Application
```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

## Project Structure

### Directory Layout
```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── materials/    # Materials management
│   ├── products/     # Products management
│   ├── production-plans/    # Production planning
│   ├── production-orders/   # Production execution
│   ├── sales/        # Sales management
│   ├── sales-planning/      # Sales planning
│   └── ai-chat/      # AI chat integration
├── core/             # Core functionality
│   └── audit/        # Audit logging
├── business/         # Business logic layer
├── shared/           # Shared utilities
└── common/           # Common filters, interceptors

libs/
└── common/           # Shared library
    ├── database/     # Database configuration
    ├── logger/       # Logging utilities
    ├── response/     # Response helpers
    └── utils/        # Common utilities

database/
└── migrations/       # SQL migration files

scripts/              # Utility scripts
```

## Module Development

### Creating a New Module
```bash
# Generate module using NestJS CLI
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name
```

### Module Structure Template
```
feature-name/
├── feature-name.module.ts
├── controllers/
│   └── feature-name.controller.ts
├── services/
│   └── feature-name.service.ts
├── entities/
│   └── feature.entity.ts
├── dto/
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
└── guards/ (if needed)
    └── feature.guard.ts
```

### Module Registration
Register in `src/app.module.ts`:
```typescript
import { FeatureModule } from './modules/feature-name/feature-name.module';

@Module({
  imports: [
    // ... other modules
    FeatureModule,
  ],
})
export class AppModule {}
```

## Database Operations

### Entity Definition
```typescript
@Entity({ schema: 'schema_name', name: 'table_name' })
export class FeatureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'column_name' })
  columnName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Repository Pattern
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly featureRepository: Repository<FeatureEntity>,
  ) {}

  async findAll(): Promise<FeatureEntity[]> {
    return this.featureRepository.find();
  }

  async findOne(id: number): Promise<FeatureEntity> {
    return this.featureRepository.findOne({ where: { id } });
  }

  async create(dto: CreateFeatureDto): Promise<FeatureEntity> {
    const entity = this.featureRepository.create(dto);
    return this.featureRepository.save(entity);
  }

  async update(id: number, dto: UpdateFeatureDto): Promise<FeatureEntity> {
    await this.featureRepository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.featureRepository.delete(id);
  }
}
```

### Query Builder for Complex Queries
```typescript
const query = this.featureRepository.createQueryBuilder('feature');

if (filters.status) {
  query.andWhere('feature.status = :status', { status: filters.status });
}

if (filters.search) {
  query.andWhere(
    'feature.name ILIKE :search OR feature.description ILIKE :search',
    { search: `%${filters.search}%` }
  );
}

return query
  .orderBy('feature.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();
```

## API Development

### Controller Template
```typescript
@Controller('resource-path')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(@Query() query: PaginationDto) {
    return this.featureService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.featureService.findOne(+id);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateFeatureDto) {
    return this.featureService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    return this.featureService.update(+id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.featureService.delete(+id);
  }
}
```

### DTO Validation
```typescript
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
```

### Response Formatting
Use response helper from `libs/common/src/response/`:
```typescript
import { ResponseHelper } from '@app/common';

return ResponseHelper.success(data, 'Success message');
```

## Authentication & Authorization

### JWT Guard
```typescript
@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  // Only authenticated users can access
}
```

### Role Guard
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  // Only users with ADMIN role can access
}
```

### Department Guard
```typescript
@Controller('department')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('WELDING', 'PRESS')
export class DepartmentController {
  // Only users in WELDING or PRESS departments can access
}
```

### Custom Decorators
```typescript
// Get current user
@GetUser() user: User

// Get user roles
@Roles() roles: string[]

// Get user departments
@Departments() departments: string[]
```

## Logging

### Using Logger
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  async someMethod() {
    this.logger.log('Processing data');
    this.logger.debug('Debug information');
    this.logger.warn('Warning message');
    this.logger.error('Error occurred', error.stack);
  }
}
```

### Audit Logging
Use audit service for API/auth logging:
```typescript
import { ApiAuditService } from '../core/audit/services/api-audit.service';

@Injectable()
export class FeatureService {
  constructor(private readonly auditService: ApiAuditService) {}

  async someMethod(userId: number) {
    // Method logic
    await this.auditService.logApiCall({
      userId,
      method: 'POST',
      path: '/feature',
      statusCode: 200,
    });
  }
}
```

## Error Handling

### Custom Exceptions
```typescript
import { PcErrorCode } from '../../shared/errors/pc-error.codes';

throw new BadRequestException({
  success: false,
  code: PcErrorCode.VALIDATION_FAILED,
  message: 'Custom error message',
  errors: validationErrors,
});
```

### Global Exception Filter
Already configured in `src/main.ts`. All exceptions are automatically formatted.

## File Upload

### Single File Upload
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Process file
  return { filename: file.filename, path: file.path };
}
```

### Multiple File Upload
```typescript
@Post('upload')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
  // Process files
  return files;
}
```

## Database Migrations

### Creating Migration
```bash
# Create new migration file in database/migrations/
# Use sequential numbering (e.g., 088-add-new-feature.sql)
```

### Migration Template
```sql
-- Migration: 088-add-new-feature.sql
-- Description: Add new feature table

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS schema_name.table_name (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_name_name ON schema_name.table_name(name);

COMMIT;
```

### Running Migrations
```bash
# Run all migrations
pnpm run db:migrate

# Run specific migration
ts-node scripts/run-one-migration.ts migration-number
```

## Testing

### Unit Test Template
```typescript
describe('FeatureService', () => {
  let service: FeatureService;
  let repository: Repository<FeatureEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: getRepositoryToken(FeatureEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    repository = module.get<Repository<FeatureEntity>>(
      getRepositoryToken(FeatureEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests
});
```

### Running Tests
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## Docker Deployment

### Building Docker Image
```bash
docker build -t cci-backend .
```

### Running with Docker Compose
```bash
# Standard deployment
docker compose up -d

# Development
docker compose -f docker-compose.dev.yml up -d

# Host database
docker compose -f docker-compose.host-db.yml up -d
```

## Common Patterns

### Pagination
```typescript
@Injectable()
export class FeatureService {
  async findAll(page: number = 1, limit: number = 10) {
    const [items, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
```

### Transaction Management
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly featureRepository: Repository<FeatureEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async complexOperation() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Perform operations
      await queryRunner.manager.save(FeatureEntity, data1);
      await queryRunner.manager.save(FeatureEntity, data2);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Caching
```typescript
import { Cache } from 'cache-manager';

@Injectable()
export class FeatureService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCachedData(key: string) {
    let data = await this.cacheManager.get(key);
    if (!data) {
      data = await this.fetchFromDatabase();
      await this.cacheManager.set(key, data, { ttl: 3600 });
    }
    return data;
  }
}
```

## Performance Optimization

### Database Indexing
- Add indexes via migrations for frequently queried columns
- Use composite indexes for multi-column queries
- Monitor index usage with EXPLAIN ANALYZE

### Query Optimization
- Use select to limit columns returned
- Use relations parameter to load related data
- Avoid N+1 queries with proper joins
- Implement pagination for large datasets

### Connection Pooling
- Configure connection pool size in database module
- Monitor connection pool usage
- Adjust pool size based on load

## Security Best Practices

### Input Validation
- Always validate DTOs with class-validator
- Sanitize user input
- Use parameterized queries (TypeORM handles this)

### Sensitive Data
- Never log passwords, tokens, or sensitive data
- Use environment variables for secrets
- Implement rate limiting for public endpoints
- Validate file uploads (type, size, content)

### SQL Injection Prevention
- TypeORM automatically prevents SQL injection
- Never concatenate raw SQL with user input
- Use QueryBuilder for dynamic queries

## Debugging

### Enabling Debug Logs
```typescript
// In main.ts or service
this.logger.debug('Debug information');
```

### Database Query Logging
```typescript
// In database module configuration
logging: true,
logger: 'advanced-console',
```

### Using VS Code Debugger
1. Set breakpoints in code
2. Run `pnpm run start:debug`
3. Attach debugger in VS Code

## Monitoring

### Health Checks
```bash
# Check database connection
pnpm run db:health

# Test database connection
pnpm run db:test
```

### Log Files
- Application logs: `logs/` directory
- Audit logs: Stored in database (logs schema)

## Troubleshooting

### Common Issues

#### Database Connection Failed
- Check environment variables
- Verify PostgreSQL is running
- Check network connectivity
- Review database credentials

#### Migration Failed
- Check migration SQL syntax
- Verify table doesn't already exist
- Check for foreign key constraints
- Review migration dependencies

#### CORS Errors
- Verify CORS origins in .env
- Check frontend is sending correct headers
- Ensure backend is running on correct port

#### JWT Token Issues
- Verify JWT_SECRET is set
- Check token expiration
- Ensure token is sent in Authorization header

## Additional Resources

### Documentation
- NestJS Docs: https://docs.nestjs.com
- TypeORM Docs: https://typeorm.io
- class-validator Docs: https://github.com/typestack/class-validator

### Internal Documentation
- `api-map.md` - Complete API endpoint documentation
- `database-map.md` - Database schema documentation
- `domain-rules.md` - Business rules documentation
- `coding-rules.md` - Coding standards and best practices
