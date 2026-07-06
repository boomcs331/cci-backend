# Bug Fix Skill

## Purpose
Guide AI agents in identifying, diagnosing, and fixing bugs in the NestJS backend application following Loop Engineering principles.

## When to Use
- When a bug is reported
- When tests are failing
- When unexpected behavior is observed
- When error logs indicate issues
- When validation is not working correctly

## Required Context Files (Read First)
1. `.project-ai/loop-engineering.md` - Follow loop principles
2. `.project-ai/coding-rules.md` - Follow coding standards
3. `.project-ai/domain-rules.md` - Understand expected behavior
4. `.project-ai/architecture.md` - Understand system architecture

## Step-by-Step Workflow

### Step 1: Understand the Bug
- Read the bug report carefully
- Identify expected vs actual behavior
- Note any error messages or stack traces
- Identify when the bug occurs
- Check if it's reproducible

### Step 2: Reproduce the Bug
- Try to reproduce the bug locally
- Use the same conditions reported
- Check logs for additional context
- Identify the exact point of failure
- Note any patterns

### Step 3: Read Relevant Code
- Read the code where the bug occurs
- Read related service/controller code
- Check entity definitions
- Review validation rules
- Look for similar working code

### Step 4: Identify Root Cause
- Trace the execution flow
- Check variable values at failure point
- Verify business logic implementation
- Check for edge cases
- Identify the actual cause (not just symptom)

### Step 5: Plan Minimal Fix
- Design the smallest possible fix
- Ensure fix addresses root cause
- Check for side effects
- Verify no regressions
- Consider if tests need updating

### Step 6: Implement Fix (One Loop)
- Make only the minimal change needed
- Don't refactor or add features
- Follow existing patterns
- Add comments if logic is complex
- Keep changes focused

### Step 7: Validate Fix
- Run relevant tests: `pnpm run test`
- Reproduce bug scenario - should be fixed
- Check for regressions
- Run linter: `pnpm run lint`
- Manual test if applicable

### Step 8: Update Documentation (if needed)
- Update domain-rules.md if business rule was incorrect
- Add comments to code explaining fix
- Update api-map.md if API behavior changed
- Document any workarounds removed

### Step 9: Summarize
- Document the bug
- Explain the root cause
- Describe the fix
- Note any side effects
- List files modified

## Safety Rules

### Before Fixing
- ✅ Understand the bug completely
- ✅ Reproduce the bug
- ✅ Identify root cause
- ✅ Plan minimal fix
- ✅ Check for similar issues
- ❌ Never fix without understanding
- ❌ Never fix symptoms only
- ❌ Never make large changes

### During Fix
- ✅ Make minimal changes only
- ✅ Follow existing patterns
- ✅ Add explanatory comments
- ✅ Keep fix focused
- ❌ Never refactor while fixing
- ❌ Never add features while fixing
- ❌ Never change unrelated code

### After Fix
- ✅ Run tests
- ✅ Verify bug is fixed
- ✅ Check for regressions
- ✅ Run linter
- ✅ Update documentation
- ❌ Never skip validation
- ❌ Never leave TODOs
- ❌ Never commit without testing

## Output Format

### Bug Fix Summary
```markdown
## Bug Fix Summary

**Bug Description**: [brief description of bug]
**Severity**: [critical/high/medium/low]

### Root Cause
[Explain what was causing the bug]

### Files Modified
- [file path]
- [file path]

### Changes Made
1. [description of change 1]
2. [description of change 2]

### Validation
- ✅ Bug is fixed
- ✅ No regressions
- ✅ Tests pass
- ✅ Linter passes

### Documentation Updated
- ✅ Code comments added
- ✅ domain-rules.md updated (if needed)
```

## Validation Checklist

### Fix Quality
- [ ] Fix addresses root cause
- [ ] Changes are minimal
- [ ] Code follows existing patterns
- [ ] No linting errors
- [ ] No TypeScript errors

### Testing
- [ ] Bug is no longer reproducible
- [ ] Related tests pass
- [ ] No new test failures
- [ ] Edge cases tested
- [ ] Regression testing done

### Side Effects
- [ ] No breaking changes
- [ ] No performance degradation
- [ ] No security issues introduced
- [ ] No other functionality affected

### Documentation
- [ ] Code comments added if needed
- [ ] Complex logic explained
- [ ] Domain rules updated if needed

## Common Bug Patterns

### Validation Bug
**Symptom**: Validation not working or too strict
**Check**: DTO decorators, ValidationPipe config, custom validators
**Fix**: Update DTO or add custom validator

### Database Bug
**Symptom**: Data not persisting or wrong data returned
**Check**: Entity mapping, repository query, transaction handling
**Fix**: Update entity, fix query, add transaction

### Authorization Bug
**Symptom**: Unauthorized access or access denied incorrectly
**Check**: Guards, decorators, user context
**Fix**: Update guard logic, fix decorator, check user assignment

### Async/Await Bug
**Symptom**: Race conditions, undefined values
**Check**: Missing await, Promise.all usage, error handling
**Fix**: Add await, proper error handling

### Type Mismatch Bug
**Symptom**: Runtime errors, wrong data types
**Check**: TypeScript types, DTO validation, entity types
**Fix**: Update types, add validation

### Null/Undefined Bug
**Symptom**: Cannot read property of undefined
**Check**: Optional chaining, null checks, default values
**Fix**: Add null checks, optional chaining, defaults

## Debugging Techniques

### Log Debugging
```typescript
this.logger.log('Variable value:', variable);
this.logger.debug('Execution flow reached');
this.logger.error('Error occurred', error.stack);
```

### Breakpoint Debugging
1. Set breakpoint in VS Code
2. Run `pnpm run start:debug`
3. Attach debugger
4. Inspect variables
5. Step through code

### Database Query Debugging
```typescript
// Enable query logging in database module
logging: true,
logger: 'advanced-console',
```

### Console Debugging
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
```

## When to Stop and Ask
- Root cause is unclear → Ask for more information
- Multiple possible fixes exist → Ask for preference
- Fix might break other features → Get approval
- Business rule is unclear → Mark as "Needs confirmation"
- Fix requires database migration → Get approval

## Emergency Procedures
If fix makes things worse:
1. Revert the change immediately
2. Re-analyze the bug
3. Try different approach
4. Ask for help if stuck

If fix causes regression:
1. Identify what broke
2. Revert if critical
3. Fix regression separately
4. Test both fixes together

## Prevention Tips
- Add tests for fixed bugs
- Document edge cases
- Add validation to prevent similar bugs
- Update domain rules if business logic was unclear
- Review similar code for same issue
