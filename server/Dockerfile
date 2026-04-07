FROM node:20-slim

# Install system dependencies including build tools for native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      ffmpeg \
      curl \
      ca-certificates \
      build-essential \
      python3-dev && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit

# Rebuild native modules for the container's architecture
RUN npm rebuild better-sqlite3 --build-from-source

# Copy server source
COPY . .

# Create storage directories
RUN mkdir -p storage/downloads storage/temp

EXPOSE 5000

CMD ["node", "server.js"]
