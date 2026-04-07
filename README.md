# Universal Media Downloader & Converter

A full-stack web application for downloading and converting publicly accessible media from YouTube, Instagram, Facebook, X (Twitter), TikTok, and direct URLs.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## ✨ Features

- **Multi-platform support** — YouTube, Instagram, Facebook, X, TikTok, and direct URLs
- **Format selection** — MP4 (1080p / 720p / 480p), WebM, MP3 audio extraction
- **Job queue** — In-memory background downloads with real-time progress tracking (no Redis required)
- **Download history** — Browse and re-download past media
- **3D interactive background** — React Three Fiber wireframe sphere with particle field
- **Glassmorphism UI** — Dark-themed design with blur effects and micro-animations
- **Responsive** — Mobile-first layout with hamburger drawer navigation
- **Settings** — Default format, auto-delete, toggle 3D background

## 🏗 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  React SPA  │────▶│  Express API │────▶│  SQLite   │
│  (Vite)     │     │  (Node.js)   │     └───────────┘
└─────────────┘     │              │     

                    │  In-Memory   │
                    │  Queue       │
                    │              │
                    │  yt-dlp      │
                    │  FFmpeg      │
                    └──────────────┘
```

| Layer     | Tech                                                      |
|-----------|-----------------------------------------------------------|
| Frontend  | React 19, Vite 7, TailwindCSS 4, Framer Motion, R3F      |
| Backend   | Node.js, Express, In-Memory Queue, SQLite        |
| Tools     | yt-dlp (media fetch), FFmpeg (format conversion)          |
| Infra     | Docker Compose, Nginx (production reverse proxy)          |

## 📋 Prerequisites

| Requirement  | Version  | Notes                                |
|-------------|----------|--------------------------------------|
| Node.js     | ≥ 18     | For client and server                |
| yt-dlp      | latest   | Must be on PATH                      |
| FFmpeg      | latest   | Must be on PATH                      |
| SQLite      | Built-in | Auto-creates database file           |

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone and install
git clone <repo-url>
cd "Universal Media Downloader & Converter"
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env if you wish to change port or paths


# 4. Run in development mode
npm run dev
# → Client: http://localhost:5173
# → Server: http://localhost:5000
```

## 🐳 Docker Setup

```bash
# Build and start all services
docker compose up -d

# App available at http://localhost
# API available at http://localhost:5000

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 📡 API Reference

| Method | Endpoint                 | Description                       |
|--------|--------------------------|-----------------------------------|
| POST   | `/api/analyze`           | Analyze a URL and return metadata |
| POST   | `/api/download`          | Queue a download job              |
| GET    | `/api/job/:jobId`        | Get job status and progress       |
| GET    | `/api/history`           | Get download history (last 50)    |
| GET    | `/api/download-file/:id` | Download a completed file         |
| GET    | `/health`                | Health check                      |

### POST `/api/analyze`

```json
// Request
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }

// Response
{
  "success": true,
  "data": {
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": "3:32",
    "platform": "youtube",
    "author": "Channel Name",
    "formats": [
      { "formatId": "137", "ext": "mp4", "resolution": "1080p", "height": 1080, "type": "video" },
      { "formatId": "audio", "ext": "mp3", "resolution": "audio", "height": 0, "type": "audio" }
    ]
  }
}
```

### POST `/api/download`

```json
// Request
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "format": "mp4",
  "quality": "720p",
  "title": "Video Title",
  "thumbnail": "https://...",
  "platform": "youtube"
}

// Response
{ "success": true, "data": { "jobId": "uuid", "status": "queued" } }
```

## 🔧 Environment Variables

| Variable                  | Default                                      | Description                |
|---------------------------|----------------------------------------------|----------------------------|
| `NODE_ENV`                | `development`                                | Environment mode           |
| `PORT`                    | `5000`                                       | Server port                |
| `DATABASE_URL`            | `sqlite://./storage/database.sqlite` | Database URL     |
| `STORAGE_PATH`            | `./storage/downloads`                        | Download file storage      |
| `TEMP_PATH`               | `./storage/temp`                             | Temporary file storage     |
| `RATE_LIMIT_WINDOW_MS`    | `900000`                                     | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                                        | Max requests per window    |
| `MAX_FILE_SIZE_MB`        | `2048`                                       | Max download size          |
| `MAX_CONCURRENT_DOWNLOADS`| `3`                                          | Concurrent worker jobs     |
| `FILE_RETENTION_HOURS`    | `24`                                         | Auto-delete after hours    |

## ⚠️ Disclaimer

This tool is intended for downloading publicly accessible, non-DRM-protected media. Users are solely responsible for ensuring they have the legal right to download any content. This application does not bypass any digital rights management protections.

## 📄 License

MIT
