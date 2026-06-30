# Test Guide

## Testing Overview

This project uses **Jest** as the testing framework. Tests are organized into unit tests and end-to-end (E2E) tests.

## Test Structure

```
test/
├── jest-e2e.json          # E2E test configuration
src/
├── *.spec.ts             # Unit test files (co-located with source)
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run tests in debug mode
pnpm run test:debug
```

### E2E Tests
```bash
# Run all E2E tests
pnpm run test:e2e
```

## Unit Testing

### Test File Naming
- Unit test files should be named `*.spec.ts`
- Place test files next to the files they test (co-located)
- Example: `auth.service.ts` → `auth.service.spec.ts`

### Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureService } from './feature.service';
import { FeatureEntity } from './entities/feature.entity';

describe('FeatureService', () => {
  let service: FeatureService;
  let repository: Repository<FeatureEntity>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of features', async () => {
      const expectedResult = [
        { id: 1, name: 'Feature 1' },
        { id: 2, name: 'Feature 2' },
      ];
      mockRepository.find.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single feature by id', async () => {
      const expectedResult = { id: 1, name: 'Feature 1' };
      mockRepository.findOne.mockResolvedValue(expectedResult);

      const result = await service.findOne(1);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if feature not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create and return a new feature', async () => {
      const dto = { name: 'New Feature' };
      const expectedResult = { id: 1, ...dto };
      mockRepository.create.mockReturnValue(expectedResult);
      mockRepository.save.mockResolvedValue(expectedResult);

      const result = await service.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedResult);
    });
  });
});
```

### Testing Controllers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

describe('FeatureController', () => {
  let controller: FeatureController;
  let service: FeatureService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureController],
      providers: [
        {
          provide: FeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FeatureController>(FeatureController);
    service = module.get<FeatureService>(FeatureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of features', async () => {
      const expectedResult = [
        { id: 1, name: 'Feature 1' },
        { id: 2, name: 'Feature 2' },
      ];
      mockService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });
});
```

### Testing DTOs

```typescript
import { validate } from 'class-validator';
import { CreateFeatureDto } from './create-feature.dto';

describe('CreateFeatureDto', () => {
  it('should validate with valid data', async () => {
    const dto = new CreateFeatureDto();
    dto.name = 'Valid Name';

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid data', async () => {
    const dto = new CreateFeatureDto();
    dto.name = '';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});
```

### Testing Guards

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FeatureGuard } from './feature.guard';

describe('FeatureGuard', () => {
  let guard: FeatureGuard;

  beforeEach(() => {
    guard = new FeatureGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for valid request', async () => {
    const context: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 1, roles: ['ADMIN'] },
        }),
      }),
    } as any;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should return false for invalid request', async () => {
    const context: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: null,
        }),
      }),
    } as any;

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});
```

## E2E Testing

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('FeatureController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/features (GET)', () => {
    it('should return array of features', () => {
      return request(app.getHttpServer())
        .get('/features')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/features (POST)', () => {
    it('should create a new feature', () => {
      return request(app.getHttpServer())
        .post('/features')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Feature' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Test Feature');
        });
    });
  });
});
```

## Testing Best Practices

### Arrange-Act-Assert Pattern
```typescript
it('should update feature', async () => {
  // Arrange
  const dto = { name: 'Updated Name' };
  const existing = { id: 1, name: 'Old Name' };
  mockRepository.findOne.mockResolvedValue(existing);
  mockRepository.save.mockResolvedValue({ ...existing, ...dto });

  // Act
  const result = await service.update(1, dto);

  // Assert
  expect(result.name).toBe('Updated Name');
  expect(mockRepository.save).toHaveBeenCalled();
});
```

### Test Isolation
- Each test should be independent
- Use `beforeEach` to reset mocks
- Use `afterEach` to clean up
- Don't rely on test execution order

### Descriptive Test Names
```typescript
// Good
it('should throw error when user is not authorized', async () => {
  // ...
});

// Bad
it('should work', async () => {
  // ...
});
```

### Test Coverage Goals
- Aim for **80%+ code coverage**
- Focus on critical business logic
- Test edge cases and error scenarios
- Don't test trivial getters/setters

### Mock External Dependencies
```typescript
// Mock database repository
const mockRepository = {
  find: jest.fn(),
  save: jest.fn(),
};

// Mock external service
const mockExternalService = {
  fetchData: jest.fn(),
};

// Mock environment variables
process.env.SOME_VAR = 'test-value';
```

## Testing Database Operations

### Using Test Database
```typescript
// Configure test database in jest-e2e.json
{
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "username": "test_user",
  "password": "test_password",
  "database": "cci_backend_test",
  "entities": ["src/**/*.entity.ts"],
  "synchronize": true
}
```

### Database Setup/Cleanup
```typescript
beforeAll(async () => {
  // Run migrations
  await runMigrations();
});

afterAll(async () => {
  // Clean up database
  await cleanupDatabase();
});

beforeEach(async () => {
  // Reset database state
  await resetDatabase();
});
```

## Testing Authentication

### Mock JWT Guard
```typescript
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1, username: 'test', roles: ['ADMIN'] };
    return true;
  },
};

// In test module
providers: [
  {
    provide: JwtAuthGuard,
    useValue: mockJwtAuthGuard,
  },
]
```

## Testing File Upload

### Mock FileInterceptor
```typescript
const mockFile = {
  originalname: 'test.jpg',
  buffer: Buffer.from('test'),
  mimetype: 'image/jpeg',
  size: 1000,
};

it('should upload file', async () => {
  const response = await controller.uploadFile(mockFile as any);
  expect(response.filename).toBe('test.jpg');
});
```

## Testing Validation

### Test DTO Validation
```typescript
import { validate } from 'class-validator';

it('should fail validation with empty name', async () => {
  const dto = new CreateFeatureDto();
  dto.name = '';

  const errors = await validate(dto);

  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0].property).toBe('name');
});
```

## Testing Error Handling

### Test Exception Scenarios
```typescript
it('should throw NotFoundException when entity not found', async () => {
  mockRepository.findOne.mockResolvedValue(null);

  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});

it('should handle database errors', async () => {
  mockRepository.save.mockRejectedValue(new Error('Database error'));

  await expect(service.create(dto)).rejects.toThrow();
});
```

## Integration Testing

### Testing Service Integration
```typescript
describe('FeatureService Integration', () => {
  let service: FeatureService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [FeatureModule],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should interact with database', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
```

## Performance Testing

### Test Response Time
```typescript
it('should respond within 100ms', async () => {
  const start = Date.now();
  await service.findAll();
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100);
});
```

## Test Configuration

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!node_modules/**',
    '!dist/**',
    '!test/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
```

### E2E Configuration (test/jest-e2e.json)
```javascript
module.exports = {
  moduleNameMapper: {
    '^@app/common(|/.*)$': '<rootDir>/../libs/common/src/$1',
  },
  testEnvironment: 'node',
};
```

## Common Test Scenarios

### Happy Path
```typescript
it('should successfully create resource', async () => {
  const result = await service.create(validDto);
  expect(result).toBeDefined();
  expect(result.id).toBeDefined();
});
```

### Edge Cases
```typescript
it('should handle empty array', async () => {
  const result = await service.processItems([]);
  expect(result).toEqual([]);
});

it('should handle null input', async () => {
  const result = await service.processItem(null);
  expect(result).toBeNull();
});
```

### Error Scenarios
```typescript
it('should throw error with invalid input', async () => {
  await expect(service.create(invalidDto)).rejects.toThrow();
});

it('should handle concurrent requests', async () => {
  const promises = Array(10).fill(null).map(() => service.findAll());
  const results = await Promise.all(promises);
  expect(results).toHaveLength(10);
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test
      - run: pnpm run test:e2e
      - run: pnpm run test:cov
```

## Troubleshooting

### Common Issues

#### Tests Timing Out
- Increase timeout in jest config
- Check for infinite loops
- Mock slow external dependencies

#### Database Connection Issues
- Ensure test database is running
- Check database credentials in test config
- Clean up database connections after tests

#### Mock Not Working
- Verify mock is properly provided in test module
- Check mock is called before assertions
- Use `jest.clearAllMocks()` in beforeEach

#### Coverage Not Generated
- Check collectCoverageFrom configuration
- Ensure test files match testRegex pattern
- Verify source files are not excluded

## Resources

### Documentation
- Jest Docs: https://jestjs.io/docs/getting-started
- NestJS Testing: https://docs.nestjs.com/fundamentals/testing
- Supertest: https://github.com/visionmedia/supertest

### Internal Resources
- `backend-guide.md` - Backend development guide
- `coding-rules.md` - Coding standards
