# Job Request Workflow Testing Guide

This guide walks you through testing the complete job request workflow from creation to completion.

## Prerequisites

1. **Backend server running**: `npm run start:dev` in `backend/` directory
2. **Database migrations**: All migrations executed (✅ Done)
3. **Authentication tokens**: You'll need JWT tokens for:
   - A **client** user (regular user who requests services)
   - A **provider** user (service provider with `PROPERTY_MANAGER` or `LISTER` role)

## Step 1: Get Authentication Tokens

### Option A: Using Existing Users
If you have existing users, login via your frontend or API:
```bash
POST /auth/login
{
  "email": "client@example.com",
  "password": "password"
}
```

### Option B: Create Test Users
You can use the admin script or create users via registration endpoint.

## Step 2: Test Job Creation (Client Side)

### Create a Job Request
```bash
POST /jobs/create
Authorization: Bearer <CLIENT_TOKEN>
Content-Type: multipart/form-data

Form Data:
- serviceType: "plumbing"
- title: "Fix leaking faucet"
- description: "Kitchen faucet is leaking, needs immediate repair"
- scheduledDate: "2025-01-15"
- scheduledTime: "10:00 AM"
- location: {"address": "123 Main St", "city": "Kampala"}
- price: 50000 (optional)
- currency: "UGX" (optional, defaults to UGX)
- providerId: <PROVIDER_ID> (optional - can assign later)
- images: <file1>, <file2> (optional - up to 10 images)
```

**Expected Response:**
```json
{
  "id": "uuid",
  "clientId": "client-uuid",
  "providerId": null,
  "serviceType": "plumbing",
  "title": "Fix leaking faucet",
  "description": "Kitchen faucet is leaking...",
  "status": "pending",
  "scheduledDate": "2025-01-15",
  "scheduledTime": "10:00 AM",
  "location": {
    "address": "123 Main St",
    "city": "Kampala"
  },
  "price": 50000,
  "currency": "UGX",
  "createdAt": "2025-01-08T..."
}
```

**Check Backend Logs:**
You should see:
```
[NOTIFICATION] Job created: <job-id>
```

## Step 3: Assign Provider to Job (Client Side)

If you didn't assign a provider during creation, you can assign one now:

```bash
POST /jobs/<job-id>/assign
Authorization: Bearer <CLIENT_TOKEN>
Content-Type: application/json

{
  "providerId": "<PROVIDER_USER_ID>",
  "message": "Please accept this job" (optional)
}
```

**Expected Response:**
```json
{
  "id": "job-uuid",
  "providerId": "provider-uuid",
  "status": "pending",
  ...
}
```

**Check Backend Logs:**
```
[NOTIFICATION] Job assigned: <job-id> to provider <provider-id>
```

## Step 4: Provider Accepts Job

```bash
POST /jobs/<job-id>/accept
Authorization: Bearer <PROVIDER_TOKEN>
```

**Expected Response:**
```json
{
  "id": "job-uuid",
  "status": "accepted",
  ...
}
```

**Check Backend Logs:**
```
[NOTIFICATION] Job accepted: <job-id>
[NOTIFICATION] Job status updated: <job-id> from pending to accepted
```

## Step 5: Provider Starts Work

```bash
POST /jobs/<job-id>/start
Authorization: Bearer <PROVIDER_TOKEN>
```

**Expected Response:**
```json
{
  "id": "job-uuid",
  "status": "in_progress",
  ...
}
```

**Check Backend Logs:**
```
[NOTIFICATION] Job started: <job-id>
[NOTIFICATION] Job status updated: <job-id> from accepted to in_progress
```

## Step 6: Provider Completes Job

```bash
POST /jobs/<job-id>/complete
Authorization: Bearer <PROVIDER_TOKEN>
Content-Type: application/json

{
  "completionNotes": "Fixed the leak by replacing the washer. Tested and working properly.",
  "completionPhotos": ["https://r2-url.com/photo1.jpg", "https://r2-url.com/photo2.jpg"] (optional)
}
```

**Expected Response:**
```json
{
  "id": "job-uuid",
  "status": "completed",
  "completedAt": "2025-01-08T...",
  "completionNotes": "Fixed the leak...",
  "completionPhotos": [...],
  ...
}
```

**Check Backend Logs:**
```
[NOTIFICATION] Job completed: <job-id>
[NOTIFICATION] Job status updated: <job-id> from in_progress to completed
```

## Step 7: Client Rates Job (Optional)

```bash
POST /jobs/<job-id>/rate
Authorization: Bearer <CLIENT_TOKEN>
Content-Type: application/json

{
  "rating": 5,
  "review": "Excellent work! Very professional and timely."
}
```

## Alternative: Update Status Directly

You can also update job status directly:

```bash
PATCH /jobs/<job-id>/status
Authorization: Bearer <PROVIDER_TOKEN>
Content-Type: application/json

{
  "status": "completed",
  "reason": "optional cancellation reason if cancelling"
}
```

## Query Jobs

### Get All Jobs (Admin)
```bash
GET /jobs?page=1&pageSize=10&status=pending
Authorization: Bearer <TOKEN>
```

### Get My Jobs (Client)
```bash
GET /jobs/my?status=pending
Authorization: Bearer <CLIENT_TOKEN>
```

### Get Provider Jobs
```bash
GET /jobs/provider?status=accepted
Authorization: Bearer <PROVIDER_TOKEN>
```

### Get Single Job
```bash
GET /jobs/<job-id>
Authorization: Bearer <TOKEN>
```

## Testing Maintenance Ticket → Job Link

### Create Maintenance Ticket with Job Link
```bash
POST /maintenance-tickets
Authorization: Bearer <TENANT_TOKEN>
Content-Type: application/json

{
  "title": "Broken AC Unit",
  "description": "AC not cooling properly",
  "category": "hvac",
  "priority": "high",
  "property": "Building A",
  "unit": "Unit 101",
  "location": "Living room",
  "jobId": "<job-id>" (optional - can link later)
}
```

### Link Job to Maintenance Ticket
```bash
POST /maintenance-tickets/<ticket-id>/link-job
Authorization: Bearer <OWNER_TOKEN>
Content-Type: application/json

{
  "jobId": "<job-id>"
}
```

**Check Backend Logs:**
```
[NOTIFICATION] Maintenance ticket linked to job: <ticket-id> -> <job-id>
```

## Testing Checklist

- [ ] ✅ Create job as client
- [ ] ✅ Assign provider to job
- [ ] ✅ Provider accepts job
- [ ] ✅ Provider starts job
- [ ] ✅ Provider completes job with notes/photos
- [ ] ✅ Client rates completed job
- [ ] ✅ Query jobs (all, my jobs, provider jobs)
- [ ] ✅ Link maintenance ticket to job
- [ ] ✅ Check notification logs for all events

## Common Issues

### "Only providers can accept jobs"
- Make sure you're using a provider token (user with `PROPERTY_MANAGER` or `LISTER` role)

### "Job not found"
- Check the job ID is correct
- Make sure you have access to the job (client, provider, or admin)

### "Can only accept pending jobs"
- Job must be in `pending` status before accepting
- Check current status: `GET /jobs/<job-id>`

### Migration errors
- If you see column already exists errors, the migration was already run
- Check migration status: `npm run migration:show`

## Notification Events Fired

All these events should appear in your backend logs:

1. `job.created` - When job is created
2. `job.assigned` - When provider is assigned
3. `job.accepted` - When provider accepts
4. `job.started` - When provider starts work
5. `job.completed` - When provider completes
6. `job.status.updated` - On any status change
7. `maintenance-ticket.created` - When ticket is created
8. `maintenance-ticket.job.linked` - When job is linked to ticket

## Next Steps

Once testing is complete, you can:
1. Implement email/SMS notifications by uncommenting TODO sections in `notifications.listener.ts`
2. Add more event handlers as needed
3. Test the full workflow with real users via frontend
