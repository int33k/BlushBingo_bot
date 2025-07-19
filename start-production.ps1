# Production Start Script for Unified Backend + Frontend
# 1. Build frontend
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Set-Location ..
# 2. Build backend
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# 3. Start backend with frontend serving enabled
$env:SERVE_FRONTEND = "true"
npm start
