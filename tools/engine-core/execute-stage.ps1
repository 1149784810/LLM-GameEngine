param(
    [string]$ProjectId = "",
    [string]$StageId = "",
    [string]$PhaseId = "",
    [switch]$SkipPreflight,
    [switch]$SkipPostAudit
)

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\execute-stage.ps1 -ProjectId <project-id> -StageId <stage-id> -PhaseId <phase-id>" -ForegroundColor Yellow
    exit 1
}

if ($StageId -eq "") {
    Write-Host "Error: StageId is required" -ForegroundColor Red
    Write-Host "Usage: .\execute-stage.ps1 -ProjectId <project-id> -StageId <stage-id> -PhaseId <phase-id>" -ForegroundColor Yellow
    exit 1
}

if ($PhaseId -eq "") {
    Write-Host "Error: PhaseId is required" -ForegroundColor Red
    Write-Host "Usage: .\execute-stage.ps1 -ProjectId <project-id> -StageId <stage-id> -PhaseId <phase-id>" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Error($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

$scriptPath = $PSScriptRoot
$preflightScript = Join-Path $scriptPath "preflight-check.ps1"
$postAuditScript = Join-Path $scriptPath "post-execution-audit.ps1"
$rollbackScript = Join-Path $scriptPath "rollback-trigger.ps1"
$engineCli = Join-Path $scriptPath "engine-cli.js"

Write-Info "========================================"
Write-Info "Execute Stage: $StageId"
Write-Info "Phase: $PhaseId"
Write-Info "Project: $ProjectId"
Write-Info "========================================"
Write-Host ""

# Step 1: Preflight Check
if (-not $SkipPreflight) {
    Write-Warn "[Step 1/5] Preflight check..."
    
    try {
        & $preflightScript -ProjectId $ProjectId -StageId $StageId
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Preflight check failed, triggering rollback..."
            & $rollbackScript -ProjectId $ProjectId -Reason "Preflight check failed: $StageId"
            exit 1
        }
    } catch {
        Write-Error "Preflight check error: $($_.Exception.Message)"
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Warn "[Step 1/5] Skipping preflight check"
    Write-Host ""
}

# Step 2: Save Checkpoint
Write-Warn "[Step 2/5] Saving checkpoint..."

try {
    $checkpointResult = & node $engineCli $ProjectId SAVE_CHECKPOINT | ConvertFrom-Json
    
    if ($checkpointResult.success) {
        Write-Success "Checkpoint saved: $($checkpointResult.data.checkpointId)"
    } else {
        Write-Error "Failed to save checkpoint: $($checkpointResult.message)"
        exit 1
    }
} catch {
    Write-Error "Checkpoint error: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Step 3: Update State
Write-Warn "[Step 3/5] Updating state..."

try {
    $updateResult = & node $engineCli $ProjectId UPDATE_STATE `
        --currentPhase "$PhaseId" `
        --currentStage "$StageId" | ConvertFrom-Json
    
    if ($updateResult.success) {
        Write-Success "State updated: $PhaseId - $StageId"
    } else {
        Write-Error "Failed to update state: $($updateResult.message)"
        exit 1
    }
} catch {
    Write-Error "State update error: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Step 4: Work Execution Hint
Write-Warn "[Step 4/5] Execute stage work..."
Write-Info "========================================"
Write-Info "AI agent can now execute $StageId work"
Write-Warn "Important reminders:"
Write-Warn "  1. All tool calls must be recorded via engine"
Write-Warn "  2. Artifacts must be registered to engine"
Write-Warn "  3. Call this script again after completion"
Write-Info "========================================"
Write-Host ""
Write-Success "Stage work execution marker complete"
Write-Host ""

# Step 5: Post-Execution Audit
if (-not $SkipPostAudit) {
    Write-Warn "[Step 5/5] Post-execution audit..."
    
    try {
        & $postAuditScript -ProjectId $ProjectId -StageId $StageId
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Post-execution audit failed"
            exit 1
        }
    } catch {
        Write-Error "Audit error: $($_.Exception.Message)"
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Warn "[Step 5/5] Skipping post-audit"
    Write-Host ""
}

# Complete
Write-Success "========================================"
Write-Success "Stage $StageId execution complete!"
Write-Success "========================================"

exit 0
