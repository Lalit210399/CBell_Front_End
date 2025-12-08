# Admin Dashboard - Quick Setup Script
# Run this script to set up and start the admin dashboard

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Admin Dashboard Quick Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Step 2: Install required packages
Write-Host ""
Write-Host "Installing admin dashboard dependencies..." -ForegroundColor Yellow
npm install zustand sonner react-hook-form

# Step 3: Backup current index.js
Write-Host ""
Write-Host "Setting up admin dashboard..." -ForegroundColor Yellow

if (Test-Path "src\index.js") {
    if (-not (Test-Path "src\index-main.js.backup")) {
        Write-Host "Backing up main index.js..." -ForegroundColor Yellow
        Copy-Item "src\index.js" "src\index-main.js.backup"
    }
    Remove-Item "src\index.js"
}

# Step 4: Set admin-index as main entry
Copy-Item "src\admin-index.js" "src\index.js"
Write-Host "✓ Admin dashboard configured" -ForegroundColor Green

# Step 5: Display instructions
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Dashboard will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/login" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints Required:" -ForegroundColor Cyan
Write-Host "  Auth API: http://localhost:5001/api" -ForegroundColor White
Write-Host "  Content API: http://localhost:5002/api" -ForegroundColor White
Write-Host ""
Write-Host "To restore main app, run:" -ForegroundColor Cyan
Write-Host "  .\restore-main-app.ps1" -ForegroundColor White
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Start development server
npm start
