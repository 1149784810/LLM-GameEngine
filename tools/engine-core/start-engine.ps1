param([string]$ProjectId = "")

if ($ProjectId -eq "") {
    Write-Host "Error: ProjectId is required" -ForegroundColor Red
    Write-Host "Usage: .\start-engine.ps1 -ProjectId <project-id>" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Error($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "[OK] Node.js version: $nodeVersion"
            return $true
        }
    } catch {
        Write-Error "[ERROR] Node.js not installed or not in PATH"
        return $false
    }
    return $false
}

Write-Info "========================================"
Write-Info "Start Fullstack Game Engine"
Write-Info "Project: $ProjectId"
Write-Info "========================================"
Write-Host ""

Write-Info "[1/4] Checking Node.js..."
if (-not (Test-NodeJS)) {
    exit 1
}

Write-Info "[2/4] Checking engine core files..."
$engineCorePath = Join-Path $PSScriptRoot "engine-core.js"
$engineCliPath = Join-Path $PSScriptRoot "engine-cli.js"

if (-not (Test-Path $engineCorePath)) {
    Write-Error "[ERROR] Engine core file not found: $engineCorePath"
    exit 1
}

if (-not (Test-Path $engineCliPath)) {
    Write-Error "[ERROR] Engine CLI file not found: $engineCliPath"
    exit 1
}

Write-Success "[OK] Engine files check passed"

Write-Info "[3/4] Creating project directories..."
$projectsPath = Join-Path (Get-Location) "projects"
$projectPath = Join-Path $projectsPath $ProjectId
$enginePath = Join-Path $projectPath ".engine"

if (-not (Test-Path $projectPath)) {
    New-Item -ItemType Directory -Force -Path $projectPath | Out-Null
    Write-Success "[OK] Created project directory: $projectPath"
} else {
    Write-Success "[OK] Project directory exists: $projectPath"
}

if (-not (Test-Path $enginePath)) {
    New-Item -ItemType Directory -Force -Path $enginePath | Out-Null
    Write-Success "[OK] Created engine directory: $enginePath"
}

Write-Info "[4/4] Checking engine status..."
$pidFile = Join-Path $enginePath "engine.pid"
$portFile = Join-Path $enginePath "engine.port"

if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile -Raw
    try {
        $process = Get-Process -Id $existingPid -ErrorAction Stop
        Write-Warn "[WARNING] Engine already running (PID: $existingPid)"
        
        $healthCheck = & node $engineCliPath $ProjectId HEALTH_CHECK 2>$null | ConvertFrom-Json
        if ($healthCheck.success) {
            Write-Success "[OK] Engine health check passed"
            Write-Success "========================================"
            Write-Success "Engine is already running"
            if (Test-Path $portFile) {
                $port = Get-Content $portFile -Raw
                Write-Info "Port: $port"
            }
            Write-Success "========================================"
            exit 0
        }
    } catch {
        Write-Warn "[WARNING] Found stale PID file, cleaning up..."
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        if (Test-Path $portFile) {
            Remove-Item $portFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Info "========================================"
Write-Info "Starting engine core process..."
Write-Info "========================================"
Write-Host ""

try {
    $process = Start-Process -FilePath "node" `
        -ArgumentList $engineCorePath, $ProjectId `
        -WorkingDirectory (Get-Location) `
        -WindowStyle Hidden `
        -PassThru

    $retry = 0
    $maxRetry = 30
    $ready = $false

    Write-Info "Waiting for engine to be ready..."
    
    while (($retry -lt $maxRetry) -and (-not $ready)) {
        Start-Sleep -Milliseconds 500
        
        if (Test-Path $portFile) {
            try {
                $healthCheck = & node $engineCliPath $ProjectId HEALTH_CHECK 2>$null | ConvertFrom-Json
                if ($healthCheck.success) {
                    $ready = $true
                    break
                }
            } catch {
            }
        }
        
        $retry++
        Write-Host "." -NoNewline
    }
    Write-Host ""

    if ($ready) {
        Write-Success "========================================"
        Write-Success "Engine started successfully!"
        Write-Success "========================================"
        Write-Info "Project: $ProjectId"
        Write-Info "PID: $($process.Id)"
        if (Test-Path $portFile) {
            $port = Get-Content $portFile -Raw
            Write-Info "Port: $port"
        }
        Write-Success "========================================"
        
        $healthCheck = & node $engineCliPath $ProjectId HEALTH_CHECK 2>$null | ConvertFrom-Json
        if ($healthCheck.success) {
            Write-Info "Health status:"
            Write-Info "  - Checkpoints: $($healthCheck.data.checkpointCount)"
            Write-Info "  - Artifacts: $($healthCheck.data.artifactCount)"
            Write-Info "  - Execution history: $($healthCheck.data.executionHistoryCount)"
            Write-Info "  - Uptime: $([math]::Round($healthCheck.data.uptime, 2)) seconds"
        }
        
        exit 0
    } else {
        Write-Error "========================================"
        Write-Error "Engine startup timeout!"
        Write-Error "========================================"
        
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        } catch {}
        
        exit 1
    }
} catch {
    Write-Error "========================================"
    Write-Error "Engine startup failed!"
    Write-Error "Error: $($_.Exception.Message)"
    Write-Error "========================================"
    exit 1
}
