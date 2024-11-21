#!/usr/bin/env bash

# Update and install required dependencies including Chromium
apt-get update && apt-get install -y \
    chromium-browser \
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

# Install Node dependencies
npm install
