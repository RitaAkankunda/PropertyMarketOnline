# R2 Public Access Setup Guide

## Issue: Images Not Displaying

If you're seeing placeholder thumbnails instead of actual images, your R2 bucket likely needs to be configured for public access.

## Solution: Configure R2 Bucket for Public Access

### Option 1: Use Custom Domain (Recommended)

1. Go to Cloudflare Dashboard → R2 → Your Bucket (`propertymarketnew`)
2. Navigate to **Settings** → **Public Access**
3. Click **Connect Domain** or **Add Custom Domain**
4. Add a custom domain (e.g., `cdn.yourdomain.com`)
5. Update your `.env` file:
   ```env
   R2_PUBLIC_URL=https://cdn.yourdomain.com
   ```

### Option 2: Enable Public Access (If Available)

1. Go to Cloudflare Dashboard → R2 → Your Bucket (`propertymarketnew`)
2. Navigate to **Settings** → **Public Access**
3. Enable **Public Access** if the option is available
4. The public URL format will be: `https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/<key>`

### Option 3: Verify Current Configuration

1. Check your R2 bucket settings in Cloudflare Dashboard
2. Verify that public access is enabled
3. Test a URL manually in your browser:
   ```
   https://88d5f353334b051133dbf5a76b3e81a9.r2.cloudflarestorage.com/propertymarketnew/images/<some-key>
   ```

## Debugging Steps

1. **Check Backend Logs**: After uploading, check your backend console for:
   ```
   [R2Service] File uploaded successfully: { bucket, key, publicUrl }
   ```

2. **Check Browser Console**: Open browser DevTools → Console and look for:
   - Image URLs being logged
   - Any "Image failed to load" errors
   - Network tab to see if image requests are failing

3. **Verify URLs**: Copy the URL from the logs and try accessing it directly in your browser

## Current URL Format

The system generates URLs in this format:
```
https://88d5f353334b051133dbf5a76b3e81a9.r2.cloudflarestorage.com/propertymarketnew/images/<uuid>.<ext>
```

This format works **only if**:
- The bucket is configured for public access, OR
- You have a custom domain configured

## Next Steps

1. Check your Cloudflare R2 bucket settings
2. Enable public access or configure a custom domain
3. Restart your backend server
4. Try uploading a new image
5. Check the browser console for the actual URLs being generated

