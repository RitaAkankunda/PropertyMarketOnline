# 🧪 Form Testing Guide

Complete guide for testing the refined Provider Registration and Request Service forms.

## 📋 Prerequisites

Before testing, ensure you have:

1. ✅ Backend server running
2. ✅ Frontend server running
3. ✅ Database migrations completed (including jobs table)
4. ✅ User account created (for requesting services)

---

## 🚀 Step 1: Start the Servers

### Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
```

**Expected Output:**
```
Application is running on: http://localhost:3001
Swagger documentation: http://localhost:3001/api/docs
```

### Terminal 2 - Frontend:
```bash
cd FRONTEND/property-market
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

---

## 🗄️ Step 2: Run Database Migration (If Not Done)

The jobs table needs to be created:

```bash
cd backend
npm run build
# The migration should run automatically, or manually run:
# Check if migration file exists: backend/src/migrations/005-create-jobs-table.ts
```

**Verify Migration:**
- Check your database for a `jobs` table
- Should have columns: `id`, `clientId`, `providerId`, `serviceType`, `title`, `description`, `images`, `location`, `scheduledDate`, `scheduledTime`, `status`, etc.

---

## 📝 Step 3: Test Provider Registration Form

### Access the Form:
1. Navigate to: `http://localhost:3000/providers/register`
2. Or click "Become a Service Provider" from the providers page

### Test Checklist:

#### ✅ **Step 1: Business Information**
- [ ] **Business Name Field:**
  - Enter a name (e.g., "John's Electrical Services")
  - Try leaving it empty → Should show validation error
  - Try less than 3 characters → Should show error

- [ ] **Business Description:**
  - Enter description
  - Try less than 50 characters → Should show error
  - Character counter should update
  - Enter valid description (50+ chars) → Should allow proceeding

- [ ] **Progress Indicator:**
  - Step 1 should be highlighted in orange
  - Progress bar should show 25%
  - "Business Info" should be active

- [ ] **Navigation:**
  - Click "Continue" → Should move to Step 2
  - Should scroll to top smoothly

#### ✅ **Step 2: Services & Pricing**
- [ ] **Service Selection:**
  - Click service types (Electrician, Plumber, etc.)
  - Selected services should highlight in orange
  - Try proceeding without selecting → Should show error
  - Select multiple services → All should be selected

- [ ] **Pricing Type:**
  - Select "Hourly Rate" → Should show hourly rate input
  - Select "Fixed Price" → Should show minimum charge input
  - Select "Custom Quote" → No additional fields

- [ ] **Pricing Fields:**
  - Enter hourly rate (e.g., 50000)
  - Enter minimum charge (e.g., 100000)
  - Fields should accept numbers only

- [ ] **Progress Indicator:**
  - Step 1 should show checkmark (completed)
  - Step 2 should be highlighted
  - Progress bar should show 50%

- [ ] **Navigation:**
  - Click "Previous" → Should go back to Step 1
  - Click "Next Step" → Should move to Step 3

#### ✅ **Step 3: Location & Hours**
- [ ] **Location Fields:**
  - Enter city (e.g., "Kampala")
  - Enter district (optional, e.g., "Nakawa")
  - Enter service radius (e.g., 10)

- [ ] **Available Days:**
  - Click days of week
  - Selected days should highlight in orange
  - Try proceeding without selecting → Should show error
  - Select multiple days → All should be selected

- [ ] **Working Hours:**
  - Select start time (e.g., 08:00)
  - Select end time (e.g., 18:00)
  - Both fields should be required

- [ ] **Progress Indicator:**
  - Steps 1 & 2 should show checkmarks
  - Step 3 should be highlighted
  - Progress bar should show 75%

- [ ] **Navigation:**
  - Click "Previous" → Should go back to Step 2
  - Click "Review" → Should move to Step 4

#### ✅ **Step 4: Review**
- [ ] **Review Display:**
  - Should show all entered information
  - Business name, services, location, pricing, etc.
  - Should be in a nice formatted card

- [ ] **Progress Indicator:**
  - All steps should show checkmarks
  - Step 4 should be highlighted
  - Progress bar should show 100%

- [ ] **Submission:**
  - Click "Complete Registration"
  - Should show loading state
  - Should redirect to dashboard on success
  - Should show error if submission fails

#### ✅ **Visual/UX Checks:**
- [ ] Smooth animations between steps
- [ ] Form fields have proper focus states (orange ring)
- [ ] Error messages display correctly
- [ ] Buttons have hover effects
- [ ] Progress bar animates smoothly
- [ ] Benefits cards at bottom display correctly

---

## 🎯 Step 4: Test Request Service Modal

### Access the Modal:
1. Navigate to: `http://localhost:3000/providers`
2. Browse service providers
3. Click "Request" button on any provider card

### Test Checklist:

#### ✅ **Modal Opening:**
- [ ] Modal should appear with backdrop blur
- [ ] Should have smooth fade-in animation
- [ ] Provider name and category should display in header
- [ ] Verified badge should show if provider is verified

#### ✅ **Step 1: Service Details**
- [ ] **Dynamic Form Fields:**
  - Fields should match the service type (electrician, plumber, etc.)
  - Dropdowns should have options
  - Text inputs should work
  - Textareas should expand

- [ ] **Additional Notes:**
  - Should be optional
  - Should accept text input

- [ ] **Photo Upload:**
  - Upload area should be visible
  - Should show hover state
  - Should accept file selection (when implemented)

- [ ] **Progress Indicator:**
  - Step 1 should be highlighted
  - Should show "Details" label

- [ ] **Navigation:**
  - Click "Continue" → Should move to Step 2
  - Back button should not appear (first step)

#### ✅ **Step 2: Schedule**
- [ ] **Date Selection:**
  - Date picker should work
  - Should not allow past dates
  - Selected date should display

- [ ] **Time Selection:**
  - Dropdown should have options:
    - Morning (8AM - 12PM)
    - Afternoon (12PM - 4PM)
    - Evening (4PM - 7PM)
    - Flexible

- [ ] **Location:**
  - Address input should work
  - Should accept full address

- [ ] **Contact Phone:**
  - Phone input should work
  - Should accept phone numbers

- [ ] **Progress Indicator:**
  - Step 1 should show checkmark
  - Step 2 should be highlighted
  - Should show "Schedule" label

- [ ] **Navigation:**
  - Click "Back" → Should return to Step 1
  - Click "Continue" → Should move to Step 3

#### ✅ **Step 3: Payment**
- [ ] **Estimated Cost:**
  - Should display provider's price
  - Should be in orange highlighted box
  - Should have disclaimer text

- [ ] **Payment Methods:**
  - MTN Mobile Money → Should be selectable
  - Airtel Money → Should be selectable
  - Credit/Debit Card → Should be selectable
  - Pay After Service → Should be selectable
  - Selected method should highlight in orange
  - Radio button should show checkmark

- [ ] **Terms Checkbox:**
  - Should be visible
  - Should be checkable
  - Should link to terms (when implemented)

- [ ] **Progress Indicator:**
  - Steps 1 & 2 should show checkmarks
  - Step 3 should be highlighted
  - Should show "Payment" label

- [ ] **Navigation:**
  - Click "Back" → Should return to Step 2
  - "Submit Request" should be disabled if no payment method selected
  - Click "Submit Request" → Should submit

#### ✅ **Success Screen:**
- [ ] Should show success animation
- [ ] Should display provider name
- [ ] Should show reference number
- [ ] Reference number should be formatted (REQ-XXXXXXXX)
- [ ] "Done" button should close modal
- [ ] Should redirect or close properly

#### ✅ **Visual/UX Checks:**
- [ ] Modal has proper backdrop blur
- [ ] Smooth transitions between steps
- [ ] Form fields have orange focus rings
- [ ] Payment method cards have hover effects
- [ ] Selected payment method scales slightly
- [ ] Buttons have gradient backgrounds
- [ ] Loading states work correctly

---

## 🔄 Step 5: Test End-to-End Flow

### Complete Workflow Test:

1. **Register as Provider:**
   - [ ] Complete provider registration form
   - [ ] Submit successfully
   - [ ] Verify provider appears in directory

2. **Browse Providers:**
   - [ ] Navigate to `/providers`
   - [ ] See registered provider in list
   - [ ] Filter by category works
   - [ ] Search works

3. **Request Service:**
   - [ ] Click "Request" on provider
   - [ ] Fill out request form
   - [ ] Submit request
   - [ ] Verify success message

4. **Check Backend:**
   - [ ] Job should be created in database
   - [ ] Job should have correct status (pending)
   - [ ] Job should be linked to provider and client

5. **Provider Dashboard:**
   - [ ] Provider should see job request
   - [ ] Should be able to accept/reject
   - [ ] Status should update correctly

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to backend"
**Fix:**
- Check if backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS settings in backend

### Issue: "Jobs table does not exist"
**Fix:**
```bash
cd backend
npm run build
# Check if migration ran, or manually verify database
```

### Issue: "Form validation not working"
**Fix:**
- Check browser console for errors
- Verify form fields have proper `register` calls
- Check if zod schema is correct

### Issue: "Images not uploading"
**Fix:**
- Check R2 configuration in backend `.env`
- Verify file size limits (5MB max)
- Check file type validation (jpg, jpeg, png, webp)

### Issue: "Modal not closing"
**Fix:**
- Check if `onClose` prop is passed correctly
- Verify backdrop click handler
- Check for JavaScript errors in console

### Issue: "Progress bar not updating"
**Fix:**
- Verify `currentStep` state is updating
- Check step calculation logic
- Verify CSS transitions are working

---

## 🧪 Manual Testing Checklist

### Browser Compatibility:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Design:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Accessibility:
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly (if applicable)
- [ ] Color contrast sufficient

---

## 📊 Testing Results Template

```
Date: ___________
Tester: ___________

Provider Registration Form:
- Step 1: [ ] Pass [ ] Fail - Notes: ___________
- Step 2: [ ] Pass [ ] Fail - Notes: ___________
- Step 3: [ ] Pass [ ] Fail - Notes: ___________
- Step 4: [ ] Pass [ ] Fail - Notes: ___________
- Submission: [ ] Pass [ ] Fail - Notes: ___________

Request Service Modal:
- Step 1: [ ] Pass [ ] Fail - Notes: ___________
- Step 2: [ ] Pass [ ] Fail - Notes: ___________
- Step 3: [ ] Pass [ ] Fail - Notes: ___________
- Submission: [ ] Pass [ ] Fail - Notes: ___________

End-to-End Flow:
- Provider Registration: [ ] Pass [ ] Fail
- Job Creation: [ ] Pass [ ] Fail
- Provider Dashboard: [ ] Pass [ ] Fail

Issues Found:
1. ___________
2. ___________
3. ___________
```

---

## 🎯 Quick Test Commands

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check if jobs endpoint exists
curl http://localhost:3001/api/jobs

# Check frontend is running
curl http://localhost:3000
```

---

## ✅ Success Criteria

Forms are working correctly if:
1. ✅ All validation works
2. ✅ Progress indicators update correctly
3. ✅ Navigation between steps works
4. ✅ Form submission succeeds
5. ✅ Data is saved to database
6. ✅ Success screens display
7. ✅ No console errors
8. ✅ Smooth animations
9. ✅ Responsive on all devices
10. ✅ Accessible via keyboard

---

**Happy Testing! 🚀**

