# Restore Main App Script
# Run this to switch back to the main application

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Restoring Main Application" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup admin index
if (Test-Path "src\index.js") {
    Write-Host "Backing up admin index.js..." -ForegroundColor Yellow
    Copy-Item "src\index.js" "src\admin-index.js" -Force
    Remove-Item "src\index.js"
}

# Step 2: Restore main index
if (Test-Path "src\index-main.js.backup") {
    Write-Host "Restoring main index.js..." -ForegroundColor Yellow
    Copy-Item "src\index-main.js.backup" "src\index.js"
    Write-Host "✓ Main application restored" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Main index backup not found" -ForegroundColor Yellow
    Write-Host "You may need to manually restore your index.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Restoration Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run admin dashboard again:" -ForegroundColor Cyan
Write-Host "  .\setup-admin.ps1" -ForegroundColor White
Write-Host ""
