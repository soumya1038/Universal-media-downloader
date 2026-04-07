# Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. Docker Build Fails: "npm ci can only install packages when package.json and package-lock.json are in sync"

**Error:**
```
npm error Missing: picomatch@4.0.4 from lock file
```

**Solution:**
```bash
cd server
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push origin main
```

**Why it happens:** Someone added/updated dependencies without regenerating the lock file.

---

### 2. Backend Deployment Succeeds but Returns 500 Error

**Check Render Logs:**
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Look for error messages

**Common causes:**
- Missing environment variables
- Database initialization failed
- Port binding issue

**Solution:**
```bash
# Make sure these env vars are set on Render:
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-netlify-app.netlify.app
```

---

### 3. CORS Error: "Access-Control-Allow-Origin"

**Error in browser console:**
```
Access to XMLHttpRequest at 'https://your-backend.onrender.com/api/analyze' 
from origin 'https://your-netlify-app.netlify.app' has been blocked by CORS policy
```

**Solution:**
1. Check `FRONTEND_URL` env var on Render matches your Netlify URL **exactly**
2. Make sure there's no trailing slash: ✅ `https://app.netlify.app` ❌ `https://app.netlify.app/`
3. Redeploy backend after changing env vars

---

### 4. Backend is Extremely Slow (30-60 seconds)

**Cause:** Render free tier "spins down" after 15 minutes of inactivity.

**Solutions:**

**Option A: Upgrade to paid tier ($7/month)**
- Always-on, no cold starts
- Better performance

**Option B: Keep-alive ping (free)**
Create a cron job to ping your backend every 10 minutes:

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new job:
   - URL: `https://your-backend.onrender.com/health`
   - Interval: Every 10 minutes
3. This keeps the backend awake

**Option C: Use Railway instead**
- Railway free tier has 500 hours/month (enough for most use cases)
- No cold starts during those hours

---

### 5. Netlify Still Shows 404 After Backend Deployment

**Checklist:**
- [ ] Backend is deployed and shows "Live" on Render
- [ ] Backend health check works: `https://your-backend.onrender.com/health` returns `{"status":"ok"}`
- [ ] `netlify.toml` has correct backend URL (no typos)
- [ ] `netlify.toml` changes are pushed to GitHub
- [ ] Netlify has redeployed (check deploy logs)

**Test the redirect:**
1. Open browser DevTools → Network tab
2. Try to analyze a URL
3. Look at the `/api/analyze` request
4. Check if it's being redirected to your backend URL

**If redirect isn't working:**
```bash
# Make sure netlify.toml looks like this:
[[redirects]]
  from = "/api/*"
  to = "https://your-actual-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

---

### 6. yt-dlp Fails: "Unable to extract video info"

**Common causes:**
- Video is private/deleted
- Platform changed their API (yt-dlp needs update)
- Geo-restricted content

**Solution:**
Update yt-dlp in the Docker container:

Edit `server/Dockerfile`:
```dockerfile
# Change this line to always get latest version:
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
```

Then redeploy on Render (it will rebuild the Docker image).

---

### 7. SQLite Database Errors

**Error:**
```
SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
The `storage` directory doesn't exist. This is already handled in the Dockerfile:
```dockerfile
RUN mkdir -p storage/downloads storage/temp
```

If you still get this error, check Render logs for permission issues.

---

### 8. File Downloads Don't Work

**Symptoms:**
- Download button appears
- Clicking it shows 404 or empty file

**Causes:**
1. File was auto-deleted (24-hour retention)
2. Storage path misconfigured
3. File wasn't saved correctly

**Check:**
1. Render logs for download errors
2. Verify `STORAGE_PATH` env var is set correctly
3. Check `FILE_RETENTION_HOURS` setting

---

### 9. Rate Limiting Issues

**Error:**
```
Too many requests, please try again later
```

**Solution:**
Adjust rate limits in Render env vars:
```
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests per window
```

For development, you can increase `MAX_REQUESTS` to 500.

---

### 10. Render Build Takes Too Long / Times Out

**Cause:** Docker build is slow (installing FFmpeg, yt-dlp, etc.)

**Solution:**
Render has a 15-minute build timeout. If you hit it:

1. Use a smaller base image (already using `node:20-slim`)
2. Cache Docker layers (Render does this automatically)
3. If still timing out, try Railway instead

---

## Getting Help

If none of these solutions work:

1. **Check Render Logs** — 90% of issues are visible here
2. **Test backend directly** — `curl https://your-backend.onrender.com/health`
3. **Check browser console** — Look for error messages
4. **Verify environment variables** — Make sure all required vars are set

---

## Useful Commands

```bash
# Test backend health
curl https://your-backend.onrender.com/health

# Test analyze endpoint
curl -X POST https://your-backend.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Check if Netlify redirect is working
curl -I https://your-netlify-app.netlify.app/api/health

# Regenerate package-lock.json
cd server && npm install

# Test Docker build locally
cd server && docker build -t test-backend .
docker run -p 5000:5000 test-backend
```
