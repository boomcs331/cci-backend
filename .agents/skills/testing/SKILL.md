# Testing Skill

## Purpose
Guide AI agents in writing, running, and maintaining tests for the NestJS backend application following Loop Engineering principles.

## When to Use
- Writing unit tests for new code
- Writing E2E tests for endpoints
- Updating tests for code changes
- Debugging test failures
- Improving test coverage

## Required Context Files (Read First)
1. `.project-ai/test-guide.md` - Testing guide and patterns
2. `.project-ai/coding-rules.md` - Coding standards
3. `.project-ai/architecture.md` - System architecture
4. `.project-ai/loop-engineering.md` - Loop principles

## Step-by-Step Workflow

### Step 1: Understand What to Test
- Identify the code/functionality to test
- Determine test type (unit/E2E)
- Identify happy path and edge cases
- Check if similar tests exist

### Step 2: Read Existing Tests
- Read similar test files for patterns
- Understand test setup/teardown
- Check mocking patterns
- Review assertion patterns

### Step 3: Plan Test Cases
- List happy path scenarios
- List error scenarios
- List edge cases
- List integration scenarios
- Plan test structure

### Step 4: Write Test Setup (One Loop)
- Set up test module
- Mock dependencies
- Configure test database if needed
- Set up beforeEach/afterEach
- Keep setup separate from test cases

### Step 5: Write Test Cases (One Loop per Case)
- Write one test case at a time
- Follow AAA pattern (Arrange-Act-Assert)
- Use descriptive test names
- Add assertions
- Run test to verify

### Step 6: Run Tests
- Run specific test file: `pnpm run test file.spec.ts`
- Run all tests: `pnpm run test`
- Check for failures
- Debug if needed

### Step 7: Update Documentation
- Update test-guide.md if new patterns
- Document any special test setup
- Add comments for complex tests

### Step 8: Summarize
- Document tests added
- Note coverage changes
- List any issues found

## Safety Rules

### Before Writing Tests
- ✅ Understand what to test
- ✅ Read existing test patterns
- ✅ Plan test cases
- ✅ Identify dependencies to mock
- ❌ Never write tests without understanding code
- ❌ Never skip edge cases
- ❌ Never test implementation details

### During Testing
- ✅ Follow AAA pattern
- ✅ Use descriptive names
- ✅ Mock external dependencies
- ✅ Test behavior, not implementation
- ✅ Handle async/await properly
- ❌ Never test trivial code
- ❌ Never hardcode test data excessively
- ❌ Never skip error scenarios

### After Testing
- ✅ Run all tests
- ✅ Check coverage
- ✅ Fix any failures
- ✅ Update documentation
- ❌ Never commit failing tests
- ❌ Never skip test fixes
- ❌ Never ignore coverage warnings

## Output Format

### Test Addition Summary
```markdown
## Test Addition Summary

**Test Type**: [unit/E2E]
**Files Tested**: [list of files]
**Test File**: [test file path]

### Test Cases Added
1. [test case 1 description]
2. [test case 2 description]
3. [test case 3 description]

### Coverage
- **Before**: [percentage]%
- **After**: [percentage]%
- **Change**: [+/- percentage]%

### Validation
- ✅ All tests pass
- ✅ No regressions
- ✅ Coverage improved

### Files Modified
- [test file path]
- [source file if test fixtures added]
```

## Validation Checklist

### Test Quality
- [ ] Tests follow AAA pattern
- [ ] Descriptive test names
- [ ] Tests are independent
- [ ] Proper setup/teardown
- [ ] No flaky tests
- [ ] Tests are fast

### Test Coverage
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Integration scenarios covered
- [ ] Coverage target met (80%+)

### Mocking
- [ ] External dependencies mocked
- [ ] Database mocked (for unit tests)
- [ ] HTTP requests mocked
- [ ] Mocks are realistic
- [ ] No over-mocking

### Assertions
- [ ] Assertions are meaningful
- [ ] Error messages checked
- [ ] Return values verified
- [ ] Side effects verified
- [ ] No redundant assertions

## Common Test Patterns

### Unit Test Template
```typescript
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
});
```

### Controller Test Template
```typescript
describe('FeatureController', () => {
  let controller: FeatureController;
  let service: FeatureService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
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
});
```

### E2E Test Template
```typescript
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
        .expect(200);
    });
  });
});
```

### DTO Validation Test
```typescript
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
  });
});
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm run test

# Run specific file
pnpm run test feature.service.spec.ts

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov
```

### E2E Tests
```bash
# Run all E2E tests
pnpm run test:e2e

# Run specific E2E test
pnpm run test:e2e feature.e2e-spec.ts
```

## Mocking Patterns

### Repository Mock
```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

### Service Mock
```typescript
const mockService = {
  method: jest.fn(),
  anotherMethod: jest.fn(),
};
```

### Guard Mock
```typescript
const mockGuard = {
  canActivate: jest.fn((context) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1, roles: ['ADMIN'] };
    return true;
  }),
};
```

## When to Stop and Ask
- Test scenario is unclear → Ask for clarification
- Complex test setup needed → Ask for approach
- Coverage target not met → Discuss strategy
- Test is flaky → Investigate and ask for help
- E2E test failing due to environment → Check setup

## Debugging Tests

### Common Issues
- **Test timeout**: Increase timeout or check for infinite loops
- **Mock not working**: Verify mock is properly provided
- **Async issues**: Check async/await usage
- **Database connection**: Ensure test database is running
- **Dependency issues**: Check all dependencies are mocked

### Debugging Techniques
```typescript
// Add console logs
console.log('Debug:', variable);

// Use debugger
debugger;

// Increase timeout
it('test name', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Best Practices
- Test behavior, not implementation
- Keep tests simple and focused
- Use descriptive test names
- One assertion per test when possible
- Mock external dependencies
- Keep tests fast
- Avoid test interdependence
- Use test fixtures for complex data
- Run tests before committing
- Maintain good coverage
