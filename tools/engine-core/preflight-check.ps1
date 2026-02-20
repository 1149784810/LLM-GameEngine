param(
    [string]$ProjectId = "",
    [string]$StageId = ""
)

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\preflight-check.ps1 -ProjectId <project-id> -StageId <stage-id>" -ForegroundColor Yellow
    exit 1
}

if ($StageId -eq "") {
    Write-Host "Error: StageId is required" -ForegroundColor Red
    Write-Host "Usage: .\preflight-check.ps1 -ProjectId <project-id> -StageId <stage-id>" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Error($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

Write-Info "========================================"
Write-Info "Preflight Check: $StageId"
Write-Info "Project: $ProjectId"
Write-Info "========================================"
Write-Host ""

$engineCliPath = Join-Path $PSScriptRoot "engine-cli.js"
if (-not (Test-Path $engineCliPath)) {
    Write-Error "[ERROR] Engine CLI not found: $engineCliPath"
    exit 1
}

try {
    Write-Info "Validating preconditions..."
    
    $result = & node $engineCliPath $ProjectId VALIDATE_PRECONDITIONS --stageId "$StageId" | ConvertFrom-Json
    
    if (-not $result.success) {
        Write-Error "[ERROR] Validation request failed: $($result.message)"
        exit 1
    }
    
    $validation = $result.data
    
    if ($validation.passed) {
        Write-Success "========================================"
        Write-Success "Preflight check passed!"
        Write-Success "========================================"
        
        if ($validation.reason -eq 'no_preconditions_defined') {
            Write-Info "(No preconditions defined for this stage)"
        }
        
        exit 0
    } else {
        Write-Error "========================================"
        Write-Error "Preflight check failed!"
        Write-Error "========================================"
        Write-Host ""
        
        Write-Error "Failed constraints:"
        foreach ($constraint in $validation.results) {
            if (-not $constraint.passed) {
                Write-Error "  - $($constraint.constraintId) [$($constraint.type)]"
                
                if ($constraint.type -eq 'TOOL_CALLED') {
                    Write-Error "    Expected: $($constraint.expected) calls"
                    Write-Error "    Actual: $($constraint.actual) calls"
                }
                if ($constraint.type -eq 'FILE_EXISTS') {
                    Write-Error "    File not found: $($constraint.path)"
                }
                if ($constraint.type -eq 'DIRECTORY_NOT_EMPTY') {
                    if ($constraint.reason) {
                        Write-Error "    Error: $($constraint.reason)"
                    } else {
                        Write-Error "    Directory empty: $($constraint.path)"
                        Write-Error "    File count: $($constraint.fileCount)"
                    }
                }
                if ($constraint.type -eq 'ARTIFACT_VALIDATED') {
                    Write-Error "    Artifact not validated: $($constraint.path)"
                }
                Write-Host ""
            }
        }
        
        exit 1
    }
} catch {
    Write-Error "========================================"
    Write-Error "Validation error!"
    Write-Error "Error: $($_.Exception.Message)"
    Write-Error "========================================"
    exit 1
}
