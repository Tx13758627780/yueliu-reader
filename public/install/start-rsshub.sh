#!/usr/bin/env bash
set -euo pipefail
command -v docker >/dev/null || { echo 'Install and start Docker, then run this script again.'; exit 1; }
docker info --format '{{.ServerVersion}}'
if existing=$(docker inspect --format '{{index .Config.Labels "app.yueliu.managed"}}' yueliu-rsshub 2>/dev/null); then
  [ "$existing" = true ] || { echo 'An unmanaged container uses this name.'; exit 1; }
  docker start yueliu-rsshub
else
  docker run -d --name yueliu-rsshub --label app.yueliu.managed=true --restart unless-stopped -p 127.0.0.1:1200:1200 -e CACHE_EXPIRE=3600 diygod/rsshub:chromium-bundled
fi
printf '%s\n' 'RSSHub is starting at http://127.0.0.1:1200'
