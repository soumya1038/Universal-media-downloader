#!/usr/bin/env bash
# setup-render.sh
# Build script for Render.com

set -e

echo "Starting build process..."

# Install node dependencies
echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
npm install --prefix client-2.0

echo "Building client..."
npm run build --prefix client-2.0

echo "Installing server dependencies..."
npm install --prefix server

# Setup binaries directory
mkdir -p server/bin

# Download latest yt-dlp for Linux (standalone binary)
echo "Downloading yt-dlp for Linux..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o server/bin/yt-dlp
chmod a+rx server/bin/yt-dlp

# Download ffmpeg static build for Linux
echo "Downloading ffmpeg for Linux..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg server/bin/ffmpeg
chmod a+rx server/bin/ffmpeg

# Cleanup
echo "Cleaning up temp files..."
rm -rf ffmpeg.tar.xz ffmpeg-*-amd64-static

echo "Build complete! Ready for deployment."
