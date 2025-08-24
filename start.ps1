# Run this in PowerShell (right-click -> Run with PowerShell) from the project folder.
Write-Host "== PoliPower setup ==" -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host ">> Created .env (edit JWT_SECRET before production)" -ForegroundColor Yellow
}
$env:NODE_OPTIONS=""
$env:NEXT_DISABLE_WEBPACK_CACHE="1"
Write-Host ">> Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
Write-Host ">> Prisma generate..." -ForegroundColor Cyan
npx prisma generate
Write-Host ">> Prisma migrate (dev)..." -ForegroundColor Cyan
npx prisma migrate dev --name init
Write-Host ">> Seeding database..." -ForegroundColor Cyan
npm run seed
Write-Host ">> Starting dev server..." -ForegroundColor Green
npm run dev
