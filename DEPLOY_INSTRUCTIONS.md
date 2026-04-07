# 🚀 Quick Deployment Fix for 404 Error

Your frontend is deployed on Netlify, but the **backend is not deployed** — that's why you're getting 404 errors.

---

## The Problem

```
POST https://universaldownload.netlify.app/api/analyze 404 (Not Found)
```

This happens because:
- ✅ Frontend (React) is on Netlify
- ❌ Backend (Express API) is **NOT deployed** — it only runs on your local machine
- The `netlify.toml` file has a placeholder URL that doesn't exist

---

## The Solution (3 Steps)

### Step 1: Deploy Backend to Render (Free)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select this repository
4. Configure:
   - **Name**: `universal-media-downloader-api`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`

5. Add Environment Variables (click **Advanced**):
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://universaldownload.netlify.app
   MAX_FILE_SIZE_MB=2048
   MAX_CONCURRENT_DOWNLOADS=3
   FILE_RETENTION_HOURS=24
   ```

6. Click **Create Web Service**
7. Wait 5-10 minutes for deployment
8. **Copy your backend URL** (e.g., `https://universal-media-downloader-api.onrender.com`)

---

### Step 2: Update netlify.toml with Backend URL

1. Open `netlify.toml` in your code editor
2. Find this line:
   ```toml
   to = "https://your-backend-app.railway.app/api/:splat"
   ```
3. Replace with your **actual Render URL**:
   ```toml
   to = "https://universal-media-downloader-api.onrender.com/api/:splat"
   ```
4. Save the file

---

### Step 3: Push to GitHub

```bash
git add netlify.toml
git commit -m "fix: connect frontend to deployed backend"
git push origin main
```

Netlify will automatically redeploy (takes ~2 minutes).

---

## Verify It Works

1. Open `https://universaldownload.netlify.app`
2. Paste a YouTube URL
3. Click **Analyze**
4. ✅ Should work now!

---

## Alternative: Deploy Backend to Railway

If Render doesn't work, try Railway:

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. Settings → **Root Directory**: `server`
5. Add same environment variables as above
6. Copy the Railway URL and update `netlify.toml`

---

## Troubleshooting

### Backend deployment fails
- Check Render logs for errors
- Make sure `server/Dockerfile` exists
- Verify `server/package.json` has all dependencies

### Still getting 404
- Check Netlify deploy logs — make sure the new `netlify.toml` was deployed
- Open browser DevTools → Network tab → check if `/api/analyze` redirects to your backend URL
- Test backend directly: `https://your-backend-url.onrender.com/health` should return `{"status":"ok"}`

### Backend is slow (first request)
- Render free tier "spins down" after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Upgrade to paid tier ($7/month) for always-on

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Netlify | Free | $0 |
| Render  | Free | $0 (with cold starts) |
| Render  | Starter | $7/month (always-on) |

---

## Need Help?

1. Check backend is running: `https://your-backend-url.onrender.com/health`
2. Check Render logs for errors
3. Check Netlify deploy logs
4. Verify `netlify.toml` has correct backend URL
