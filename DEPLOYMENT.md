# Deployment Guide: Universal Media Downloader

This guide explains how to deploy the application for mobile and web usage. This app uses a **Client-Server architecture**, meaning it needs two separate parts to work:
1.  **The Frontend (Client):** Hosted on **Netlify**. This is the interface you see on your phone.
2.  **The Backend (Server):** Hosted on **Render** (or Railway). This is the "Engine" that runs `yt-dlp` and `ffmpeg` to actually download and process the videos.

---

## Step 1: Deploy the Backend (Choose Render or Railway)

### Option A: Deploy on Render (Recommended)
1.  **Create Account:** Sign up at [render.com](https://render.com/).
2.  **New Web Service:** Click **New +** > **Web Service**.
3.  **Select Repo:** Connect your GitHub and choose this repository.
4.  **Configuration:**
    *   **Name:** `media-downloader-api`
    *   **Root Directory:** `server`
    *   **Runtime:** `Docker` (Render will detect your `Dockerfile`).
5.  **Environment Variables:** Click **Advanced** > **Add Environment Variable**:
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `FRONTEND_URL`: `https://your-netlify-app-name.netlify.app`
6.  **Deploy:** Render will build the Docker container and provide a URL (e.g., `https://media-downloader-api.onrender.com`).

---

### Option B: Deploy on Railway
1.  **Create Account:** Sign up at [railway.app](https://railway.app/).
2.  **New Project:** **New Project** > **Deploy from GitHub repo**.
3.  **Root Directory:** Set to `server`.
4.  **Environment Variables:** Add `PORT=5000`, `NODE_ENV=production`, and `FRONTEND_URL`.
5.  **Deploy:** Railway will automatically use the `server/Dockerfile`.

---

## Step 2: Deploy the Frontend (Netlify)

1.  **Add New Site:** At [netlify.com](https://www.netlify.com/), click **Add new site** > **Import an existing project**.
2.  **Site Settings:** It will automatically use the `netlify.toml` file in your repo.
3.  **Deploy:** Click **Deploy site**.

---

## Step 3: Link the Frontend to the Backend (Crucial)

To make the app "talk" to the server:
1.  Copy your **Backend URL** from Render or Railway.
2.  Open `netlify.toml` in your code.
3.  Update the `to` field:
    ```toml
    [[redirects]]
      from = "/api/*"
      to = "https://YOUR-RENDER-OR-RAILWAY-URL.com/api/:splat"
      status = 200
      force = true
    ```
4.  Commit and Push the change. Netlify will update instantly.

---

## Mobile Usage Tips

*   **Add to Home Screen:** On your mobile browser, tap "Share" (iOS) or "Menu" (Android) and select **"Add to Home Screen"**.
*   **Downloads:** On iOS, items go to the **Files** app. On Android, they go to **Downloads**.
