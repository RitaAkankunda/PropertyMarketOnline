# Frontend-Backend Integration Guide

## Overview
This guide is for connecting the React/Next.js frontend with the NestJS backend API.

---

## 🔗 Connection Setup

### Backend Server
- **URL:** `http://localhost:3000`
- **Status:** Running (check with `GET /health`)
- **CORS:** Must be configured to allow frontend origin

### Frontend Server (typical)
- **URL:** `http://localhost:5173` (Vite) or `http://localhost:3001` (Next.js)

---

## ⚙️ CORS Configuration (Backend)

The backend needs to allow requests from the frontend origin.

**File:** `backend/src/main.ts`

Add CORS configuration:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  await app.listen(3000);
}
bootstrap();
```

---

## 📦 Frontend API Client Setup

### Option 1: Axios (Recommended)

**Install:**
```bash
npm install axios
```

**Create API client:** `frontend/src/lib/api.ts`
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Option 2: Fetch API (Native)

**Create API client:** `frontend/src/lib/api.ts`
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient(API_BASE_URL);
export default api;
```

---

## 🔐 Authentication Service

**Create:** `frontend/src/services/auth.service.ts`

```typescript
import api from '../lib/api';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'buyer' | 'lister' | 'provider';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const authService = {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    this.saveAuth(response);
    return response;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    this.saveAuth(response);
    return response;
  },

  saveAuth(authResponse: AuthResponse) {
    localStorage.setItem('token', authResponse.accessToken);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async getProfile() {
    return await api.get('/users/profile');
  },
};
```

---

## 🏠 Property Service

**Create:** `frontend/src/services/property.service.ts`

```typescript
import api from '../lib/api';

export interface CreatePropertyData {
  title: string;
  description: string;
  price: number;
  propertyType: 'house' | 'apartment' | 'land';
  bedrooms?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface PropertyFilters {
  propertyType?: 'house' | 'apartment' | 'land';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
}

export const propertyService = {
  async createProperty(data: CreatePropertyData) {
    return await api.post('/properties', data);
  },

  async getAllProperties(filters?: PropertyFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return await api.get(`/properties${queryString ? `?${queryString}` : ''}`);
  },

  async getPropertyById(id: string) {
    return await api.get(`/properties/${id}`);
  },

  async getMyProperties() {
    return await api.get('/properties/my-properties');
  },

  async updateProperty(id: string, data: Partial<CreatePropertyData>) {
    return await api.patch(`/properties/${id}`, data);
  },

  async deleteProperty(id: string) {
    return await api.delete(`/properties/${id}`);
  },
};
```

---

## 🎯 React Context for Authentication (Optional)

**Create:** `frontend/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const signUp = async (data: any) => {
    const response = await authService.signUp(data);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signUp,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 📝 Usage Examples

### Login Component
```typescript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};
```

### Property List Component
```typescript
import { useEffect, useState } from 'react';
import { propertyService } from '../services/property.service';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getAllProperties(filters);
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <select
          value={filters.propertyType}
          onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>
        {/* Add more filters */}
      </div>

      {/* Property Grid */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="property-grid">
          {properties.map((property: any) => (
            <div key={property.id} className="property-card">
              <h3>{property.title}</h3>
              <p>${property.price}</p>
              <p>{property.propertyType} - {property.bedrooms} bedrooms</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Create Property Form
```typescript
import { useState } from 'react';
import { propertyService } from '../services/property.service';

const CreatePropertyForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    propertyType: 'house',
    bedrooms: 1,
    images: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await propertyService.createProperty(formData);
      alert('Property created successfully!');
      // Redirect or reset form
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create property');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Property Title"
        required
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
        required
      />
      <input
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        placeholder="Price"
        required
      />
      <select
        value={formData.propertyType}
        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
      >
        <option value="house">House</option>
        <option value="apartment">Apartment</option>
        <option value="land">Land</option>
      </select>
      <input
        type="number"
        value={formData.bedrooms}
        onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
        placeholder="Bedrooms"
      />
      <button type="submit">Create Property</button>
    </form>
  );
};
```

---

## 🔒 Protected Routes

**Create:** `frontend/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

**Usage in routes:**
```typescript
<Route
  path="/properties/create"
  element={
    <ProtectedRoute requiredRoles={['lister', 'provider', 'admin']}>
      <CreatePropertyPage />
    </ProtectedRoute>
  }
/>
```

---

## 🌐 Environment Variables

**Frontend `.env` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## ✅ Integration Checklist

- [ ] CORS enabled in backend (`main.ts`)
- [ ] API client setup with axios/fetch
- [ ] Authentication service implemented
- [ ] Property service implemented
- [ ] Auth context/state management setup
- [ ] Protected routes implemented
- [ ] Token storage in localStorage
- [ ] 401 error handling (auto-logout)
- [ ] Environment variables configured
- [ ] Login/Signup forms connected
- [ ] Property list page connected
- [ ] Property creation form connected
- [ ] Property search/filters connected

---

## 🐛 Common Issues & Solutions

### CORS Error
**Problem:** `Access-Control-Allow-Origin` error  
**Solution:** Add CORS configuration in `backend/src/main.ts` (see above)

### 401 Unauthorized
**Problem:** Token not being sent  
**Solution:** Check token is stored and interceptor is adding Authorization header

### Token Expiry
**Problem:** User logged out unexpectedly  
**Solution:** JWT expires after 3600s (1 hour). Implement token refresh or re-login

### Type Errors
**Problem:** TypeScript type mismatches  
**Solution:** Create proper interfaces matching backend response types

---

## 📚 Additional Resources

- API Documentation: `API_DOCUMENTATION.md`
- Backend README: `backend/README.md`
- Testing Guide: `API_TESTING_GUIDE.md`

---

## 🔄 Data Flow

```
User Action (Frontend)
    ↓
React Component
    ↓
Service Function (auth.service.ts / property.service.ts)
    ↓
API Client (axios/fetch with interceptors)
    ↓
HTTP Request → Backend (NestJS)
    ↓
Controller → Service → Database
    ↓
HTTP Response ← Backend
    ↓
API Client (handle response/errors)
    ↓
Service Function (return data)
    ↓
React Component (update state/UI)
```

---

## 🚀 Quick Start

1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test Backend:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install axios
   ```

4. **Create API client and services** (files above)

5. **Configure CORS** in backend

6. **Start Frontend:**
   ```bash
   npm run dev
   ```

7. **Test Connection:** Login → Create Property → View Properties

---

Good luck with the integration! 🎉
