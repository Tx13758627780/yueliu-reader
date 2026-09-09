$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install and start Docker Desktop, then run this script again.' }
docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Please start Docker Desktop.' }
$existing = docker inspect --format '{{index .Config.Labels "app.yueliu.managed"}}' yueliu-rsshub 2>$null
if ($LASTEXITCODE -eq 0) {
  if ($existing.Trim() -ne 'true') { throw 'An unmanaged container already uses the name yueliu-rsshub.' }
  docker start yueliu-rsshub
} else {
  docker run -d --name yueliu-rsshub --label app.yueliu.managed=true --restart unless-stopped -p 127.0.0.1:1200:1200 -e CACHE_EXPIRE=3600 diygod/rsshub:chromium-bundled
}
if ($LASTEXITCODE -ne 0) { throw 'RSSHub could not start. Please check Docker output above.' }
Write-Host 'RSSHub is starting at http://127.0.0.1:1200. Use this address in the Yueliu desktop app.'
