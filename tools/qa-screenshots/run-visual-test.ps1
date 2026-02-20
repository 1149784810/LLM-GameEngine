<#
.SYNOPSIS
    Clicker Quest Automated Visual Test
.DESCRIPTION
    Automated visual testing based on functional path specification
#>

param(
    [string]$OutputDir = "E:\全栈游戏开发引擎\screenshots\clicker-quest-test"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create output directory
$OutputDir = "E:\全栈游戏开发引擎\screenshots\clicker-quest-test"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created directory: $OutputDir"
}

function Take-Screenshot {
    param([string]$FileName)
    
    $filePath = Join-Path $OutputDir "$FileName.png"
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bounds = $screen.Bounds
    
    $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "  Screenshot saved: $FileName.png"
    return $filePath
}

function Click-AtPosition {
    param([int]$X, [int]$Y)
    
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
    Start-Sleep -Milliseconds 100
    
    Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint info, uint extraInfo);' -Name U32 -Namespace W -ErrorAction SilentlyContinue
    [W.U32]::mouse_event(0x02, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [W.U32]::mouse_event(0x04, 0, 0, 0, 0)
    
    Start-Sleep -Milliseconds 300
}

# Main test flow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clicker Quest Visual Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$testResults = @()

# Step 1: Open browser with game
Write-Host "`n[Step 1] Opening browser with game..." -ForegroundColor Yellow

$gameUrl = "http://localhost:8080/"
Start-Process "msedge" $gameUrl
Start-Sleep -Seconds 4

# Step 2: Screenshot main screen
Write-Host "`n[Step 2] Testing Main Screen..." -ForegroundColor Yellow
Take-Screenshot -FileName "01-main-screen"
$testResults += @{Step="Main Screen"; Status="Captured"}

# Step 3: Test click button
Write-Host "`n[Step 3] Testing Click Button..." -ForegroundColor Yellow

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$centerX = [int]($screen.Bounds.Width / 2)
$centerY = [int]($screen.Bounds.Height / 2)

Click-AtPosition -X $centerX -Y $centerY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "02-click-action"
$testResults += @{Step="Click Action"; Status="Captured"}

# Multiple clicks for combo test
1..3 | ForEach-Object {
    Click-AtPosition -X $centerX -Y $centerY
    Start-Sleep -Milliseconds 200
}
Take-Screenshot -FileName "03-combo-test"
$testResults += @{Step="Combo Test"; Status="Captured"}

# Step 4: Test shop button
Write-Host "`n[Step 4] Testing Shop Screen..." -ForegroundColor Yellow

$navY = [int]($screen.Bounds.Height - 60)
$shopX = [int]($screen.Bounds.Width / 4)

Click-AtPosition -X $shopX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "04-shop-screen"
$testResults += @{Step="Shop Screen"; Status="Captured"}

# Test shop category tabs
$tabY = [int]($screen.Bounds.Height * 0.25)
$tab2X = [int]($screen.Bounds.Width * 0.4)
Click-AtPosition -X $tab2X -Y $tabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "05-shop-category-click"
$testResults += @{Step="Shop Category"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 5: Test items button
Write-Host "`n[Step 5] Testing Items Screen..." -ForegroundColor Yellow

$itemsX = [int]($screen.Bounds.Width / 2)
Click-AtPosition -X $itemsX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "06-items-screen"
$testResults += @{Step="Items Screen"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 6: Test achievements button
Write-Host "`n[Step 6] Testing Achievements Screen..." -ForegroundColor Yellow

$achieveX = [int]($screen.Bounds.Width * 3 / 4)
Click-AtPosition -X $achieveX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "07-achievements-screen"
$testResults += @{Step="Achievements Screen"; Status="Captured"}

# Test achievements category tabs
$achieveTabY = [int]($screen.Bounds.Height * 0.2)
$achieveTab2X = [int]($screen.Bounds.Width * 0.35)
Click-AtPosition -X $achieveTab2X -Y $achieveTabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "08-achievements-category"
$testResults += @{Step="Achievements Category"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 7: Test settings button
Write-Host "`n[Step 7] Testing Settings Screen..." -ForegroundColor Yellow

$settingsX = [int]($screen.Bounds.Width - 50)
$settingsY = 50
Click-AtPosition -X $settingsX -Y $settingsY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "09-settings-screen"
$testResults += @{Step="Settings Screen"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 8: Final main screen
Write-Host "`n[Step 8] Final Main Screen..." -ForegroundColor Yellow
Take-Screenshot -FileName "10-final-main-screen"
$testResults += @{Step="Final Main Screen"; Status="Captured"}

# Output results
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Visual Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nScreenshots saved to: $OutputDir" -ForegroundColor White
Write-Host "`nTest Steps Completed:" -ForegroundColor White
$testResults | ForEach-Object {
    Write-Host "  - $($_.Step): $($_.Status)" -ForegroundColor Green
}

# Close browser
Write-Host "`nClosing browser..." -ForegroundColor Yellow
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue

Write-Host "`nDone!" -ForegroundColor Green

# Return path for further processing
return $OutputDir
