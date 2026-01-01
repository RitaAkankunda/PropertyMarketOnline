# Shared Credentials for Team

**⚠️ DO NOT COMMIT THIS FILE TO GIT!**

This file is for sharing credentials securely with your team members. After sharing, delete this file or keep it in a secure location.

## How to Share Credentials

1. **Fill in the credentials below**
2. **Share via secure method** (see options below)
3. **Delete this file** or move it to a secure location

---

## Google OAuth Credentials (Shared for Development)

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Callback URL:** `http://localhost:3000/auth/google/callback` (already configured)

---

## Cloudflare R2 Credentials (Shared for Development)

**⚠️ Everyone uses the same R2 bucket so we can all see the same images.**

```
R2_ACCOUNT_ID=your_r2_account_id_here
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=your_bucket_name_here
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Note:** The frontend `next.config.ts` is already configured with the shared R2 public URL, so team members don't need to change anything in the frontend.

---

## Secure Sharing Methods

### ✅ Recommended Methods:

1. **Password Manager** (Best)
   - 1Password, LastPass, Bitwarden shared vault
   - Create a secure note with these credentials

2. **Encrypted Document**
   - Create password-protected document
   - Share password separately via Signal/WhatsApp

3. **Private Team Chat**
   - Share in private Slack/Discord channel
   - Or Microsoft Teams private chat

4. **Direct Message**
   - Send via Signal, WhatsApp, or secure email

### ❌ NEVER Share Via:

- Public repositories or commits
- Unencrypted email
- Public chat channels
- Screenshots in public places
- Code comments or documentation files

---

## Instructions for Team Members

After receiving the credentials:

1. **Add Google OAuth to `backend/.env`:**
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

2. **Add R2 Credentials to `backend/.env`:**
   ```env
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=...
   R2_PUBLIC_URL=...
   ```

3. **No frontend changes needed** - `next.config.ts` is already configured!

4. **Restart both servers** after adding credentials

---

## Quick Copy Template

When sharing with team members, you can copy this:

```
Shared Credentials for PropertyMarket Online Development:

Google OAuth:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

Cloudflare R2 (Shared Bucket):
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...

Add these to your backend/.env file.
No frontend changes needed - already configured!
```

