param(
    [string]$ProjectId = "",
    [string]$StageId = ""
)

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\post-execution-audit.ps1 -ProjectId <project-id> -StageId <stage-id>" -ForegroundColor Yellow
    exit 1
}

if ($StageId -eq "") {
    Write-Host "Error: StageId is required" -ForegroundColor Red
    Write-Host "Usage: .\post-execution-audit.ps1 -ProjectId <project-id> -StageId <stage-id>" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Error($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

Write-Info "========================================"
Write-Info "Post-Execution Audit: $StageId"
Write-Info "Project: $ProjectId"
Write-Info "========================================"
Write-Host ""

$engineCliPath = Join-Path $PSScriptRoot "engine-cli.js"
if (-not (Test-Path $engineCliPath)) {
    Write-Error "[ERROR] Engine CLI not found: $engineCliPath"
    exit 1
}

try {
    Write-Info "Getting current state..."
    $stateResult = & node $engineCliPath $ProjectId GET_STATE | ConvertFrom-Json
    
    if (-not $stateResult.success) {
        Write-Error "[ERROR] Failed to get state: $($stateResult.message)"
        exit 1
    }
    
    $context = $stateResult.data.context
    $artifacts = @()
    foreach ($artifact in $context.artifacts) {
        if ($artifact.createdBy -eq $StageId) {
            $artifacts += $artifact
        }
    }
    
    Write-Info "Found $($artifacts.Count) artifacts to validate"
    Write-Host ""
    
    if ($artifacts.Count -eq 0) {
        Write-Warn "[WARNING] No artifacts registered for this stage"
        Write-Success "========================================"
        Write-Success "Audit complete (no artifacts)"
        Write-Success "========================================"
        exit 0
    }
    
    $allValid = $true
    $validatedCount = 0
    
    foreach ($artifact in $artifacts) {
        Write-Info "Validating: $($artifact.path)"
        
        $validation = & node $engineCliPath $ProjectId VALIDATE_ARTIFACT --path "$($artifact.path)" | ConvertFrom-Json
        
        if ($validation.success) {
            $checksumShort = $validation.data.checksum.Substring(0, 8)
            Write-Success "  [OK] Valid (checksum: $checksumShort...)"
            $validatedCount++
        } else {
            Write-Error "  [ERROR] Invalid: $($validation.message)"
            $allValid = $false
        }
    }
    
    Write-Host ""
    
    if ($allValid) {
        Write-Success "========================================"
        Write-Success "Audit result: $validatedCount / $($artifacts.Count) passed"
        Write-Success "========================================"
        exit 0
    } else {
        Write-Error "========================================"
        Write-Error "Audit result: $validatedCount / $($artifacts.Count) passed"
        Write-Error "========================================"
        exit 1
    }
    
} catch {
    Write-Error "========================================"
    Write-Error "Audit error!"
    Write-Error "Error: $($_.Exception.Message)"
    Write-Error "========================================"
    exit 1
}
