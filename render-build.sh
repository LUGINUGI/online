#!/usr/bin/env bash

# Update and install required dependencies
apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libnss3 \
    libx11-xcb1 \
    libxss1 \
    libgbm-dev \
    libgtk-3-0 \
    libpango-1.0-0 \
    xdg-utils

# Set Puppeteer's cache directory to a persistent location and ensure Chromium download
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
export PUPPETEER_SKIP_DOWNLOAD=false

# Install dependencies
npm install

# Force Puppeteer to install the correct version of Chromium
npx puppeteer install
