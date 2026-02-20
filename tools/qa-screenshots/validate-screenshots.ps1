#Requires -Version 5.1
<#
.SYNOPSIS
    Screenshot Validation Script - Validate test screenshots for QA

.DESCRIPTION
    This script validates screenshots for visual testing:
    1. Check if screenshot exists
    2. Validate file format
    3. Check file size
    4. Compare with baseline (if exists)

.EXAMPLE
    .\validate-screenshots.ps1 -ScreenshotPath "path/to/screenshot.png"
    .\validate-screenshots.ps1 -ProjectName "mario-game" -TestType "FT"
#>

param(
    [string]$ScreenshotPath = "",
    [string]$ProjectName = "",
    [string]$TestType = "",
    [switch]$CompareBaseline,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

function Write-ValidationResult {
    param(
        [string]$Check,
        [string]$Status,
        [string]$Message = ""
    )
    
    $icon = switch ($Status) {
        "PASS" { "[PASS]" }
        "FAIL" { "[FAIL]" }
        "WARN" { "[WARN]" }
        default { "[????]" }
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "$icon $Check" -ForegroundColor $color
    if ($Message) {
        Write-Host "    $Message" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Screenshot Validation" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Find screenshots to validate
$screenshots = @()

if ($ScreenshotPath -and (Test-Path $ScreenshotPath)) {
    $screenshots += Get-Item $ScreenshotPath
} elseif ($ProjectName) {
    $projectPath = Join-Path $RootDir "projects\$ProjectName"
    if (Test-Path $projectPath) {
        $screenshots = Get-ChildItem -Path $projectPath -Filter "*.png" -Recurse
        $screenshots += Get-ChildItem -Path $projectPath -Filter "*.jpg" -Recurse
    }
} else {
    # Search all projects
    $projectsPath = Join-Path $RootDir "projects"
    if (Test-Path $projectsPath) {
        $screenshots = Get-ChildItem -Path $projectsPath -Filter "*.png" -Recurse -ErrorAction SilentlyContinue
        $screenshots += Get-ChildItem -Path $projectsPath -Filter "*.jpg" -Recurse -ErrorAction SilentlyContinue
    }
}

if ($screenshots.Count -eq 0) {
    Write-Host "No screenshots found to validate." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($screenshots.Count) screenshot(s) to validate" -ForegroundColor Cyan
Write-Host ""

$validCount = 0
$invalidCount = 0

foreach ($screenshot in $screenshots) {
    Write-Host "Validating: $($screenshot.Name)" -ForegroundColor White
    
    # Check 1: File exists
    Write-ValidationResult "File Exists" "PASS"
    
    # Check 2: File format
    $extension = $screenshot.Extension.ToLower()
    if ($extension -in @(".png", ".jpg", ".jpeg")) {
        Write-ValidationResult "File Format" "PASS" "Format: $extension"
    } else {
        Write-ValidationResult "File Format" "FAIL" "Unsupported format: $extension"
        $invalidCount++
        continue
    }
    
    # Check 3: File size
    $sizeKB = [math]::Round($screenshot.Length / 1KB, 2)
    if ($screenshot.Length -gt 0) {
        if ($sizeKB -gt 10000) {
            Write-ValidationResult "File Size" "WARN" "Large file: ${sizeKB}KB"
        } else {
            Write-ValidationResult "File Size" "PASS" "Size: ${sizeKB}KB"
        }
    } else {
        Write-ValidationResult "File Size" "FAIL" "Empty file"
        $invalidCount++
        continue
    }
    
    # Check 4: Naming convention
    $namePattern = "^[A-Z]+-[A-Z0-9-]+-v\d+\.\d+-\d{8}(-screenshot)?\.png$"
    if ($screenshot.Name -match $namePattern -or $screenshot.Name -match "screenshot") {
        Write-ValidationResult "Naming" "PASS"
    } else {
        Write-ValidationResult "Naming" "WARN" "Consider using standard naming"
    }
    
    # Check 5: Baseline comparison (if enabled)
    if ($CompareBaseline) {
        $baselinePath = Join-Path $screenshot.DirectoryName "baseline_$($screenshot.Name)"
        if (Test-Path $baselinePath) {
            Write-ValidationResult "Baseline" "PASS" "Baseline exists for comparison"
        } else {
            Write-ValidationResult "Baseline" "WARN" "No baseline found"
        }
    }
    
    $validCount++
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Validation Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "Total Screenshots: $($screenshots.Count)" -ForegroundColor White
Write-Host "Valid:             $validCount" -ForegroundColor Green
Write-Host "Invalid:           $invalidCount" -ForegroundColor Red
Write-Host ""

if ($invalidCount -gt 0) {
    Write-Host "Some screenshots failed validation!" -ForegroundColor Red
    exit 1
}

Write-Host "All screenshots passed validation!" -ForegroundColor Green
exit 0
