#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
pkg install -y nodejs-lts git
READER_RSSHUB_DIR="$HOME/yueliu-rsshub"
if [ ! -d "$READER_RSSHUB_DIR" ]; then git clone --depth 1 https://github.com/DIYgod/RSSHub.git "$READER_RSSHUB_DIR"; fi
cd "$READER_RSSHUB_DIR"
export PUPPETEER_SKIP_DOWNLOAD=true
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PORT=1200
export LISTEN_INADDR=127.0.0.1
npm ci
npm run build
printf '%s\n' 'RSSHub: http://127.0.0.1:1200 — keep Termux running. Browser-dependent routes need an external browser service.'
npm start
