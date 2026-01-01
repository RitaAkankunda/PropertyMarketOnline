# Setup Guide for Team Members

This guide will help your colleagues set up the project after pulling the latest changes.

## ✅ What Works After Pulling

After pulling the code, your colleagues will have access to:
- ✅ **Sign Up** - Regular email/password registration
- ✅ **Login** - Email/password authentication
- ✅ **Google OAuth** - Sign up/login with Google (requires setup below)

## 📋 Required Setup Steps

### 1. Backend Environment Variables

Create a `.env` file in the `backend/` directory with:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=propertymarket

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Admin Management
ADMIN_SEED_TOKEN=your_secure_seed_token_here

# Google OAuth (Required for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Port
PORT=3001
```

### 2. Frontend Environment Variables

Create a `.env.local` file in the `FRONTEND/property-market/` directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ADMIN_SEED_TOKEN=your_secure_seed_token_here
```

### 3. Database Setup

#### Step 1: Run Database Migrations

The database needs the `listingType` column. Run this script:

```bash
cd backend
node scripts/add-listing-type.js
```

This will:
- Create the `properties_listingtype_enum` type
- Add the `listingType` column to the `properties` table

#### Step 2: Verify Database Schema

Make sure your database has:
- `users` table
- `properties` table with `listingType` column
- All required enums

### 4. Google OAuth Setup (For Google Sign-In)

**We use shared Google OAuth credentials for the team.**

#### Getting the Shared Credentials

Ask your team lead or project owner for:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Add them to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_shared_client_id_here
GOOGLE_CLIENT_SECRET=your_shared_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Important:** The shared credentials are already configured in Google Cloud Console with the callback URL: `http://localhost:3000/auth/google/callback`

#### If You Need to Create New Credentials (Team Lead Only)

Only create new credentials if the shared ones are not working:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project with shared credentials
3. Go to "Credentials" → Find existing OAuth 2.0 Client ID
4. Verify "Authorized redirect URIs" includes: `http://localhost:3000/auth/google/callback`
5. If needed, add it and save

### 5. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../FRONTEND/property-market
npm install
```

### 6. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd FRONTEND/property-market
npm run dev
```

## 🚀 Quick Start Checklist

- [ ] Pull latest code from repository
- [ ] Copy `.env` file to `backend/` directory and fill in values
- [ ] Copy `.env.local` file to `FRONTEND/property-market/` directory
- [ ] Run database migration: `cd backend && node scripts/add-listing-type.js`
- [ ] Set up Google OAuth credentials (if using Google sign-in)
- [ ] Install dependencies: `npm install` in both backend and frontend
- [ ] Start backend: `cd backend && npm run start:dev`
- [ ] Start frontend: `cd FRONTEND/property-market && npm run dev`
- [ ] Test sign up, login, and Google OAuth

## ⚠️ Important Notes

### Google OAuth
- **Without Google credentials**: Regular sign up and login will work, but Google sign-in button will fail
- **With shared Google credentials**: All authentication methods will work
- **Get credentials from**: Your team lead or project owner

### Database
- The `listingType` migration must be run before the app will work correctly
- Existing properties will get a default `listingType` of 'sale'

### Ports
- Backend runs on: `http://localhost:3001`
- Frontend runs on: `http://localhost:3000`
- Make sure these ports are available

## 🐛 Troubleshooting

### "Cannot connect to backend server"
- Check if backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### "column property.listingType does not exist"
- Run the migration: `cd backend && node scripts/add-listing-type.js`

### Google OAuth not working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check callback URL in Google Cloud Console matches: `http://localhost:3000/auth/google/callback`
- Make sure Google+ API is enabled in Google Cloud Console

### "Access Denied" on Dashboard
- OAuth users are automatically assigned "lister" role
- If you see "Access Denied", your role might be "buyer" or "renter"
- Log out and log back in via Google OAuth to upgrade your role

## 📝 Sharing Credentials Securely

**DO NOT commit `.env` files to git!** (They're already in `.gitignore`)

### For Team Members:
**Ask your team lead for the shared Google OAuth credentials:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

These are the same credentials used by the entire team for development.

### For Team Leads:
**How to share the shared credentials:**

1. **Password Manager** (Recommended)
   - Add credentials to shared vault (1Password, LastPass, Bitwarden)
   - Share access with team members

2. **Secure Team Chat**
   - Share in private Slack/Discord channel
   - Or via Microsoft Teams private chat

3. **Encrypted Document**
   - Create password-protected document
   - Share password separately

4. **Direct Message**
   - Send via Signal, WhatsApp, or secure email

**⚠️ Never share credentials in:**
- ❌ Public repositories or commits
- ❌ Unencrypted email
- ❌ Public chat channels
- ❌ Screenshots in public places
- ❌ Code comments or documentation files

### Quick Share Template

When sharing with team members, you can use this format:

```
Google OAuth Credentials (Shared for Development):

GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

Add these to your backend/.env file.

Callback URL is already configured: http://localhost:3000/auth/google/callback
```

## ✅ Testing Checklist

After setup, test:
- [ ] Regular sign up (email/password)
- [ ] Regular login (email/password)
- [ ] Google OAuth sign up/login
- [ ] Dashboard access after login
- [ ] Property creation
- [ ] Property listing

---

**Need Help?** Check the console logs for detailed error messages. Most issues are related to missing environment variables or database setup.

