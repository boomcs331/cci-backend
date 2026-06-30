# Frontend Guide

## Note
This repository contains **backend code only**. There is no frontend code in this repository. This guide provides information for frontend developers on how to interact with this backend API.

## API Base URL
- **Development**: `http://localhost:3006`
- **Production**: Configured via environment variable

## Authentication

### Login Flow
1. Send POST request to `/auth/login` with credentials:
```json
{
  "username": "string",
  "password": "string"
}
```

2. Receive JWT token in response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {...}
  }
}
```

3. Store token in localStorage or secure cookie
4. Include token in subsequent requests via `Authorization: Bearer <token>` header

### Token Refresh
- Endpoint: `POST /auth/refresh`
- Send current token to receive new token
- Update stored token on success

### Logout
- Endpoint: `POST /auth/logout`
- Clear stored token
- Token will be invalidated on server

## Request Headers

### Standard Headers
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### Additional Headers (for audit logging)
```typescript
{
  'x-user-id': userId,
  'x-username': username,
  'x-department-id': departmentId
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Common Error Codes
- `VALIDATION_FAILED`: Request validation failed
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (duplicate, etc.)
- `INTERNAL_ERROR`: Server error

## CORS Configuration

### Development Origins
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://127.0.0.1:3000-3002`
- Private LAN (if `CORS_DEV_ALLOW_LAN=1`)
- Cloudflare tunnels (trycloudflare.com)

### Production Origins
- Configured via `CORS_ORIGINS` environment variable

## API Endpoints Overview

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token

### Materials
- `GET /materials` - List materials
- `POST /materials/transactions/receive` - Receive materials
- `POST /materials/transactions/issue` - Issue materials

### Products
- `GET /products` - List products
- `GET /products/inventory` - Get inventory
- `GET /masters/products` - Master products

### Production
- `GET /production-plans` - List production plans
- `GET /production-orders` - List production orders
- `POST /production-orders` - Create production order

### Sales
- `GET /sales/orders` - List sales orders
- `POST /sales/orders` - Create sales order
- `POST /sales/orders/:id/approve` - Approve order
- `GET /sales/dashboard` - Dashboard data

### Sales Planning
- `GET /sales-planning` - List planning data
- `POST /sales-planning/import` - Import from Excel
- `GET /sales-planning/export` - Export to Excel

See `api-map.md` for complete endpoint documentation.

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field
- `order`: Sort direction (asc/desc)

### Example
```
GET /materials?page=1&limit=20&sort=name&order=asc
```

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## File Upload

### Upload Endpoints
- `POST /materials/upload` - Upload material files
- `POST /products/upload` - Upload product files

### Request Format
- Use `multipart/form-data`
- Field name: `file`
- Include JWT token in Authorization header

### Example (JavaScript)
```javascript
const formData = new FormData();
formData.append('file', file);

fetch('http://localhost:3006/materials/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### File Access
- Uploaded files accessible via `/uploads/` path
- Example: `http://localhost:3006/uploads/filename.ext`

## Department Scoping

### Multi-Department Users
- Users can belong to multiple departments
- API responses may include data from all user's departments
- Some endpoints allow filtering by department

### Department Header
Include `x-department-id` header to scope requests to specific department
- If omitted, may return data from all user's departments
- Backend validates user has access to specified department

## Data Validation

### Client-Side Validation
- Validate forms before sending to API
- Use same validation rules as backend (see DTOs)
- Display validation errors from API response

### Validation Error Response
```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## State Management

### Authentication State
- Store user info and token
- Check token expiration
- Refresh token before expiration
- Clear auth state on logout

### Data Caching
- Consider caching frequently accessed data
- Invalidate cache on mutations
- Use appropriate cache duration

### Loading States
- Show loading indicators during API calls
- Handle optimistic updates where appropriate
- Revert on error

## Error Handling

### Network Errors
- Handle connection failures gracefully
- Show user-friendly error messages
- Implement retry logic for transient failures

### API Errors
- Display error messages from API
- Handle specific error codes appropriately
- Redirect to login on 401 errors
- Show permission denied on 403 errors

## Internationalization

### Language Support
- Backend supports Thai language
- Error messages may be in Thai
- Dates/times in ISO 8601 format
- Consider timezone handling

## Best Practices

### Security
- Never store passwords in frontend
- Use HTTPS in production
- Implement CSRF protection if using cookies
- Validate all user input
- Sanitize displayed data

### Performance
- Implement pagination for large datasets
- Use debouncing for search inputs
- Lazy load images and data
- Implement request cancellation

### User Experience
- Provide feedback for all actions
- Handle loading states gracefully
- Show meaningful error messages
- Implement undo for destructive actions

## Development Tools

### API Testing
- Use Postman, Insomnia, or similar tools
- Import OpenAPI spec if available (previously in openapi/ folder)
- Test authentication flow first
- Test error scenarios

### Debugging
- Check browser console for errors
- Inspect network requests in DevTools
- Log API responses during development
- Use backend logs for server-side issues

## Common Patterns

### CRUD Operations
```javascript
// Create
POST /resource
Body: { data }

// Read
GET /resource
GET /resource/:id

// Update
PUT /resource/:id
Body: { data }

// Delete
DELETE /resource/:id
```

### Search/Filter
```javascript
GET /resource?search=query&filter=value
```

### Bulk Operations
```javascript
POST /resource/bulk
Body: { items: [...] }
```

## WebSocket/Real-time
- **Status**: No WebSocket endpoints currently implemented
- **Future**: May be added for real-time updates
- **Alternative**: Poll for updates if needed

## Rate Limiting
- **Status**: Not currently implemented
- **Future**: May be added for API protection
- **Best Practice**: Implement client-side rate limiting

## API Versioning
- **Current**: No versioning in URLs
- **Future**: May add `/v1/` prefix if needed
- **Backward Compatibility**: Breaking changes should be communicated

## Support
- Refer to `api-map.md` for complete endpoint documentation
- Check `domain-rules.md` for business logic
- Review `backend-guide.md` for backend-specific guidance
