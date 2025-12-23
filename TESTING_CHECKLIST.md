# Testing Checklist - RBAC & ListingType Implementation

## 🚀 Starting the Servers

### Backend (Terminal 1)
```bash
cd backend
npm run start:dev
```
- Should start on `http://localhost:3001`
- Watch for: "Nest application successfully started"

### Frontend (Terminal 2)
```bash
cd FRONTEND/property-market
npm run dev
```
- Should start on `http://localhost:3000`
- Watch for: "Ready on http://localhost:3000"

---

## ✅ Test Scenarios

### 1. **BUYER Role - Access Denied Tests**

#### Test 1.1: Dashboard Access
- [ ] Login as a BUYER user
- [ ] Try to access `/dashboard`
- [ ] **Expected**: See "Access Denied" message
- [ ] **Expected**: Cannot see dashboard content

#### Test 1.2: Create Listing Access
- [ ] While logged in as BUYER
- [ ] Try to access `/listings/create`
- [ ] **Expected**: See "Access Denied" message
- [ ] **Expected**: Cannot see listing form

#### Test 1.3: My Properties Access
- [ ] While logged in as BUYER
- [ ] Try to access `/dashboard/properties`
- [ ] **Expected**: See "Access Denied" message

#### Test 1.4: Browse Properties (Should Work)
- [ ] While logged in as BUYER
- [ ] Go to `/properties`
- [ ] **Expected**: Can see all properties (sale/rent/lease)
- [ ] **Expected**: Can filter by listingType
- [ ] **Expected**: Can view property details

---

### 2. **LISTER Role - Full Access Tests**

#### Test 2.1: Dashboard Access
- [ ] Login as a LISTER user
- [ ] Access `/dashboard`
- [ ] **Expected**: Can see dashboard with stats
- [ ] **Expected**: Can see "Total Properties" count

#### Test 2.2: Create Property with ListingType
- [ ] While logged in as LISTER
- [ ] Go to `/listings/create`
- [ ] Fill out the form:
  - [ ] Select property type (e.g., "apartment")
  - [ ] **Select listing type: "sale", "rent", or "lease"** ⭐ NEW
  - [ ] Fill other required fields
- [ ] Submit the form
- [ ] **Expected**: Property created successfully
- [ ] **Expected**: Redirected to properties page
- [ ] **Expected**: Property shows correct listingType badge

#### Test 2.3: View Created Property
- [ ] Go to `/properties`
- [ ] Find your newly created property
- [ ] **Expected**: Property card shows listingType badge ("For Sale", "For Rent", or "For Lease")
- [ ] **Expected**: Can filter by listingType and see your property

#### Test 2.4: Edit Property
- [ ] Go to `/dashboard/properties`
- [ ] Click "Edit" on a property
- [ ] **Expected**: Can edit property details
- [ ] **Expected**: Can change listingType if needed
- [ ] Save changes
- [ ] **Expected**: Property updated successfully

#### Test 2.5: My Properties Page
- [ ] Go to `/dashboard/properties`
- [ ] **Expected**: See all your properties
- [ ] **Expected**: Can view, edit, delete properties

---

### 3. **ListingType Filtering Tests**

#### Test 3.1: Filter by Sale
- [ ] Go to `/properties`
- [ ] In filters, select "For Sale" listing type
- [ ] **Expected**: Only properties with `listingType: "sale"` are shown

#### Test 3.2: Filter by Rent
- [ ] In filters, select "For Rent" listing type
- [ ] **Expected**: Only properties with `listingType: "rent"` are shown

#### Test 3.3: Filter by Lease
- [ ] In filters, select "For Lease" listing type
- [ ] **Expected**: Only properties with `listingType: "lease"` are shown

#### Test 3.4: Filter by Property Type + Listing Type
- [ ] Select property type: "apartment"
- [ ] Select listing type: "rent"
- [ ] **Expected**: Only apartments for rent are shown

---

### 4. **Property Display Tests**

#### Test 4.1: Property Card Badge
- [ ] View any property card
- [ ] **Expected**: See colored badge showing listing type:
  - Green: "For Sale"
  - Blue: "For Rent"
  - Purple: "For Lease"

#### Test 4.2: Property Detail Page
- [ ] Click on a property
- [ ] **Expected**: Property detail page shows listing type
- [ ] **Expected**: Listing type is clearly displayed

---

### 5. **Database Verification**

#### Test 5.1: Check Database
- [ ] Connect to PostgreSQL database
- [ ] Run: `SELECT id, title, "listingType", "propertyType" FROM properties;`
- [ ] **Expected**: All properties have `listingType` column
- [ ] **Expected**: Existing properties default to `'sale'`
- [ ] **Expected**: New properties have correct `listingType`

---

## 🐛 Common Issues to Watch For

### Issue 1: "Access Denied" showing for LISTER
- **Cause**: Role name mismatch (check if user role is exactly `'lister'`)
- **Fix**: Verify user role in database matches enum value

### Issue 2: ListingType not saving
- **Cause**: Frontend not sending `listingType` in request
- **Fix**: Check browser console for request payload

### Issue 3: Filter not working
- **Cause**: Backend query not filtering by `listingType`
- **Fix**: Check backend logs for query parameters

### Issue 4: Migration not applied
- **Cause**: Database column missing
- **Fix**: Run `npm run fix:listing-type` in backend directory

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Backend Status: [ ] Running [ ] Not Running
Frontend Status: [ ] Running [ ] Not Running

BUYER Tests:
- Dashboard Access: [ ] Pass [ ] Fail
- Create Listing Access: [ ] Pass [ ] Fail
- Browse Properties: [ ] Pass [ ] Fail

LISTER Tests:
- Dashboard Access: [ ] Pass [ ] Fail
- Create Property: [ ] Pass [ ] Fail
- Edit Property: [ ] Pass [ ] Fail
- ListingType Filtering: [ ] Pass [ ] Fail

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________
```

---

## 🎯 Quick Test (5 minutes)

If you're short on time, test these critical paths:

1. ✅ Login as BUYER → Try `/dashboard` → Should see "Access Denied"
2. ✅ Login as LISTER → Create property with `listingType: "rent"` → Should save
3. ✅ Go to `/properties` → Filter by "For Rent" → Should see your property
4. ✅ Property card should show blue "For Rent" badge

If all 4 pass, the core functionality is working! 🎉

