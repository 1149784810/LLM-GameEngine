param(
    [string]$ProjectId = "",
    [string]$Reason = "",
    [string]$TargetCheckpoint = ""
)

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\rollback-trigger.ps1 -ProjectId <project-id> -Reason <reason> [-TargetCheckpoint <checkpoint-id>]" -ForegroundColor Yellow
    exit 1
}

if ($Reason -eq "") {
    Write-Host "Error: Reason is required" -ForegroundColor Red
    Write-Host "Usage: .\rollback-trigger.ps1 -ProjectId <project-id> -Reason <reason> [-TargetCheckpoint <checkpoint-id>]" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Error($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

Write-Warn "========================================"
Write-Warn "Triggering Rollback"
Write-Info "Project: $ProjectId"
Write-Info "Reason: $Reason"
Write-Warn "========================================"
Write-Host ""

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptRoot) {
    $scriptRoot = "."
}

$engineCliPath = Join-Path $scriptRoot "engine-cli.js"
if (-not (Test-Path $engineCliPath)) {
    Write-Error "[ERROR] Engine CLI not found: $engineCliPath"
    exit 1
}

if ($TargetCheckpoint -eq "") {
    Write-Info "No checkpoint specified, querying last checkpoint..."
    
    $stateResult = & node $engineCliPath $ProjectId GET_STATE | ConvertFrom-Json
    
    if (-not $stateResult.success) {
        Write-Error "[ERROR] Failed to get state"
        exit 1
    }
    
    $checkpoints = $stateResult.data.checkpoints
    
    if ($checkpoints.Count -eq 0) {
        Write-Error "[ERROR] No checkpoints available, cannot rollback"
        exit 1
    }
    
    $TargetCheckpoint = $checkpoints[$checkpoints.Count - 1].id
    Write-Info "Target checkpoint: $TargetCheckpoint"
}

try {
    Write-Info "Executing rollback..."
    
    $rollbackResult = & node $engineCliPath $ProjectId TRIGGER_ROLLBACK `
        --targetCheckpoint "$TargetCheckpoint" `
        --reason "$Reason" | ConvertFrom-Json
    
    if (-not $rollbackResult.success) {
        Write-Error "========================================"
        Write-Error "Rollback failed!"
        Write-Error "Error: $($rollbackResult.message)"
        Write-Error "========================================"
        exit 1
    }
    
    $data = $rollbackResult.data
    
    Write-Success "========================================"
    Write-Success "Rollback successful!"
    Write-Success "========================================"
    Write-Info "Rolled back to: $($data.rolledBackTo)"
    Write-Info "Backup ID: $($data.backupId)"
    Write-Info "Current Phase: $($data.currentPhase)"
    Write-Info "Current Stage: $($data.currentStage)"
    Write-Success "========================================"
    Write-Success "Stage can be re-executed"
    Write-Success "========================================"
    
    exit 0
    
} catch {
    Write-Error "========================================"
    Write-Error "Rollback error!"
    Write-Error "Error: $($_.Exception.Message)"
    Write-Error "========================================"
    exit 1
}
