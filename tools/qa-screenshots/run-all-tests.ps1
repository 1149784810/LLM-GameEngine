#Requires -Version 5.1
<#
.SYNOPSIS
    Automated Test Runner - Run all tests for the game engine

.DESCRIPTION
    This script runs all automated tests including:
    1. Skill dependency check
    2. File structure validation
    3. Document naming convention check
    4. Configuration validation

.EXAMPLE
    .\run-all-tests.ps1
    .\run-all-tests.ps1 -Verbose
    .\run-all-tests.ps1 -TestType "dependency"
#>

param(
    [switch]$Verbose,
    [ValidateSet("all", "dependency", "structure", "naming", "config")]
    [string]$TestType = "all",
    [string]$ProjectPath = ""
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

$TestResults = @()
$PassedTests = 0
$FailedTests = 0
$SkippedTests = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $statusIcon = switch ($Status) {
        "PASS" { "[PASS]" }
        "FAIL" { "[FAIL]" }
        "SKIP" { "[SKIP]" }
        default { "[????]" }
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] $statusIcon $TestName" -ForegroundColor $color
    if ($Message) {
        Write-Host "         $Message" -ForegroundColor Gray
    }
    
    return @{
        Name = $TestName
        Status = $Status
        Message = $Message
        Timestamp = $timestamp
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Automated Test Runner" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Test 1: Skill Dependency Check
if ($TestType -in @("all", "dependency")) {
    Write-Host "Running: Skill Dependency Tests" -ForegroundColor Cyan
    
    $depChecker = Join-Path $ScriptDir "skill-dependency-checker.ps1"
    if (Test-Path $depChecker) {
        $result = & $depChecker 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            $TestResults += Write-TestResult "Dependency Check" "PASS" "No circular dependencies or layer violations"
            $PassedTests++
        } else {
            $TestResults += Write-TestResult "Dependency Check" "FAIL" "Found dependency issues"
            $FailedTests++
        }
        
        if ($Verbose) {
            Write-Host $result -ForegroundColor Gray
        }
    } else {
        $TestResults += Write-TestResult "Dependency Check" "SKIP" "Checker script not found"
        $SkippedTests++
    }
}

# Test 2: File Structure Validation
if ($TestType -in @("all", "structure")) {
    Write-Host "Running: File Structure Tests" -ForegroundColor Cyan
    
    $requiredDirs = @(
        ".trae\skills"
        ".trae\rules"
        "tools"
        "projects"
        "output"
    )
    
    $structurePassed = $true
    foreach ($dir in $requiredDirs) {
        $fullPath = Join-Path $RootDir $dir
        if (Test-Path $fullPath) {
            if ($Verbose) {
                Write-TestResult "Directory: $dir" "PASS"
            }
        } else {
            $TestResults += Write-TestResult "Directory: $dir" "FAIL" "Required directory missing"
            $structurePassed = $false
        }
    }
    
    if ($structurePassed) {
        $TestResults += Write-TestResult "File Structure" "PASS" "All required directories exist"
        $PassedTests++
    } else {
        $TestResults += Write-TestResult "File Structure" "FAIL" "Some directories missing"
        $FailedTests++
    }
}

# Test 3: Document Naming Convention
if ($TestType -in @("all", "naming")) {
    Write-Host "Running: Naming Convention Tests" -ForegroundColor Cyan
    
    $namingPattern = "^[A-Z]+-[A-Z0-9-]+-v\d+\.\d+-\d{8}\.md$"
    $docsPath = Join-Path $RootDir "projects"
    
    $namingPassed = $true
    $invalidFiles = @()
    
    if (Test-Path $docsPath) {
        $mdFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse
        
        foreach ($file in $mdFiles) {
            $name = $file.Name
            if ($name -notmatch "README|PROJECT-INFO|FLOW-STATUS|TEAM-ALLOCATION") {
                if ($name -notmatch $namingPattern) {
                    $invalidFiles += $file.FullName
                    $namingPassed = $false
                }
            }
        }
    }
    
    if ($namingPassed) {
        $TestResults += Write-TestResult "Naming Convention" "PASS" "All documents follow naming convention"
        $PassedTests++
    } else {
        $TestResults += Write-TestResult "Naming Convention" "FAIL" "Invalid file names: $($invalidFiles.Count)"
        $FailedTests++
        
        if ($Verbose) {
            foreach ($f in $invalidFiles) {
                Write-Host "         Invalid: $f" -ForegroundColor Yellow
            }
        }
    }
}

# Test 4: Configuration Validation
if ($TestType -in @("all", "config")) {
    Write-Host "Running: Configuration Tests" -ForegroundColor Cyan
    
    $configPassed = $true
    
    # Check .gitignore
    $gitignore = Join-Path $RootDir ".gitignore"
    if (Test-Path $gitignore) {
        $TestResults += Write-TestResult "Git Ignore" "PASS"
    } else {
        $TestResults += Write-TestResult "Git Ignore" "FAIL" ".gitignore file missing"
        $configPassed = $false
    }
    
    # Check required skills
    $requiredSkills = @(
        "fullstack-game-engine"
        "terminology-standard"
        "security-guard"
        "hr-manager"
        "project-flow-manager"
        "qa-standards-manager"
    )
    
    foreach ($skill in $requiredSkills) {
        $skillPath = Join-Path $RootDir ".trae\skills\$skill\SKILL.md"
        if (Test-Path $skillPath) {
            if ($Verbose) {
                Write-TestResult "Skill: $skill" "PASS"
            }
        } else {
            $TestResults += Write-TestResult "Skill: $skill" "FAIL" "Required skill missing"
            $configPassed = $false
        }
    }
    
    if ($configPassed) {
        $TestResults += Write-TestResult "Configuration" "PASS" "All configurations valid"
        $PassedTests++
    } else {
        $TestResults += Write-TestResult "Configuration" "FAIL" "Some configurations invalid"
        $FailedTests++
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Test Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "Total Tests: $($TestResults.Count)" -ForegroundColor White
Write-Host "Passed:      $PassedTests" -ForegroundColor Green
Write-Host "Failed:      $FailedTests" -ForegroundColor Red
Write-Host "Skipped:     $SkippedTests" -ForegroundColor Yellow
Write-Host ""

if ($FailedTests -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    foreach ($result in $TestResults | Where-Object { $_.Status -eq "FAIL" }) {
        Write-Host "  - $($result.Name): $($result.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

$exitCode = if ($FailedTests -gt 0) { 1 } else { 0 }

Write-Host "Test run completed with exit code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

exit $exitCode
