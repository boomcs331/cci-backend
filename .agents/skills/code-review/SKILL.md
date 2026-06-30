# Code Review Skill

## Purpose
Guide AI agents in reviewing code changes for quality, correctness, and adherence to project standards following Loop Engineering principles.

## When to Use
- Reviewing pull requests
- Reviewing code changes before commit
- Assessing code quality
- Identifying potential issues
- Ensuring coding standards compliance

## Required Context Files (Read First)
1. `.project-ai/coding-rules.md` - Coding standards
2. `.project-ai/architecture.md` - System architecture
3. `.project-ai/domain-rules.md` - Business rules
4. `.project-ai/loop-engineering.md` - Loop principles

## Step-by-Step Workflow

### Step 1: Understand the Change
- Read the change description
- Identify what was changed
- Understand the purpose of the change
- Check if change aligns with requirements

### Step 2: Read the Code
- Read all modified files
- Understand the implementation
- Check for similar patterns in codebase
- Identify dependencies

### Step 3: Review Code Quality
- Check for coding standard violations
- Verify TypeScript best practices
- Look for code smells
- Check for proper error handling
- Verify naming conventions

### Step 4: Review Correctness
- Verify logic is correct
- Check for edge cases
- Verify business rules compliance
- Check for potential bugs
- Verify data validation

### Step 5: Review Architecture
- Check architectural consistency
- Verify proper layering
- Check for circular dependencies
- Verify proper use of patterns
- Check separation of concerns

### Step 6: Review Security
- Check for security vulnerabilities
- Verify proper authentication/authorization
- Check for SQL injection risks
- Verify input validation
- Check for sensitive data exposure

### Step 7: Review Performance
- Check for N+1 queries
- Verify proper indexing usage
- Check for inefficient algorithms
- Verify proper caching if applicable
- Check for memory leaks

### Step 8: Review Documentation
- Check if code is well-commented
- Verify documentation updated
- Check for complex logic explanation
- Verify API documentation updated
- Check for TODO comments

### Step 9: Provide Feedback
- List issues found
- Provide suggestions
- Highlight good practices
- Request changes if needed
- Approve if acceptable

## Safety Rules

### Before Review
- ✅ Understand the change context
- ✅ Read all modified files
- ✅ Check coding standards
- ✅ Understand business rules
- ❌ Never review without reading code
- ❌ Never skip security review
- ❌ Never approve without understanding

### During Review
- ✅ Be thorough and systematic
- ✅ Provide constructive feedback
- ✅ Explain why changes are needed
- ✅ Suggest improvements
- ✅ Acknowledge good code
- ❌ Never be overly critical
- ❌ Never suggest unnecessary changes
- ❌ Never nitpick minor style issues

### After Review
- ✅ Summarize findings
- ✅ Provide clear action items
- ✅ Explain approval/rejection
- ✅ Document lessons learned
- ❌ Never leave ambiguous feedback
- ❌ Never approve with major issues

## Output Format

### Code Review Summary
```markdown
## Code Review Summary

**Change Description**: [brief description]
**Files Changed**: [number of files]
**Lines Changed**: [number of lines]

### Overall Assessment: [APPROVED/NEEDS CHANGES/REJECTED]

### Issues Found

#### Critical Issues (Must Fix)
1. [Issue description]
   - File: [filename]
   - Line: [line number]
   - Severity: [critical]
   - Suggestion: [how to fix]

#### Major Issues (Should Fix)
1. [Issue description]
   - File: [filename]
   - Line: [line number]
   - Severity: [major]
   - Suggestion: [how to fix]

#### Minor Issues (Nice to Fix)
1. [Issue description]
   - File: [filename]
   - Line: [line number]
   - Severity: [minor]
   - Suggestion: [how to fix]

### Positive Feedback
- [good practice observed]
- [well-implemented feature]
- [clean code]

### Security Concerns
- [any security issues found]
- [recommendations]

### Performance Concerns
- [any performance issues found]
- [recommendations]

### Documentation
- [documentation status]
- [missing documentation]

### Recommendation
[APPROVED/NEEDS CHANGES before approval/REJECTED]
```

## Validation Checklist

### Code Quality
- [ ] Follows coding standards
- [ ] TypeScript best practices
- [ ] Proper naming conventions
- [ ] No code smells
- [ ] Proper error handling
- [ ] No magic numbers
- [ ] No commented-out code

### Correctness
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Business rules followed
- [ ] Data validation present
- [ ] Null checks present
- [ ] Async/await used correctly

### Architecture
- [ ] Architectural consistency
- [ ] Proper layering
- [ ] No circular dependencies
- [ ] Proper pattern usage
- [ ] Separation of concerns
- [ ] Single responsibility

### Security
- [ ] Authentication/authorization correct
- [ ] Input validation present
- [ ] SQL injection prevented
- [ ] XSS prevention if applicable
- [ ] Sensitive data protected
- [ ] No hardcoded secrets

### Performance
- [ ] No N+1 queries
- [ ] Efficient algorithms
- [ ] Proper indexing used
- [ ] No memory leaks
- [ ] Proper pagination
- [ ] Caching if needed

### Testing
- [ ] Tests added for new code
- [ ] Tests cover edge cases
- [ ] Tests are meaningful
- [ ] No test regressions

### Documentation
- [ ] Code comments where needed
- [ ] Complex logic explained
- [ ] API docs updated
- [ ] README updated if needed
- [ ] No TODO comments left

## Common Issues to Look For

### TypeScript Issues
- Missing type annotations
- Use of `any` type
- Incorrect type assertions
- Missing null checks
- Incorrect generic usage

### NestJS Issues
- Missing dependency injection
- Incorrect module imports
- Missing guards/decorators
- Incorrect middleware usage
- Wrong lifecycle hooks

### Database Issues
- N+1 query problem
- Missing indexes
- Incorrect relationships
- Missing transactions
- Inefficient queries

### Security Issues
- Missing authentication
- Missing authorization
- SQL injection risk
- XSS vulnerability
- Sensitive data in logs

### Performance Issues
- Inefficient loops
- Unnecessary database calls
- Missing pagination
- Large memory usage
- Blocking operations

### Code Smells
- Duplicate code
- Long methods
- Large classes
- Deep nesting
- Complex conditions

## Review Templates

### Quick Review (Small Changes)
```markdown
## Quick Review

**Change**: [description]
**Files**: [list]

### Status: APPROVED

### Notes
- Code looks good
- Follows patterns
- No issues found
```

### Detailed Review (Large Changes)
```markdown
## Detailed Review

**Change**: [description]
**Files**: [list]

### Status: NEEDS CHANGES

### Critical Issues
[List critical issues]

### Major Issues
[List major issues]

### Minor Issues
[List minor issues]

### Suggestions
[Provide suggestions]

### Positive Aspects
[List good things]
```

## When to Stop and Ask
- Change is too large to review → Suggest splitting
- Architecture change is significant → Get team review
- Security concern is unclear → Get security review
- Performance impact uncertain → Get performance review
- Business rule is unclear → Verify with domain expert

## Best Practices
- Be constructive and helpful
- Explain the "why" behind feedback
- Acknowledge good work
- Focus on important issues
- Provide specific examples
- Suggest improvements, not just point out problems
- Be respectful and professional
- Learn from each review

## Approval Criteria

### Approve If:
- No critical issues
- Major issues are addressed or have clear plan
- Code follows standards
- Tests are adequate
- Documentation is updated
- Security review passed

### Request Changes If:
- Critical issues present
- Major issues without plan
- Standards violations
- Missing tests
- Incomplete documentation
- Security concerns

### Reject If:
- Critical security issues
- Breaking changes without reason
- Completely wrong approach
- No tests for complex logic
- Violates architectural principles
