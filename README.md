# Universal Media Downloader

A clean, modern, high-performance web application for downloading and converting video/audio from YouTube, Instagram, Facebook, X (Twitter), TikTok, and direct URLs.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

---

## 🎯 Architecture & Structure

```
Universal-Media-Downloader/
├── client-2.0/             # Modern React SPA Frontend (Vite 7, Tailwind 4, Framer Motion)
│   ├── src/
│   │   ├── components/     # UI Components (Navbar, URLInput, VideoPreview, DownloadButton)
│   │   ├── pages/          # Home, History, Settings
│   │   ├── hooks/          # React Query hooks
│   │   └── index.css       # 60:30:10 Design system
│   └── package.json
├── server/                 # Express API Server & SQLite Job Queue
│   ├── routes/             # API routes
│   ├── services/           # yt-dlp & FFmpeg integration services
│   ├── workers/            # Multi-threaded download workers
│   └── storage/            # Downloads & temporary fragment storage
├── docker-compose.yml      # Container orchestration configuration
├── netlify.toml            # Frontend deployment configuration
└── package.json            # Root task runner scripts
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: `v18+`
- **yt-dlp**: Installed and on system `PATH`
- **FFmpeg**: Installed and on system `PATH`

### 2. Installation & Run
```bash
# Clone the repository
git clone <repo-url>
cd Universal-Media-Downloader

# Install dependencies for root, client, and server
npm run install:all

# Configure environment variables
cp .env.example .env

# Run development server (Frontend + Backend concurrently)
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🐳 Docker Deployment

```bash
# Build and launch all containers
docker compose up -d

# Stop services
docker compose down
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Extract metadata & format options from media URL |
| `POST` | `/api/download` | Queue a media download job |
| `GET` | `/api/job/:id` | Check progress & download status of job |
| `DELETE` | `/api/cancel/:id` | Cancel an active download job |
| `GET` | `/api/history` | Retrieve local download log history |
| `DELETE` | `/api/history/:id` | Delete specific history log |

---

## 📄 License
MIT License. Created for legal personal media archiving.
