# Debugging: Bookings Page Not Showing Jobs

## Issue
User created a job request and received a notification, but the bookings page shows nothing.

## Debugging Steps

### 1. Check Backend Logs

When you create a job, look for:
```
[JOBS CONTROLLER] Creating job for user: { sub: '...', id: '...', email: '...', usingClientId: '...' }
[JOBS SERVICE] Creating job for clientId: ...
[JOBS SERVICE] Client verified: { id: '...', email: '...' }
[JOBS] Job saved successfully: { id: '...', clientId: '...', title: '...' }
```

### 2. Check Frontend Console

When you visit `/bookings`, look for:
```
[BOOKINGS] User authenticated, fetching bookings... { userId: '...', email: '...' }
[BOOKINGS] Fetching user jobs for user: ... ...
[BOOKINGS] Received response: { total: X, dataCount: Y, data: [...] }
```

### 3. Check Backend When Fetching

When fetching jobs, look for:
```
[JOBS CONTROLLER] Finding my jobs for user: ...
[JOBS SERVICE] Finding jobs for clientId: ... with filters: { clientId: '...' }
[JOBS SERVICE] Found X jobs for clientId: ...
```

## Common Issues

### Issue 1: User ID Mismatch
**Symptom:** Job created with one ID, but fetched with different ID

**Check:**
- Compare the `clientId` used when creating vs. the `userId` used when fetching
- They should be the same

**Fix:** Both now use `req.user.sub || req.user.id` for consistency

### Issue 2: Job Not Saved
**Symptom:** Notification sent but job doesn't exist in database

**Check:**
- Look for `[JOBS] Job saved successfully:` in backend logs
- Verify the job exists in database: `SELECT * FROM jobs WHERE "clientId" = '<your-user-id>' ORDER BY "createdAt" DESC;`

### Issue 3: Query Not Finding Jobs
**Symptom:** Jobs exist but query returns 0

**Check:**
- Verify the `clientId` in database matches the `userId` being queried
- Check if there are any status filters applied
- Verify the relations are loaded correctly

## Quick Test

1. **Create a job** and note the `clientId` from backend logs
2. **Visit `/bookings`** and note the `userId` from frontend/backend logs
3. **Compare them** - they should match
4. **Check database directly:**
   ```sql
   SELECT id, "clientId", title, status, "createdAt" 
   FROM jobs 
   WHERE "clientId" = '<your-user-id>' 
   ORDER BY "createdAt" DESC;
   ```

## Solution Applied

1. ✅ Updated JWT strategy to include both `sub` and `id`
2. ✅ Added comprehensive logging at all levels
3. ✅ Added refresh button on bookings page
4. ✅ Added auto-refresh on page visibility
5. ✅ Improved error handling and logging

If the issue persists, check the console logs to see exactly what user IDs are being used.
