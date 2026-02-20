param([string]$ProjectId = "")

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\stop-engine.ps1 -ProjectId <project-id>" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

Write-Info "========================================"
Write-Info "Stop Fullstack Game Engine"
Write-Info "Project: $ProjectId"
Write-Info "========================================"
Write-Host ""

$basePath = Join-Path (Get-Location) "projects"
$projectPath = Join-Path $basePath $ProjectId
$enginePath = Join-Path $projectPath ".engine"
$pidFile = Join-Path $enginePath "engine.pid"
$portFile = Join-Path $enginePath "engine.port"

if (-not (Test-Path $pidFile)) {
    Write-Warn "[WARNING] PID file not found, engine may not be running"
    
    if (Test-Path $portFile) {
        Remove-Item $portFile -Force -ErrorAction SilentlyContinue
        Write-Success "[OK] Cleaned up port file"
    }
    
    exit 0
}

$enginePid = Get-Content $pidFile -Raw

try {
    $process = Get-Process -Id $enginePid -ErrorAction Stop
    Write-Success "[OK] Found engine process (PID: $enginePid)"
    
    Write-Info "Stopping engine process..."
    
    $process.CloseMainWindow() | Out-Null
    
    $timeout = 10
    $elapsed = 0
    
    while ((-not $process.HasExited) -and ($elapsed -lt $timeout)) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (-not $process.HasExited) {
        Write-Warn "Force killing process..."
        Stop-Process -Id $enginePid -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "[OK] Engine process stopped"
    
} catch {
    Write-Warn "[WARNING] Process not found (PID: $enginePid)"
}

Write-Info "Cleaning up resource files..."

if (Test-Path $pidFile) {
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    Write-Success "[OK] Cleaned up PID file"
}

if (Test-Path $portFile) {
    Remove-Item $portFile -Force -ErrorAction SilentlyContinue
    Write-Success "[OK] Cleaned up port file"
}

Write-Success "========================================"
Write-Success "Engine stopped successfully"
Write-Success "========================================"

exit 0
