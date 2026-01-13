# Frontend Job Request Testing Guide

This guide helps you test the job request workflow from the frontend.

## Prerequisites

1. **Backend server running**: `npm run start:dev` in `backend/` directory
2. **Frontend server running**: `npm run dev` in `FRONTEND/property-market/` directory
3. **User accounts**: You need at least:
   - A **client** user (regular user account)
   - A **provider** user (service provider with verified profile)

## Testing Flow

### Step 1: Login as Client

1. Navigate to `/auth/login`
2. Login with your client account credentials
3. You should be redirected to the dashboard

### Step 2: Browse Providers

1. Navigate to `/providers` or use the navigation menu
2. Browse available service providers
3. Click on a provider to view their profile

### Step 3: Create Job Request

1. On a provider's profile page, click **"Request Service"** or similar button
2. Fill out the job request form:
   - **Type of Work**: Select or enter service type
   - **Service Address**: Enter the address where service is needed
   - **Preferred Date**: Select a date
   - **Preferred Time**: Select a time
   - **Additional Notes**: Describe what you need
   - **Images**: Upload photos (optional, up to 10 images)
3. Click **"Send Request"** or **"Submit"**

**Expected Result:**
- Success message appears
- Job is created with status "pending"
- Provider receives notification (check backend logs)

### Step 4: Login as Provider

1. Logout from client account
2. Login with provider account
3. Navigate to Provider Dashboard (`/dashboard/provider`)

### Step 5: View Pending Jobs

1. In the Provider Dashboard, you should see:
   - **Pending Jobs** section
   - Jobs assigned to you with "pending" status
2. Click on a job to view details

### Step 6: Accept Job

1. In the job detail modal, click **"Accept Job"** button
2. Job status changes to "accepted"
3. Client receives notification (check backend logs)

**Expected Result:**
- Job status updates to "accepted"
- Job moves to "Accepted Jobs" section
- Success message appears

### Step 7: Start Job

1. Find the accepted job in your dashboard
2. Click **"Start Job"** button
3. Job status changes to "in_progress"

**Expected Result:**
- Job status updates to "in_progress"
- Job moves to "In Progress" section

### Step 8: Complete Job

1. Find the in-progress job
2. Click **"Complete Job"** button
3. Optionally add completion notes and photos
4. Submit completion

**Expected Result:**
- Job status updates to "completed"
- Job moves to "Completed Jobs" section
- Client receives notification

### Step 9: Client Rates Job (Optional)

1. Logout from provider account
2. Login as client
3. Navigate to your jobs/dashboard
4. Find the completed job
5. Rate and review the job

## Testing Checklist

### Client Side
- [ ] ✅ Can browse providers
- [ ] ✅ Can view provider details
- [ ] ✅ Can create job request
- [ ] ✅ Can upload images with job request
- [ ] ✅ Success message appears after creation
- [ ] ✅ Can view my jobs
- [ ] ✅ Can see job status updates
- [ ] ✅ Can rate completed jobs

### Provider Side
- [ ] ✅ Can view pending jobs assigned to me
- [ ] ✅ Can view job details
- [ ] ✅ Can accept job
- [ ] ✅ Can start job
- [ ] ✅ Can complete job
- [ ] ✅ Can reject/cancel job
- [ ] ✅ Job status updates correctly
- [ ] ✅ Jobs filter correctly by status

## Common Issues & Solutions

### "Failed to send request"
- **Check**: Backend server is running
- **Check**: You're logged in (check token in localStorage)
- **Check**: Network tab for API errors
- **Check**: Backend logs for validation errors

### "Only providers can accept jobs"
- **Check**: You're logged in as a provider account
- **Check**: Provider profile is verified
- **Check**: User role is `PROPERTY_MANAGER` or `LISTER`

### Job doesn't appear in provider dashboard
- **Check**: Job was assigned to this provider (`providerId` matches)
- **Check**: Refresh the page
- **Check**: Check browser console for errors
- **Check**: API response in Network tab

### Images not uploading
- **Check**: File size (max 5MB per image)
- **Check**: File type (jpg, jpeg, png, webp only)
- **Check**: Backend R2 configuration
- **Check**: Network tab for upload errors

### Status not updating
- **Check**: Backend logs for errors
- **Check**: Network tab for API response
- **Check**: Refresh page to see updates
- **Check**: Browser console for errors

## API Endpoints Used

The frontend uses these endpoints:

- `POST /jobs/create` - Create job request
- `GET /jobs/my` - Get client's jobs
- `GET /jobs/provider` - Get provider's jobs
- `GET /jobs/:id` - Get single job
- `POST /jobs/:id/accept` - Provider accepts job
- `POST /jobs/:id/start` - Provider starts job
- `POST /jobs/:id/complete` - Provider completes job
- `PATCH /jobs/:id/status` - Update job status
- `POST /jobs/:id/rate` - Rate completed job

## Debugging Tips

1. **Open Browser DevTools**:
   - Network tab: Check API requests/responses
   - Console tab: Check for JavaScript errors
   - Application tab: Check localStorage for auth token

2. **Check Backend Logs**:
   - Look for `[NOTIFICATION]` messages
   - Look for `[JOBS]` messages
   - Check for validation errors

3. **Test API Directly**:
   - Use Postman or curl to test endpoints
   - Verify backend is working independently

4. **Check Authentication**:
   - Verify token is in localStorage
   - Check token expiration
   - Try logging out and back in

## Next Steps

After testing:
1. Report any bugs or issues
2. Test edge cases (cancellations, disputes, etc.)
3. Test with multiple users simultaneously
4. Test on different browsers/devices
5. Test with slow network (throttle in DevTools)
