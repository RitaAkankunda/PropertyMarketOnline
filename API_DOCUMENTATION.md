# Property Marketplace - Complete API Documentation

## Base URL
```
http://localhost:3000
```

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Property Management](#property-management)
4. [Health Check](#health-check)

---

## 🔐 Authentication

### 1. Sign Up
Create a new user account.

**Endpoint:** `POST /auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer"
}
```

**Available Roles:**
- `buyer` - Can view and search properties
- `lister` - Can create and manage property listings
- `provider` - Can create and manage property listings
- `admin` - Full system access

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer",
    "createdAt": "2025-12-18T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists

---

### 2. Login
Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer",
    "createdAt": "2025-12-18T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

## 👤 User Management

### 3. Get Current User Profile
Get authenticated user's profile information.

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer",
  "createdAt": "2025-12-18T00:00:00.000Z",
  "updatedAt": "2025-12-18T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

### 4. Admin Ping (Admin Only)
Test endpoint for admin access.

**Endpoint:** `GET /users/admin/ping`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "ok": true,
  "scope": "admin"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not an admin

---

### 5. Seed Admin
One-time endpoint to promote a user to admin role.

**Endpoint:** `POST /users/admin/seed`

**Headers:**
```
Content-Type: application/json
x-seed-token: <ADMIN_SEED_TOKEN from .env>
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "email": "user@example.com",
  "role": "admin"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid seed token
- `404 Not Found` - User not found

---

## 🏠 Property Management

### 6. Create Property
Create a new property listing (Lister/Provider/Admin only).

**Endpoint:** `POST /properties`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Beautiful 3BR House",
  "description": "Spacious house with a garden in a quiet neighborhood",
  "price": 500000,
  "propertyType": "house",
  "bedrooms": 3,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Field Descriptions:**
- `title` (required) - Property title
- `description` (required) - Detailed description
- `price` (required) - Price in dollars (must be >= 0)
- `propertyType` (required) - One of: `house`, `apartment`, `land`
- `bedrooms` (optional) - Number of bedrooms
- `latitude` (optional) - GPS latitude
- `longitude` (optional) - GPS longitude
- `images` (optional) - Array of image URLs

**Response (201 Created):**
```json
{
  "id": "uuid-here",
  "title": "Beautiful 3BR House",
  "description": "Spacious house with a garden in a quiet neighborhood",
  "price": "500000.00",
  "propertyType": "house",
  "bedrooms": 3,
  "latitude": "40.71280000",
  "longitude": "-74.00600000",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "ownerId": "user-uuid-here",
  "createdAt": "2025-12-18T00:00:00.000Z",
  "updatedAt": "2025-12-18T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User role not authorized (must be lister, provider, or admin)
- `400 Bad Request` - Validation errors

---

### 7. Get All Properties (with filtering)
Retrieve all properties with optional filters. **Public endpoint - no authentication required.**

**Endpoint:** `GET /properties`

**Query Parameters:**
- `propertyType` (optional) - Filter by type: `house`, `apartment`, `land`
- `minPrice` (optional) - Minimum price (number)
- `maxPrice` (optional) - Maximum price (number)
- `bedrooms` (optional) - Number of bedrooms (number)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Example Request:**
```
GET /properties?propertyType=house&minPrice=100000&maxPrice=600000&bedrooms=3&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "title": "Beautiful 3BR House",
      "description": "Spacious house with a garden",
      "price": "500000.00",
      "propertyType": "house",
      "bedrooms": 3,
      "latitude": "40.71280000",
      "longitude": "-74.00600000",
      "images": ["https://example.com/image1.jpg"],
      "ownerId": "user-uuid",
      "createdAt": "2025-12-18T00:00:00.000Z",
      "updatedAt": "2025-12-18T00:00:00.000Z",
      "owner": {
        "id": "user-uuid",
        "email": "owner@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "lister"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### 8. Get Property by ID
Get a single property by its ID. **Public endpoint - no authentication required.**

**Endpoint:** `GET /properties/:id`

**Example Request:**
```
GET /properties/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "title": "Beautiful 3BR House",
  "description": "Spacious house with a garden",
  "price": "500000.00",
  "propertyType": "house",
  "bedrooms": 3,
  "latitude": "40.71280000",
  "longitude": "-74.00600000",
  "images": ["https://example.com/image1.jpg"],
  "ownerId": "user-uuid",
  "createdAt": "2025-12-18T00:00:00.000Z",
  "updatedAt": "2025-12-18T00:00:00.000Z",
  "owner": {
    "id": "user-uuid",
    "email": "owner@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "lister"
  }
}
```

**Error Responses:**
- `404 Not Found` - Property doesn't exist

---

### 9. Get My Properties
Get all properties owned by the authenticated user.

**Endpoint:** `GET /properties/my-properties`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "title": "My Property 1",
    "description": "...",
    "price": "500000.00",
    "propertyType": "house",
    "bedrooms": 3,
    "latitude": "40.71280000",
    "longitude": "-74.00600000",
    "images": [],
    "ownerId": "user-uuid",
    "createdAt": "2025-12-18T00:00:00.000Z",
    "updatedAt": "2025-12-18T00:00:00.000Z",
    "owner": {
      "id": "user-uuid",
      "email": "me@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "lister"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

### 10. Update Property
Update a property (Owner or Admin only).

**Endpoint:** `PATCH /properties/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "price": 550000,
  "bedrooms": 4,
  "images": ["https://example.com/new-image.jpg"]
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "title": "Updated Title",
  "description": "...",
  "price": "550000.00",
  "propertyType": "house",
  "bedrooms": 4,
  "latitude": "40.71280000",
  "longitude": "-74.00600000",
  "images": ["https://example.com/new-image.jpg"],
  "ownerId": "user-uuid",
  "createdAt": "2025-12-18T00:00:00.000Z",
  "updatedAt": "2025-12-18T01:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not the owner or admin
- `404 Not Found` - Property doesn't exist

---

### 11. Delete Property
Delete a property (Owner or Admin only).

**Endpoint:** `DELETE /properties/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
(No content - successful deletion)
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not the owner or admin
- `404 Not Found` - Property doesn't exist

---

## ❤️ Health Check

### 12. Health Check
Check if the API is running.

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## 🔒 Authorization Summary

| Endpoint | Required Role | Notes |
|----------|--------------|-------|
| `POST /auth/signup` | None (Public) | Creates new user |
| `POST /auth/login` | None (Public) | Returns JWT token |
| `GET /users/profile` | Any authenticated | User must be logged in |
| `GET /users/admin/ping` | Admin only | Test admin access |
| `POST /users/admin/seed` | Special token | One-time admin promotion |
| `POST /properties` | Lister, Provider, or Admin | Create listing |
| `GET /properties` | None (Public) | Browse all properties |
| `GET /properties/:id` | None (Public) | View property details |
| `GET /properties/my-properties` | Any authenticated | View own properties |
| `PATCH /properties/:id` | Owner or Admin | Update property |
| `DELETE /properties/:id` | Owner or Admin | Delete property |
| `GET /health` | None (Public) | System health check |

---

## 🎯 Frontend Integration Notes

### Authentication Flow
1. User signs up via `POST /auth/signup`
2. Store the `accessToken` in localStorage or secure cookie
3. Include token in Authorization header for protected endpoints: `Authorization: Bearer <token>`
4. On 401 responses, redirect to login page

### Token Storage (Recommended)
```javascript
// Store token after login/signup
localStorage.setItem('token', response.accessToken);
localStorage.setItem('user', JSON.stringify(response.user));

// Retrieve for API calls
const token = localStorage.getItem('token');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Example API Call (JavaScript/Fetch)
```javascript
// Create property
const createProperty = async (propertyData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/properties', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(propertyData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create property');
  }
  
  return await response.json();
};

// Get all properties with filters
const getProperties = async (filters) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`http://localhost:3000/properties?${queryParams}`);
  return await response.json();
};
```

### Example API Call (Axios)
```javascript
import axios from 'axios';

// Setup axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const properties = await api.get('/properties', {
  params: { propertyType: 'house', minPrice: 100000 }
});
```

---

## 🚨 Common Error Codes

| Status Code | Meaning | Common Causes |
|------------|---------|---------------|
| 400 | Bad Request | Validation errors, missing required fields |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions for the action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., email already exists) |
| 500 | Internal Server Error | Server-side error |

---

## 📝 Data Models

### User Model
```typescript
{
  id: string (UUID)
  email: string (unique)
  firstName: string
  lastName: string
  role: "buyer" | "lister" | "provider" | "admin"
  createdAt: Date
  updatedAt: Date
}
```

### Property Model
```typescript
{
  id: string (UUID)
  title: string
  description: string
  price: number (decimal)
  propertyType: "house" | "apartment" | "land"
  bedrooms: number (optional)
  latitude: number (optional)
  longitude: number (optional)
  images: string[] (array of URLs)
  ownerId: string (UUID reference to User)
  owner: User (populated object)
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔧 Environment Setup

Make sure the backend is running:
```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3000`  
Database (PostgreSQL): `localhost:5432`  
pgAdmin: `http://localhost:5050`

---

## 📞 Support

For issues or questions, check:
- Backend logs in the terminal
- Database in DBeaver or pgAdmin
- API Testing Guide: `API_TESTING_GUIDE.md`
