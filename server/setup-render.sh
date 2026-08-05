#!/usr/bin/env bash
# setup-render.sh (Server-only version)
# Build script for Render.com when Root Directory is set to 'server'

set -e

echo "Starting server build process..."

# Install server dependencies
echo "Installing dependencies..."
npm install

# Setup binaries directory
mkdir -p bin

# Download latest yt-dlp for Linux (standalone binary)
echo "Downloading yt-dlp for Linux..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp
chmod a+rx bin/yt-dlp

# Download ffmpeg static build for Linux
echo "Downloading ffmpeg for Linux..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg bin/ffmpeg
chmod a+rx bin/ffmpeg

# Cleanup
echo "Cleaning up temp files..."
rm -rf ffmpeg.tar.xz ffmpeg-*-amd64-static

echo "Server build complete! Ready for deployment."
