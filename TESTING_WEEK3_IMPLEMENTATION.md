# Testing Guide: Week 3 Implementation

This guide will help you verify that all the implemented features are working correctly.

## Prerequisites

1. **Backend is running** on `http://localhost:3000` (or your configured port)
2. **Frontend is running** on `http://localhost:3001` (or your configured port)
3. **Database is accessible** and migrations are up to date
4. **You have test accounts**:
   - A regular user account (client)
   - A service provider account
   - A property owner/manager account

---

## 1. Testing Event Emission & Notifications

### Test: Job Creation Events

**Steps:**
1. Log in as a regular user (client)
2. Navigate to `/providers`
3. Select a service provider
4. Click "Request Service"
5. Fill out the job request form and submit

**Expected Results:**
- ✅ Job is created successfully
- ✅ Check backend console logs - you should see:
  ```
  [JOBS] Job saved successfully: <job-id>
  [NOTIFICATION] ====== JOB CREATED EVENT RECEIVED ======
  [NOTIFICATION] Creating notification for client...
  ```
- ✅ Client receives a notification (check notification bell in header)
- ✅ Notification appears in the user's dashboard notifications tab

### Test: Job Status Update Events

**Steps:**
1. Log in as a service provider
2. Navigate to `/dashboard/provider`
3. Find a pending job
4. Click on the job to open details
5. Click "Accept Job"

**Expected Results:**
- ✅ Job status changes to "accepted"
- ✅ Backend console shows:
  ```
  [NOTIFICATION] ====== JOB ACCEPTED EVENT RECEIVED ======
  [NOTIFICATION] ====== JOB STATUS UPDATED EVENT RECEIVED ======
  ```
- ✅ Client receives notification about job acceptance
- ✅ Provider receives confirmation notification

### Test: Job Completion Events

**Steps:**
1. As provider, find an accepted or in-progress job
2. Click "Start Job" (if accepted) or "Mark as Completed" (if in progress)
3. Complete the job

**Expected Results:**
- ✅ Job status updates correctly
- ✅ Events are emitted: `job.started` or `job.completed`
- ✅ Notifications are sent to both client and provider

---

## 2. Testing Job-Ticket Linking (Backend)

### Test: Link Existing Job to Ticket

**Using API directly (Postman/Thunder Client):**

1. **Get a maintenance ticket ID:**
   ```http
   GET /api/maintenance-tickets
   Authorization: Bearer <owner-token>
   ```
   Note down a ticket ID that doesn't have a `jobId`

2. **Get a job ID:**
   ```http
   GET /api/jobs
   Authorization: Bearer <client-token>
   ```
   Note down a job ID

3. **Link the job to the ticket:**
   ```http
   POST /api/maintenance-tickets/{ticketId}/link-job
   Authorization: Bearer <owner-token>
   Content-Type: application/json

   {
     "jobId": "<job-id>"
   }
   ```

**Expected Results:**
- ✅ Response status: `200 OK`
- ✅ Response includes the ticket with `jobId` field populated
- ✅ Check database: `maintenance_tickets` table should have `jobId` set

### Test: Create Job from Ticket

**Using API:**

```http
POST /api/maintenance-tickets/{ticketId}/create-job
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "providerId": "<provider-id>",
  "serviceType": "electrician",
  "title": "Fix electrical issue from ticket",
  "description": "Created from maintenance ticket",
  "location": {
    "address": "123 Main St",
    "city": "Kampala"
  },
  "scheduledDate": "2024-02-15",
  "scheduledTime": "10:00",
  "price": 50000,
  "currency": "UGX"
}
```

**Expected Results:**
- ✅ Response status: `200 OK`
- ✅ Response includes both `ticket` and `job` objects
- ✅ Ticket's `jobId` is set to the new job's ID
- ✅ Job is created with the provided details
- ✅ Job creation event is emitted

---

## 3. Testing Frontend UI Components

### Test: Job Status Timeline Component

**Steps:**
1. Log in as a client
2. Navigate to `/dashboard/user`
3. Click on any job/request in the list
4. Scroll down in the job detail modal

**Expected Results:**
- ✅ "Status Timeline" section is visible
- ✅ Timeline shows status progression:
  - Pending (with creation date)
  - Accepted (if job is accepted or beyond)
  - In Progress (if job is in progress or completed)
  - Completed (if job is completed)
- ✅ Current status is highlighted with appropriate color
- ✅ Icons are displayed correctly for each status

**Test with Provider:**
1. Log in as service provider
2. Navigate to `/dashboard/provider`
3. Click on any job
4. Check timeline display

**Expected Results:**
- ✅ Same timeline component appears
- ✅ Shows completion date if job is completed

### Test: Job-Ticket Linking UI (Maintenance Ticket)

**Steps:**
1. Log in as a property owner/manager
2. Navigate to `/dashboard/maintenance` (or `/dashboard/owner` if you have tickets there)
3. Click on a maintenance ticket that doesn't have a linked job
4. In the ticket detail modal, look for "Job Management" section

**Expected Results:**
- ✅ "Link Existing Job" button is visible
- ✅ "Create New Job" button is visible
- ✅ If ticket already has a linked job, it shows:
  - "Linked Job" section with job title/ID
  - Link to view the job
  - No linking buttons

**Test: Link Existing Job**
1. Click "Link Existing Job"
2. Modal opens showing available jobs
3. Select a job from the list
4. Click on the job

**Expected Results:**
- ✅ Job is linked successfully
- ✅ Success message appears
- ✅ Ticket detail modal refreshes
- ✅ "Linked Job" section appears with job details
- ✅ Linking buttons disappear

**Test: Create Job from Ticket**
1. Click "Create New Job"
2. Fill out the job creation form:
   - Service Type (pre-filled from ticket category)
   - Title (pre-filled from ticket title)
   - Description (pre-filled from ticket description)
   - Scheduled Date & Time
   - Price (optional)
3. Click "Create Job"

**Expected Results:**
- ✅ Job is created successfully
- ✅ Job is automatically linked to the ticket
- ✅ Success message appears
- ✅ Ticket detail modal refreshes
- ✅ "Linked Job" section appears

---

## 4. Testing Integration Workflows

### Complete Workflow: Ticket → Job → Completion

**Steps:**
1. **Create a maintenance ticket:**
   - Log in as tenant
   - Go to `/dashboard/maintenance`
   - Create a new ticket (e.g., "Electrical outlet not working")

2. **Owner creates job from ticket:**
   - Log in as property owner
   - View the ticket
   - Click "Create New Job"
   - Fill form and submit

3. **Provider accepts job:**
   - Log in as service provider
   - Go to `/dashboard/provider`
   - Find the newly created job
   - Accept it

4. **Provider completes job:**
   - Start the job
   - Mark as completed

5. **Verify correlation:**
   - Owner views the ticket
   - Should see linked job with "completed" status
   - Click link to view job details

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Notifications are sent at each stage
- ✅ Ticket and job remain linked throughout
- ✅ Status timeline shows progression
- ✅ Both ticket and job reflect final status

---

## 5. Database Verification

### Check Job-Ticket Linking in Database

**Using SQL or database client:**

```sql
-- Check tickets with linked jobs
SELECT 
  mt.id as ticket_id,
  mt.title as ticket_title,
  mt.status as ticket_status,
  mt.jobId,
  j.id as job_id,
  j.title as job_title,
  j.status as job_status
FROM maintenance_tickets mt
LEFT JOIN jobs j ON mt."jobId" = j.id
WHERE mt."jobId" IS NOT NULL;
```

**Expected Results:**
- ✅ Returns tickets that have linked jobs
- ✅ `jobId` column is populated
- ✅ Job details are accessible via join

### Check Event Logs

**Check backend console for event emissions:**

Look for patterns like:
```
[NOTIFICATION] ====== JOB CREATED EVENT RECEIVED ======
[NOTIFICATION] ====== JOB ACCEPTED EVENT RECEIVED ======
[NOTIFICATION] ====== JOB STATUS UPDATED EVENT RECEIVED ======
```

---

## 6. Common Issues & Troubleshooting

### Issue: Events not being emitted

**Check:**
1. Is `EventEmitterModule` imported in `AppModule`? ✅ (Already done)
2. Is `EventEmitter2` injected in `JobsService`? ✅ (Already done)
3. Check backend console for errors
4. Verify job operations are going through `JobsService` methods

### Issue: Job-ticket linking fails

**Check:**
1. Is `JobsModule` imported in `MaintenanceTicketsModule`? ✅ (Already done)
2. Does the ticket exist?
3. Does the job exist?
4. Is the user authorized (owner/admin)?
5. Check backend logs for specific error messages

### Issue: Timeline not showing

**Check:**
1. Is `JobStatusTimeline` component imported?
2. Are job status values matching the expected types?
3. Check browser console for React errors
4. Verify job data includes `createdAt` and `status` fields

### Issue: Linking UI not appearing

**Check:**
1. Is user logged in as owner/manager?
2. Does the ticket have `jobId` already? (UI hides if linked)
3. Check browser console for errors
4. Verify `maintenanceTicketsService` methods are imported

---

## 7. Quick Test Checklist

- [ ] Create a job → Check notifications
- [ ] Accept a job → Check events and notifications
- [ ] Complete a job → Check timeline and notifications
- [ ] Create maintenance ticket
- [ ] Link existing job to ticket
- [ ] Create job from ticket
- [ ] View timeline in job detail modal
- [ ] View linked job in ticket detail modal
- [ ] Verify database relationships
- [ ] Test with different user roles (client, provider, owner)

---

## 8. API Endpoints Summary

**Job Events (Automatic):**
- `POST /api/jobs/create` → Emits `job.created`
- `POST /api/jobs/:id/accept` → Emits `job.accepted`, `job.status.updated`
- `POST /api/jobs/:id/start` → Emits `job.started`, `job.status.updated`
- `POST /api/jobs/:id/complete` → Emits `job.completed`, `job.status.updated`
- `PATCH /api/jobs/:id/status` → Emits `job.status.updated` (and specific events)

**Job-Ticket Linking:**
- `POST /api/maintenance-tickets/:id/link-job` → Link existing job
- `POST /api/maintenance-tickets/:id/create-job` → Create and link job

**Frontend Routes:**
- `/dashboard/user` → User jobs with timeline
- `/dashboard/provider` → Provider jobs with timeline
- `/dashboard/maintenance` → Maintenance tickets with linking UI
- `/dashboard/owner` → Owner dashboard (may have tickets)

---

## Success Criteria

✅ **All features are working if:**
1. Jobs emit events when created/updated
2. Notifications are received for job lifecycle events
3. Jobs can be linked to maintenance tickets
4. Jobs can be created from maintenance tickets
5. Timeline component displays correctly in job modals
6. Linking UI appears in ticket detail modals
7. Database relationships are maintained correctly
8. No console errors in browser or backend

If all these pass, your Week 3 implementation is complete and working! 🎉
