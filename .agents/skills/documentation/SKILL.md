# Documentation Skill

## Purpose
Guide AI agents in creating, updating, and maintaining documentation for the NestJS backend project following Loop Engineering principles.

## When to Use
- Creating new documentation files
- Updating existing documentation
- Documenting API changes
- Documenting business rules
- Documenting architecture changes
- Creating README files
- Updating code comments

## Required Context Files (Read First)
1. `.project-ai/project-context.md` - Project overview
2. `.project-ai/architecture.md` - System architecture
3. `.project-ai/coding-rules.md` - Documentation standards
4. `.project-ai/loop-engineering.md` - Loop principles

## Step-by-Step Workflow

### Step 1: Understand Documentation Need
- Identify what needs to be documented
- Determine target audience (developers, users, etc.)
- Check if documentation already exists
- Identify gaps in current documentation

### Step 2: Read Existing Documentation
- Read related documentation files
- Understand documentation structure
- Check for similar patterns
- Identify documentation style

### Step 3: Plan Documentation Structure
- Outline sections needed
- Determine format (markdown, code comments, etc.)
- Plan examples and diagrams
- Identify cross-references needed

### Step 4: Write Documentation (One Loop)
- Write one section at a time
- Use clear, concise language
- Include examples where helpful
- Add code snippets
- Keep technical jargon minimal

### Step 5: Review and Refine
- Check for clarity
- Verify accuracy
- Check for completeness
- Add cross-references
- Format consistently

### Step 6: Validate
- Verify links work
- Check code examples are accurate
- Ensure consistency with other docs
- Get feedback if possible

### Step 7: Update Related Documentation
- Update table of contents
- Update cross-references
- Update related files
- Add to index if applicable

### Step 8: Summarize
- Document what was added/updated
- Note any sections that need review
- List related files updated

## Safety Rules

### Before Writing
- ✅ Understand what needs documentation
- ✅ Read existing documentation
- ✅ Plan structure
- ✅ Identify target audience
- ❌ Never write without understanding context
- ❌ Never duplicate existing documentation
- ❌ Never guess technical details

### During Writing
- ✅ Use clear, concise language
- ✅ Include relevant examples
- ✅ Add code snippets
- ✅ Use consistent formatting
- ✅ Cross-reference related docs
- ❌ Never use jargon without explanation
- ❌ Never write ambiguous statements
- ❌ Never include outdated information

### After Writing
- ✅ Verify accuracy
- ✅ Check for completeness
- ✅ Validate links
- ✅ Update cross-references
- ✅ Get feedback if possible
- ❌ Never commit without review
- ❌ Never leave TODOs in documentation
- ❌ Never publish without validation

## Output Format

### Documentation Update Summary
```markdown
## Documentation Update Summary

**Documentation Type**: [API/Architecture/Guide/etc.]
**Files Updated**: [list of files]
**Target Audience**: [developers/users/etc.]

### Sections Added/Updated
1. [section 1]
2. [section 2]
3. [section 3]

### Changes Made
- [description of change 1]
- [description of change 2]

### Validation
- ✅ Information is accurate
- ✅ Examples work correctly
- ✅ Links are valid
- ✅ Cross-references correct
- ✅ Formatting consistent

### Related Files Updated
- [file 1]
- [file 2]
```

## Validation Checklist

### Content Quality
- [ ] Information is accurate
- [ ] Content is complete
- [ ] Language is clear
- [ ] Examples are helpful
- [ ] Code snippets are correct
- [ ] No outdated information

### Structure
- [ ] Logical organization
- [ ] Proper headings
- [ ] Table of contents if needed
- [ ] Cross-references included
- [ ] Consistent formatting

### Accessibility
- [ ] Links work
- [ ] Images load (if any)
- [ ] Code is readable
- [ ] Font size appropriate
- [ ] Color contrast good

### Maintenance
- [ ] Easy to update
- [ ] Version information included
- [ ] Last updated date
- [ ] Contact information if needed

## Common Documentation Types

### API Documentation
```markdown
## API Endpoint Documentation

### GET /resource

**Description**: [description]

**Authentication**: Required/Optional

**Request Headers**:
- `Authorization`: Bearer token
- `Content-Type`: application/json

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page

**Request Body**: None

**Response**:
```json
{
  "success": true,
  "data": {...}
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

**Example**:
```bash
curl -X GET http://localhost:3006/resource \
  -H "Authorization: Bearer token"
```
```

### Architecture Documentation
```markdown
## Component Architecture

### Overview
[Description of component]

### Responsibilities
- [responsibility 1]
- [responsibility 2]

### Dependencies
- [dependency 1]
- [dependency 2]

### Data Flow
```
[diagram or description]
```

### Key Classes
- [Class 1]: [purpose]
- [Class 2]: [purpose]
```

### Business Rule Documentation
```markdown
## Business Rule: [Rule Name]

**Description**: [what the rule does]

**Scope**: [where it applies]

**Conditions**:
- [condition 1]
- [condition 2]

**Validation**:
- [validation rule 1]
- [validation rule 2]

**Examples**:
- Valid: [example]
- Invalid: [example]

**Related Rules**:
- [rule 1]
- [rule 2]

**Status**: [Confirmed/Needs Confirmation]
```

### Setup/Installation Guide
```markdown
## Setup Guide

### Prerequisites
- [prerequisite 1]
- [prerequisite 2]

### Installation Steps

1. [Step 1]
   ```bash
   command
   ```

2. [Step 2]
   ```bash
   command
   ```

### Configuration
- [configuration step 1]
- [configuration step 2]

### Verification
- [verification step]
- [expected result]

### Troubleshooting
- [common issue 1]: [solution]
- [common issue 2]: [solution]
```

## Documentation Standards

### Markdown Formatting
- Use `#` for main title
- Use `##` for section headings
- Use `###` for subsections
- Use `**bold**` for emphasis
- Use `*italic*` for secondary emphasis
- Use `code` for inline code
- Use ``` for code blocks

### Code Snippets
```typescript
// Always specify language
function example() {
  return true;
}
```

### Links
```markdown
[Link text](url)
[Internal link](./other-file.md)
[External link](https://example.com)
```

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### Lists
```markdown
- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2
```

## When to Update Documentation

### Must Update When:
- Adding new API endpoints
- Changing API contracts
- Modifying business rules
- Changing architecture
- Adding new features
- Deprecating functionality

### Should Update When:
- Fixing bugs that affect usage
- Changing configuration
- Adding new dependencies
- Updating deployment process
- Changing environment variables

### Nice to Update When:
- Improving code structure
- Adding examples
- Clarifying existing docs
- Adding troubleshooting tips

## When to Stop and Ask
- Documentation requirement is unclear → Ask for clarification
- Multiple documentation approaches exist → Ask for preference
- Technical detail uncertain → Verify with developer
- Audience is unclear → Define audience first
- Cross-reference needed but unclear → Ask for guidance

## Best Practices
- Keep documentation up-to-date
- Write for the intended audience
- Use clear, concise language
- Include relevant examples
- Add diagrams where helpful
- Cross-reference related docs
- Review documentation regularly
- Get feedback from users
- Document as you code
- Keep it simple and focused

## Documentation Maintenance

### Regular Reviews
- Review documentation monthly
- Check for outdated information
- Update with recent changes
- Remove deprecated content
- Improve clarity based on feedback

### Version Control
- Commit documentation with code changes
- Use meaningful commit messages
- Tag documentation releases
- Maintain change log
- Keep history of major changes

### Accessibility
- Use clear headings
- Provide table of contents
- Use descriptive link text
- Ensure contrast is sufficient
- Provide alt text for images
