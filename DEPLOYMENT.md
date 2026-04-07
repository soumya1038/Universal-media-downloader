# Deployment Guide: Universal Media Downloader

This guide explains how to deploy the application for mobile and web usage using **Netlify** (Frontend) and **Railway** (Backend).

## Step 1: Deploy the Backend (Railway)

The backend must be hosted on a service like Railway because it requires system binaries (`yt-dlp` and `ffmpeg`) which Netlify cannot run.

1.  **Create a Account:** Go to [railway.app](https://railway.app/) and sign up.
2.  **New Project:** Click **New Project** > **Deploy from GitHub repo**.
3.  **Select Repo:** Choose this repository.
4.  **Configure Root:** When prompted, set the **Root Directory** to `server`.
5.  **Environment Variables:** Add the following variables in the Railway dashboard:
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `FRONTEND_URL`: `https://your-netlify-app-name.netlify.app`
6.  **Deploy:** Railway will detect the `Dockerfile` in the `server` directory and build the backend.
7.  **Get URL:** Once deployed, copy your backend's public URL (e.g., `https://server-production-xxxx.up.railway.app`).

---

## Step 2: Deploy the Frontend (Netlify)

1.  **Create a Account:** Go to [netlify.com](https://www.netlify.com/).
2.  **Add New Site:** Click **Add new site** > **Import an existing project** > **GitHub**.
3.  **Select Repo:** Choose this repository.
4.  **Site Settings:** Netlify should automatically detect the `netlify.toml` file. If not, use these settings:
    *   **Base directory:** (Leave empty/Root)
    *   **Build command:** `npm run build --prefix client`
    *   **Publish directory:** `client/dist`
5.  **Environment Variables:** (Optional) If you want to use a specific version.
6.  **Deploy:** Click **Deploy site**.

---

## Step 3: Link the Frontend to the Backend

1.  In your code (local), open `netlify.toml`.
2.  Update the `to` field in the `/api/*` redirect:
    ```toml
    [[redirects]]
      from = "/api/*"
      to = "https://YOUR-RAILWAY-URL.up.railway.app/api/:splat"
      status = 200
      force = true
    ```
3.  Commit and push this change to GitHub. Netlify will redeploy automatically.

---

## Mobile Usage Tips

*   **Add to Home Screen:** On your mobile browser (Safari/Chrome), tap the "Share" or "Menu" icon and select **"Add to Home Screen"** to use the app like a native mobile app.
*   **Downloads:** On iOS, downloads will appear in the "Files" app. On Android, they will be in your "Downloads" folder.
*   **Save Battery:** If the 3D background is slow on your mobile device, you can disable it in the **Settings** menu within the app.
