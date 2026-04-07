FROM node:20-slim

# Install yt-dlp, FFmpeg, and Python3 (required by yt-dlp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      ffmpeg \
      curl \
      ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit

# Copy server source
COPY . .

# Create storage directories
RUN mkdir -p storage/downloads storage/temp

EXPOSE 5000

CMD ["node", "server.js"]
