# Architecture & Deployment Flow

## Current Problem

```
┌─────────────────────────────────────────────────────────────┐
│  Your Mobile/Desktop Browser                                │
│  https://universaldownload.netlify.app                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ POST /api/analyze
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Netlify (Static Host)                                      │
│  ✅ Serves: index.html, CSS, JS                             │
│  ❌ No backend server running                               │
│  ❌ /api/* routes → 404 NOT FOUND                           │
└─────────────────────────────────────────────────────────────┘
```

**Result**: 404 error because there's no backend to handle `/api/analyze`

---

## Correct Architecture (After Deployment)

```
┌─────────────────────────────────────────────────────────────┐
│  Your Mobile/Desktop Browser                                │
│  https://universaldownload.netlify.app                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ POST /api/analyze
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Netlify (Static Host + Proxy)                             │
│  ✅ Serves: index.html, CSS, JS                             │
│  ✅ Redirects /api/* → Backend URL                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Proxied to backend
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Render/Railway (Backend Server)                            │
│  https://your-app.onrender.com                              │
│  ✅ Express API running                                     │
│  ✅ yt-dlp + FFmpeg installed                               │
│  ✅ Handles /api/analyze, /api/download, etc.               │
└─────────────────────────────────────────────────────────────┘
```

**Result**: ✅ Everything works!

---

## What Each Service Does

| Service | Purpose | What It Hosts | Cost |
|---------|---------|---------------|------|
| **Netlify** | Frontend hosting | React app (HTML/CSS/JS) | Free |
| **Render** | Backend hosting | Express API + yt-dlp + FFmpeg | Free (with cold starts) |
| **GitHub** | Code repository | Source code | Free |

---

## The netlify.toml Magic

This file tells Netlify to **redirect** API calls to your backend:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

**Before deployment:**
- Browser → `https://universaldownload.netlify.app/api/analyze`
- Netlify → 404 (no backend)

**After deployment:**
- Browser → `https://universaldownload.netlify.app/api/analyze`
- Netlify → Redirects to → `https://your-backend.onrender.com/api/analyze`
- Backend → Processes request → Returns data ✅

---

## Why Two Separate Deployments?

1. **Netlify** is optimized for static files (React, Vue, etc.) — it's fast and free
2. **Render/Railway** can run Docker containers with system tools (yt-dlp, FFmpeg)
3. Netlify **cannot** run backend servers or install system binaries
4. This separation is standard for modern web apps (JAMstack architecture)

---

## Quick Deployment Checklist

- [ ] Deploy backend to Render (see DEPLOY_INSTRUCTIONS.md)
- [ ] Copy backend URL (e.g., `https://your-app.onrender.com`)
- [ ] Update `netlify.toml` with backend URL
- [ ] Push to GitHub
- [ ] Wait for Netlify to redeploy (~2 min)
- [ ] Test: Open app → Paste YouTube URL → Click Analyze
- [ ] ✅ Should work!

---

## Common Issues

### "Backend is slow on first request"
- Render free tier sleeps after 15 min of inactivity
- First request takes 30-60 seconds to wake up
- Solution: Upgrade to paid tier ($7/month) or use Railway

### "CORS error"
- Make sure `FRONTEND_URL` env var on backend matches your Netlify URL exactly
- Check backend logs on Render dashboard

### "Still getting 404"
- Verify `netlify.toml` was deployed (check Netlify deploy logs)
- Test backend directly: `https://your-backend.onrender.com/health`
- Check browser DevTools → Network tab → see where `/api/analyze` is going
