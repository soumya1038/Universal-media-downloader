CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  platform TEXT,
  author TEXT,
  duration TEXT,
  format TEXT NOT NULL DEFAULT 'mp4',
  quality TEXT NOT NULL DEFAULT '720p',
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  file_path TEXT,
  file_size INTEGER,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
