# Frontend UI Development Skill

## Purpose
Guide AI agents in understanding how to interact with the backend API for frontend development. Note: This repository contains backend code only - no frontend code exists here.

## When to Use
- When frontend developers need to understand API integration
- When documenting API changes for frontend team
- When creating API examples for frontend consumption
- When troubleshooting frontend-backend integration issues

## Required Context Files (Read First)
1. `.project-ai/frontend-guide.md` - Frontend integration guide
2. `.project-ai/api-map.md` - Complete API endpoint documentation
3. `.project-ai/project-context.md` - Project overview

## Step-by-Step Workflow

### Step 1: Understand Frontend Requirements
- Identify what frontend feature needs backend support
- Determine which API endpoints are needed
- Check if endpoints already exist in api-map.md

### Step 2: Review API Documentation
- Read api-map.md for endpoint details
- Check authentication requirements
- Review request/response formats
- Identify required headers

### Step 3: Provide Integration Guidance
- Document endpoint URL and method
- Specify required headers
- Provide request body format
- Document response format
- Include error handling guidance

### Step 4: Create Examples
- Provide JavaScript/TypeScript examples
- Include authentication flow
- Show error handling
- Demonstrate pagination
- Show file upload if applicable

### Step 5: Validate Information
- Verify endpoint exists
- Check response format matches actual API
- Ensure authentication requirements are correct
- Validate example code

### Step 6: Update Documentation
- Update frontend-guide.md if new patterns emerge
- Add examples to api-map.md if helpful
- Document any special considerations

## Safety Rules

### Before Providing Guidance
- ✅ Verify endpoint exists and is documented
- ✅ Check authentication requirements
- ✅ Review business rules that affect frontend
- ✅ Identify any special headers needed
- ❌ Never assume endpoint behavior
- ❌ Never provide untested examples

### During Guidance
- ✅ Provide accurate endpoint information
- ✅ Include error handling examples
- ✅ Document authentication flow
- ✅ Show proper header usage
- ✅ Include TypeScript types if possible
- ❌ Never hardcode credentials in examples
- ❌ Never skip error handling
- ❌ Never provide outdated information

### After Guidance
- ✅ Verify examples are accurate
- ✅ Update documentation if needed
- ✅ Note any frontend limitations
- ❌ Never leave ambiguous information

## Output Format

### API Integration Example
```markdown
## Frontend Integration Guide for [Feature]

### Endpoints Required
1. [Method] [Endpoint] - [Description]
2. [Method] [Endpoint] - [Description]

### Authentication
- Endpoint requires JWT token
- Include `Authorization: Bearer <token>` header

### Request Examples

#### Get List
```typescript
const response = await fetch('http://localhost:3006/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

#### Create Item
```typescript
const response = await fetch('http://localhost:3006/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    field1: 'value1',
    field2: 'value2',
  }),
});
const data = await response.json();
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling
```typescript
if (!response.ok) {
  const error = await response.json();
  // Handle error based on error.code
  if (error.code === 'VALIDATION_FAILED') {
    // Show validation errors
  } else if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  }
}
```

### Special Considerations
- [Any special notes for frontend]
```

## Validation Checklist

### Information Accuracy
- [ ] Endpoint URL is correct
- [ ] HTTP method is correct
- [ ] Request format is accurate
- [ ] Response format is accurate
- [ ] Authentication requirements documented

### Code Examples
- [ ] Examples are syntactically correct
- [ ] Error handling included
- [ ] Authentication flow shown
- [ ] TypeScript types provided (if applicable)
- [ ] No hardcoded credentials

### Completeness
- [ ] All required endpoints documented
- [ ] Request headers specified
- [ ] Query parameters documented
- [ ] Error codes explained
- [ ] Edge cases addressed

## Common Integration Patterns

### Authenticated Request
```typescript
async function authenticatedRequest(url: string, options?: RequestInit) {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
```

### Pagination
```typescript
async function fetchPage(page: number = 1, limit: number = 10) {
  const response = await authenticatedRequest(
    `http://localhost:3006/api/resource?page=${page}&limit=${limit}`
  );
  return response.data;
}
```

### File Upload
```typescript
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3006/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}
```

### Error Handling Wrapper
```typescript
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await authenticatedRequest(url, options);
    if (!response.success) {
      throw new Error(response.message);
    }
    return response.data as T;
  } catch (error) {
    // Handle error
    throw error;
  }
}
```

## When to Stop and Ask
- Frontend requirement is unclear → Ask for clarification
- Multiple integration approaches exist → Ask for preference
- Endpoint doesn't exist → Request backend changes
- Authentication flow unclear → Verify with backend team
- Response format unusual → Confirm with backend team

## Important Notes
- This repository contains **backend code only**
- No frontend code exists in this repository
- This skill provides guidance for frontend developers
- Actual frontend implementation is in a separate repository
- Always verify endpoint existence before providing integration guidance
