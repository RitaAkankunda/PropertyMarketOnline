# Property Marketplace API - Testing Guide

## Base URL
```
http://localhost:3000
```

---

## 1. Authentication Endpoints

### Sign Up
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "lister@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "lister"
}

# Response: { "accessToken": "...", "user": {...} }
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "lister@example.com",
  "password": "Password123!"
}

# Response: { "accessToken": "...", "user": {...} }
```

---

## 2. User Endpoints

### Get Profile (Authenticated)
```bash
GET /users/profile
Authorization: Bearer <your_token>
```

### Admin Ping (Admin Only)
```bash
GET /users/admin/ping
Authorization: Bearer <admin_token>
```

### Seed Admin (One-time)
```bash
POST /users/admin/seed
Content-Type: application/json
x-seed-token: <ADMIN_SEED_TOKEN from .env>

{
  "email": "user@example.com"
}
```

---

## 3. Property Endpoints

### Create Property (Lister/Provider/Admin Only)
```bash
POST /properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Beautiful 3BR House",
  "description": "Spacious house with garden",
  "price": 500000,
  "propertyType": "house",
  "bedrooms": 3,
  "latitude": 40.7128,
  "longitude": -74.0060
}

# propertyType: "house" | "apartment" | "land"
```

### Get All Properties (Public, with filters)
```bash
GET /properties?propertyType=house&minPrice=100000&maxPrice=600000&bedrooms=3&page=1&limit=10
```

### Get Property by ID (Public)
```bash
GET /properties/:id
```

### Get My Properties (Authenticated)
```bash
GET /properties/my-properties
Authorization: Bearer <token>
```

### Update Property (Owner or Admin)
```bash
PATCH /properties/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 550000
}
```

### Delete Property (Owner or Admin)
```bash
DELETE /properties/:id
Authorization: Bearer <token>
```

---

## Role-Based Access Control

### User Roles
- **buyer**: Can view properties, manage profile
- **lister**: Can create/manage properties + buyer permissions
- **provider**: Can create/manage properties + buyer permissions
- **admin**: Full access to all resources

### Protected Endpoints
- `POST /properties` - Requires: lister, provider, or admin
- `PATCH /properties/:id` - Requires: owner or admin
- `DELETE /properties/:id` - Requires: owner or admin
- `GET /users/admin/ping` - Requires: admin

---

## Testing with PowerShell (curl)

### Create a user
```powershell
curl -X POST http://localhost:3000/auth/signup `
  -H "Content-Type: application/json" `
  -d '{"email":"lister@example.com","password":"Pass123!","firstName":"John","lastName":"Doe","role":"lister"}'
```

### Login and get token
```powershell
$response = curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"lister@example.com","password":"Pass123!"}' | ConvertFrom-Json

$token = $response.accessToken
```

### Create a property
```powershell
curl -X POST http://localhost:3000/properties `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"title":"Nice House","description":"Great location","price":300000,"propertyType":"house","bedrooms":3}'
```

### Get all properties
```powershell
curl http://localhost:3000/properties
```

---

## Testing with Postman/REST Client

1. Create a new request
2. Set method and URL
3. Add Authorization header: `Bearer <token>`
4. Add JSON body for POST/PATCH requests
5. Send request

---

## Database Verification

View data in DBeaver:
1. Right-click on `users` or `properties` table
2. Select "View Data"
3. See all records
