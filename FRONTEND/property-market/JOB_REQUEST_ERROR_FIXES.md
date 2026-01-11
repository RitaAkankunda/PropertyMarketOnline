# Job Request Error Fixes

## Common Errors and Solutions

### 1. "location with address and city is required"
**Cause**: The city field is missing or undefined.

**Fix Applied**: 
- Added fallback for city: `provider.location?.city || provider.location?.district || "Kampala"`
- This ensures a city is always provided even if provider location data is incomplete

### 2. "serviceType, title, and description are required"
**Cause**: One of these required fields is missing or empty.

**Check**:
- `serviceType`: Should come from `provider.serviceTypes[0]`
- `title`: Should come from form field "Type of Work" or default to provider business name
- `description`: Should come from "Additional Notes" field

**Fix**: The form already validates these, but ensure:
- Provider has at least one serviceType
- User fills in "Type of Work" or it defaults
- User fills in "Additional Notes" (minimum "Service request")

### 3. "scheduledDate and scheduledTime are required"
**Cause**: Date or time fields are not filled.

**Check**: 
- Form fields: "Preferred Date" or "date"
- Form fields: "Preferred Time" or "time"

**Fix**: Form validation already checks this before submission.

### 4. Network/Connection Errors
**Cause**: Backend server not running or wrong URL.

**Fix Applied**: 
- Improved error handling to detect connection errors
- Shows clear message: "Backend server is not running"

### 5. 401 Unauthorized
**Cause**: User not logged in or token expired.

**Fix Applied**:
- Error message: "You need to be logged in to create a job request"
- Check localStorage for auth token
- Try logging out and back in

### 6. 400 Bad Request
**Cause**: Validation error from backend.

**Fix Applied**:
- Error handling now extracts and displays backend validation messages
- Shows specific field errors if available

## Debugging Steps

1. **Open Browser DevTools** (F12)
2. **Check Console Tab**: Look for error logs
3. **Check Network Tab**: 
   - Find the `/jobs/create` request
   - Check Request Payload
   - Check Response (should show error details)
4. **Check Backend Logs**: Look for `[JOBS]` messages

## What to Check in Network Tab

When you submit the form, check the Network request:

### Request Payload Should Include:
```json
{
  "providerId": "uuid",
  "serviceType": "plumbing",
  "title": "Fix leaking faucet",
  "description": "Kitchen faucet is leaking...",
  "location": "{\"address\":\"123 Main St\",\"city\":\"Kampala\"}",
  "scheduledDate": "2025-01-15",
  "scheduledTime": "10:00 AM",
  "images": [File, File] // if uploaded
}
```

### Common Issues in Payload:
- ❌ `location` is not a JSON string (should be stringified)
- ❌ `city` is undefined or null
- ❌ `serviceType` is empty or undefined
- ❌ `scheduledDate` or `scheduledTime` is missing

## Testing Checklist

Before submitting:
- [ ] User is logged in (check localStorage)
- [ ] Provider has at least one serviceType
- [ ] Provider has location data (city)
- [ ] Form fields are filled:
  - [ ] Type of Work (or will default)
  - [ ] Service Address
  - [ ] Preferred Date
  - [ ] Preferred Time
  - [ ] Additional Notes (or will default)
- [ ] Backend server is running
- [ ] Backend URL is correct in `.env.local`

## Quick Fixes Applied

1. ✅ Improved error handling with detailed messages
2. ✅ Added city fallback (provider.location?.city || "Kampala")
3. ✅ Better network error detection
4. ✅ Validation error extraction from backend response
5. ✅ Console logging for debugging

## Next Steps if Still Getting Errors

1. **Check the exact error message** in the browser console
2. **Check the Network tab** for the failed request
3. **Check backend logs** for validation errors
4. **Share the error message** so we can identify the specific issue
