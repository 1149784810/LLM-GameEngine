param(
    [Parameter(Mandatory=$true)]
    [string]$WindowTitle,
    
    [string]$ApplicationPath = "",
    
    [string]$ProcessName = "",
    
    [string]$ValidationName = ""
)

# Get script and workspace paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspacePath = Split-Path -Parent $scriptPath
$screenshotsPath = Join-Path $workspacePath "screenshots"

Write-Host "========================================"
Write-Host "    Screenshot Validation Workflow"
Write-Host "========================================"
Write-Host ""

# Step 1: Bring window to front
Write-Host "Step 1: Bringing window to front..."
$bringToFrontScript = Join-Path $scriptPath "bring_window_to_front.ps1"

$bringParams = @{
    WindowTitle = $WindowTitle
}
if ($ApplicationPath) { $bringParams['ApplicationPath'] = $ApplicationPath }
if ($ProcessName) { $bringParams['ProcessName'] = $ProcessName }

try {
    & $bringToFrontScript @bringParams
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to bring window to front"
        exit 1
    }
}
catch {
    Write-Host "Error in step 1: $_"
    exit 1
}

Write-Host ""

# Step 2: Wait for window to stabilize
Write-Host "Step 2: Waiting for window to stabilize..."
Start-Sleep -Seconds 2

# Step 3: Take screenshot
Write-Host "Step 3: Taking screenshot..."
$screenshotScript = Join-Path $scriptPath "take_screenshot.ps1"

# Generate filename
if ([string]::IsNullOrEmpty($ValidationName)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $fileName = "validation_$timestamp"
} else {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $fileName = "${ValidationName}_$timestamp"
}

try {
    $screenshotPath = & $screenshotScript -FileName $fileName
    if (-not $screenshotPath) {
        Write-Host "Failed to take screenshot"
        exit 1
    }
}
catch {
    Write-Host "Error in step 3: $_"
    exit 1
}

Write-Host ""

# Step 4: Show results
Write-Host "Step 4: Validation complete!"
Write-Host ""
Write-Host "Screenshot saved to:"
Write-Host "  $screenshotPath"
Write-Host ""
Write-Host "Screenshots directory structure:"
Write-Host "  $screenshotsPath"
Write-Host "    ├── raw/         - Original screenshots"
Write-Host "    ├── annotated/   - Annotated screenshots"
Write-Host "    └── reports/     - Validation reports"
Write-Host ""

# Return screenshot path
return $screenshotPath
