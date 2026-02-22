# API Request Examples

## POST /products

### 1. Minimal (Required fields only)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d @examples/post-product-minimal.json
```

### 2. Basic
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d @examples/post-product-basic.json
```

### 3. Complete (All fields)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d @examples/post-product-complete.json
```

## POST /products/with-bom

### 4. Product with BOM
```bash
curl -X POST http://localhost:3000/products/with-bom \
  -H "Content-Type: application/json" \
  -d @examples/post-product-with-bom.json
```

---

## Files

- `post-product-minimal.json` - Only required fields (productCode, productName)
- `post-product-basic.json` - Basic product with description
- `post-product-complete.json` - Complete product with all fields
- `post-product-with-bom.json` - Product with Bill of Materials

## Usage with Postman/Insomnia

1. Import the JSON files
2. Set method to POST
3. Set URL to `http://localhost:3000/products` or `http://localhost:3000/products/with-bom`
4. Set Content-Type header to `application/json`
5. Copy JSON content to request body
6. Send request
