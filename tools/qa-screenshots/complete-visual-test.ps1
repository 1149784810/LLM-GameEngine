<#
.SYNOPSIS
    Clicker Quest Complete Automated Visual Test
.DESCRIPTION
    Full automated visual testing with server check and fallback
#>

param(
    [string]$ProjectPath = "E:\全栈游戏开发引擎\projects\Clicker Quest",
    [string]$OutputDir = "E:\全栈游戏开发引擎\projects\Clicker Quest\docs\visual-test"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create output directory
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
Write-Host "========================================"
Write-Host "Clicker Quest Visual Test"
Write-Host "========================================"

$testResults = @()

# Step 0: Check and start server
Write-Host "`n[Step 0] Checking game server..."

$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "  Server is already running"
    }
}
catch {
    Write-Host "  Server not running, starting..."
}

if (-not $serverRunning) {
    # Start Python HTTP server
    $serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8080" -WorkingDirectory $ProjectPath -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    # Verify server started
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "  Server started successfully"
        }
    }
    catch {
        Write-Host "  Server failed to start, will use direct file access"
    }
}

# Step 1: Open game
Write-Host "`n[Step 1] Opening game..."

$gameOpened = $false

if ($serverRunning) {
    # Try browser first
    Write-Host "  Opening in browser..."
    $gameUrl = "http://localhost:8080/"
    Start-Process "msedge" $gameUrl
    Start-Sleep -Seconds 4
    
    # Check if browser opened the page
    try {
        $browserCheck = Get-Process msedge -ErrorAction SilentlyContinue
        if ($browserCheck) {
            $gameOpened = $true
            Write-Host "  Game opened in browser"
        }
    }
    catch {}
}

if (-not $gameOpened) {
    # Fallback: Open index.html directly
    Write-Host "  Opening index.html directly..."
    $indexPath = Join-Path $ProjectPath "index.html"
    if (Test-Path $indexPath) {
        Start-Process $indexPath
        Start-Sleep -Seconds 4
        $gameOpened = $true
        Write-Host "  Game opened via index.html"
    }
    else {
        Write-Host "  ERROR: index.html not found at $indexPath"
        exit 1
    }
}

# Step 2: Screenshot main screen
Write-Host "`n[Step 2] Testing Main Screen..."
Take-Screenshot -FileName "01-main-screen"
$testResults += @{Step="Main Screen"; Status="Captured"}

# Step 3: Test click button
Write-Host "`n[Step 3] Testing Click Button..."

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$centerX = [int]($screen.Bounds.Width / 2)
$centerY = [int]($screen.Bounds.Height / 2)

Click-AtPosition -X $centerX -Y $centerY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "02-click-action"
$testResults += @{Step="Click Action"; Status="Captured"}

# Multiple clicks for combo test
1..5 | ForEach-Object {
    Click-AtPosition -X $centerX -Y $centerY
    Start-Sleep -Milliseconds 150
}
Take-Screenshot -FileName "03-combo-test"
$testResults += @{Step="Combo Test"; Status="Captured"}

# Step 4: Test shop button
Write-Host "`n[Step 4] Testing Shop Screen..."

$navY = [int]($screen.Bounds.Height - 80)
$shopX = [int]($screen.Bounds.Width * 0.25)

Click-AtPosition -X $shopX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "04-shop-screen"
$testResults += @{Step="Shop Screen"; Status="Captured"}

# Test shop category tabs
$tabY = [int]($screen.Bounds.Height * 0.22)
$tab2X = [int]($screen.Bounds.Width * 0.45)
Click-AtPosition -X $tab2X -Y $tabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "05-shop-category-click"
$testResults += @{Step="Shop Category"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 5: Test items button
Write-Host "`n[Step 5] Testing Items Screen..."

$itemsX = [int]($screen.Bounds.Width * 0.5)
Click-AtPosition -X $itemsX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "06-items-screen"
$testResults += @{Step="Items Screen"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 6: Test achievements button
Write-Host "`n[Step 6] Testing Achievements Screen..."

$achieveX = [int]($screen.Bounds.Width * 0.75)
Click-AtPosition -X $achieveX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "07-achievements-screen"
$testResults += @{Step="Achievements Screen"; Status="Captured"}

# Test achievements category tabs
$achieveTabY = [int]($screen.Bounds.Height * 0.18)
$achieveTab2X = [int]($screen.Bounds.Width * 0.35)
Click-AtPosition -X $achieveTab2X -Y $achieveTabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "08-achievements-category"
$testResults += @{Step="Achievements Category"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 7: Test settings button
Write-Host "`n[Step 7] Testing Settings Screen..."

$settingsX = [int]($screen.Bounds.Width - 60)
$settingsY = 60
Click-AtPosition -X $settingsX -Y $settingsY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "09-settings-screen"
$testResults += @{Step="Settings Screen"; Status="Captured"}

# Return to main
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 8: Final main screen
Write-Host "`n[Step 8] Final Main Screen..."
Take-Screenshot -FileName "10-final-main-screen"
$testResults += @{Step="Final Main Screen"; Status="Captured"}

# Output results
Write-Host "`n========================================"
Write-Host "Visual Test Complete!"
Write-Host "========================================"
Write-Host "`nScreenshots saved to: $OutputDir"
Write-Host "`nTest Steps Completed:"
$testResults | ForEach-Object {
    Write-Host "  - $($_.Step): $($_.Status)"
}

# Close browser
Write-Host "`nClosing browser..."
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue

Write-Host "`nDone!"
Write-Host "`nScreenshot files:"
Get-ChildItem -Path $OutputDir -Filter "*.png" | ForEach-Object { Write-Host "  $($_.Name)" }

return $OutputDir
