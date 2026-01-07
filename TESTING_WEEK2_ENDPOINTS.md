# Testing Guide - Week 2 Backend Endpoints

This guide will help you test all the new backend endpoints that were just implemented.

## Prerequisites

1. ✅ Backend server running on `http://localhost:3001` (or your configured port)
2. ✅ Frontend server running on `http://localhost:3000`
3. ✅ Database migrations completed (already done ✅)
4. ✅ Admin user account created
5. ✅ At least one service provider registered

---

## 🔐 Step 1: Get Admin Authentication Token

First, you need to log in as an admin user to test admin endpoints.

### Option A: Using Frontend
1. Go to `http://localhost:3000/auth/login`
2. Log in with admin credentials
3. Open browser DevTools (F12) → Application/Storage → Local Storage
4. Find `auth_token` or check Network tab for the token in API responses

### Option B: Using API
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-admin-password"
  }'
```

**Save the `accessToken` from the response!**

---

## 📋 Step 2: Test ServiceCategory CRUD (Admin Only)

### 2.1 Create a Category
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Electrician",
    "slug": "electrician",
    "description": "Electrical services and repairs",
    "icon": "Zap",
    "isActive": true,
    "sortOrder": 1
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "Electrician",
  "slug": "electrician",
  "description": "Electrical services and repairs",
  "icon": "Zap",
  "isActive": true,
  "sortOrder": 1,
  "createdAt": "2025-01-XX...",
  "updatedAt": "2025-01-XX..."
}
```

### 2.2 Get All Categories (Public)
```bash
curl -X GET http://localhost:3001/api/categories
```

### 2.3 Get Single Category (Public)
```bash
curl -X GET http://localhost:3001/api/categories/CATEGORY_ID
```

### 2.4 Update Category (Admin Only)
```bash
curl -X PATCH http://localhost:3001/api/categories/CATEGORY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "description": "Updated description",
    "sortOrder": 2
  }'
```

### 2.5 Deactivate Category (Admin Only)
```bash
curl -X PATCH http://localhost:3001/api/categories/CATEGORY_ID/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2.6 Delete Category (Admin Only)
```bash
curl -X DELETE http://localhost:3001/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📄 Step 3: Test Provider Document Upload

### 3.1 Upload ID Document

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/providers/PROVIDER_ID/documents/id \
  -H "Authorization: Bearer YOUR_PROVIDER_TOKEN" \
  -F "document=@/path/to/id-document.pdf"
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3001/api/providers/PROVIDER_ID/documents/id`
3. Headers: `Authorization: Bearer YOUR_PROVIDER_TOKEN`
4. Body → form-data:
   - Key: `document` (type: File)
   - Value: Select your ID document file

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "idDocumentUrl": "https://r2-url.com/providers/documents/filename.pdf",
  ...
}
```

### 3.2 Upload Certification

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/providers/PROVIDER_ID/certifications \
  -H "Authorization: Bearer YOUR_PROVIDER_TOKEN" \
  -F "document=@/path/to/certification.pdf" \
  -F "name=Electrical License" \
  -F "issuer=Uganda Electrical Board"
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3001/api/providers/PROVIDER_ID/certifications`
3. Headers: `Authorization: Bearer YOUR_PROVIDER_TOKEN`
4. Body → form-data:
   - Key: `document` (type: File) → Select certification file
   - Key: `name` (type: Text) → "Electrical License"
   - Key: `issuer` (type: Text) → "Uganda Electrical Board"

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "certifications": [
    {
      "id": "cert-uuid",
      "name": "Electrical License",
      "issuer": "Uganda Electrical Board",
      "documentUrl": "https://r2-url.com/providers/certifications/filename.pdf",
      "isVerified": false
    }
  ],
  ...
}
```

---

## 👮 Step 4: Test Admin Provider Management

### 4.1 Verify Provider
```bash
curl -X PATCH http://localhost:3001/api/providers/PROVIDER_ID/verify \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "isVerified": true,
  "isKycVerified": true,
  ...
}
```

**Frontend Test:**
1. Go to `http://localhost:3000/admin/providers`
2. Find an unverified provider
3. Click the "Verify" button
4. Provider should show as verified ✅

### 4.2 Reject Provider
```bash
curl -X PATCH http://localhost:3001/api/providers/PROVIDER_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reason": "Incomplete documentation"
  }'
```

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "isVerified": false,
  "isKycVerified": false,
  ...
}
```

### 4.3 Suspend Provider
```bash
curl -X PATCH http://localhost:3001/api/providers/PROVIDER_ID/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reason": "Violation of terms",
    "duration": 30
  }'
```

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "isVerified": false,
  ...
}
```

### 4.4 Ban Provider
```bash
curl -X PATCH http://localhost:3001/api/providers/PROVIDER_ID/ban \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reason": "Fraudulent activity"
  }'
```

**Expected Response:**
```json
{
  "id": "provider-uuid",
  "isVerified": false,
  "isKycVerified": false,
  ...
}
```

---

## 🧪 Complete Testing Workflow

### Scenario 1: Admin Creates Category
1. ✅ Login as admin
2. ✅ Create a new service category
3. ✅ Verify it appears in `GET /api/categories`
4. ✅ Update the category
5. ✅ Test deactivation

### Scenario 2: Provider Uploads Documents
1. ✅ Login as a service provider
2. ✅ Get provider ID from profile: `GET /api/providers/profile`
3. ✅ Upload ID document
4. ✅ Upload certification
5. ✅ Verify documents appear in provider profile

### Scenario 3: Admin Verifies Provider
1. ✅ Login as admin
2. ✅ View providers: `GET /api/providers`
3. ✅ Find unverified provider
4. ✅ Verify provider using `PATCH /api/providers/:id/verify`
5. ✅ Check provider is now verified
6. ✅ Test reject/suspend/ban actions

---

## 🎯 Frontend Testing

### Test Admin Provider Management UI
1. **Navigate:** `http://localhost:3000/admin/providers`
2. **Verify Provider:**
   - Find provider with "Unverified" badge
   - Click "Verify" button
   - Should see success message
   - Provider should now show "Verified" badge ✅

3. **Unverify Provider:**
   - Find verified provider
   - Click "Unverify" button
   - Should see success message
   - Provider should show "Unverified" badge

### Test Provider Registration with Documents
1. **Navigate:** `http://localhost:3000/auth/register/provider`
2. **Complete Registration:**
   - Fill in all required fields
   - Upload certifications (optional)
   - Upload portfolio images
   - Submit form
3. **After Registration:**
   - Login as the provider
   - Upload ID document via API (or add UI later)
   - Upload additional certifications

---

## 🔍 Verification Checklist

### Categories Endpoints
- [ ] Create category (admin only)
- [ ] Get all categories (public)
- [ ] Get single category (public)
- [ ] Update category (admin only)
- [ ] Deactivate category (admin only)
- [ ] Delete category (admin only)

### Provider Documents
- [ ] Upload ID document (provider only)
- [ ] Upload certification (provider only)
- [ ] Verify documents appear in provider profile

### Admin Provider Management
- [ ] Verify provider (admin only)
- [ ] Reject provider (admin only)
- [ ] Suspend provider (admin only)
- [ ] Ban provider (admin only)
- [ ] Frontend admin page works correctly

---

## 🐛 Troubleshooting

### Error: "Missing role" or "Insufficient role"
- **Solution:** Make sure you're using an admin token for admin endpoints
- Check token in JWT decoder: https://jwt.io

### Error: "Provider not found"
- **Solution:** Get the correct provider ID from `GET /api/providers`

### Error: "You can only upload documents for your own provider profile"
- **Solution:** Make sure the provider ID matches the logged-in user's provider profile

### Error: "Category with this name or slug already exists"
- **Solution:** Use a different name or slug, or delete the existing category first

---

## 📊 Quick Test Script

Save this as `test-endpoints.sh`:

```bash
#!/bin/bash

# Set your tokens
ADMIN_TOKEN="your-admin-token-here"
PROVIDER_TOKEN="your-provider-token-here"
PROVIDER_ID="your-provider-id-here"
BASE_URL="http://localhost:3001/api"

echo "🧪 Testing Week 2 Endpoints..."
echo ""

# Test 1: Create Category
echo "1. Creating category..."
curl -X POST $BASE_URL/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Test Category","slug":"test-category","icon":"Zap"}'

echo ""
echo "2. Getting all categories..."
curl -X GET $BASE_URL/categories

echo ""
echo "3. Verifying provider..."
curl -X PATCH $BASE_URL/providers/$PROVIDER_ID/verify \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo ""
echo "✅ Tests completed!"
```

---

## 🎉 Success Indicators

✅ **Categories:** You can create, read, update, and delete categories as admin  
✅ **Documents:** Providers can upload ID and certification documents  
✅ **Admin Management:** Admin can verify, reject, suspend, and ban providers  
✅ **Frontend:** Admin page shows providers and verify/unverify buttons work  

---

**Need Help?** Check the backend logs for detailed error messages!

