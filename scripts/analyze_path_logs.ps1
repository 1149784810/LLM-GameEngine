<#
.SYNOPSIS
    路径Log分析脚本 - 分析游戏Log验证功能路径执行情况
.DESCRIPTION
    读取游戏Log文件，分析特定功能路径的执行情况，验证是否完整执行
.PARAMETER LogFilePath
    Log文件路径
.PARAMETER PathName
    要分析的路径名称
.PARAMETER ExpectedSteps
    预期的路径步骤列表（可选）
.EXAMPLE
    .\analyze_path_logs.ps1 -LogFilePath "C:\Game\Logs\Player.log" -PathName "NewPlayerFlow"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$LogFilePath,
    
    [Parameter(Mandatory=$true)]
    [string]$PathName,
    
    [string[]]$ExpectedSteps = @()
)

Write-Host "========================================"
Write-Host "    Path Log Analysis"
Write-Host "========================================"
Write-Host ""

# 检查Log文件是否存在
if (!(Test-Path $LogFilePath)) {
    Write-Host "Error: Log file not found: $LogFilePath" -ForegroundColor Red
    exit 1
}

Write-Host "Analyzing Log file: $LogFilePath"
Write-Host "Path name: $PathName"
Write-Host ""

# 读取Log内容
$logContent = Get-Content $LogFilePath -Raw

# 分析路径开始
$pathStartPattern = "\[PATH_START\]\s*$PathName"
$pathStarts = [regex]::Matches($logContent, $pathStartPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# 分析路径步骤
$pathStepPattern = "\[PATH_STEP\]\s*$PathName\s*\|\s*Step:\s*(\w+)"
$pathSteps = [regex]::Matches($logContent, $pathStepPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# 分析路径完成
$pathCompletePattern = "\[PATH_COMPLETE\]\s*$PathName"
$pathCompletes = [regex]::Matches($logContent, $pathCompletePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# 分析路径错误
$pathErrorPattern = "\[PATH_ERROR\]\s*$PathName"
$pathErrors = [regex]::Matches($logContent, $pathErrorPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# 提取步骤名称
$executedSteps = $pathSteps | ForEach-Object { $_.Groups[1].Value }
$uniqueSteps = $executedSteps | Select-Object -Unique

Write-Host "Analysis Results:"
Write-Host "----------------"
Write-Host "Path Start Count: $($pathStarts.Count)"
Write-Host "Path Steps Count: $($pathSteps.Count)"
Write-Host "Unique Steps: $($uniqueSteps.Count)"
Write-Host "Path Complete Count: $($pathCompletes.Count)"
Write-Host "Path Error Count: $($pathErrors.Count)"
Write-Host ""

if ($uniqueSteps.Count -gt 0) {
    Write-Host "Executed Steps:"
    $uniqueSteps | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}

if ($pathErrors.Count -gt 0) {
    Write-Host "Errors Found:" -ForegroundColor Red
    $pathErrors | ForEach-Object { 
        $errorLine = $_.Value
        Write-Host "  - $errorLine" -ForegroundColor Red
    }
    Write-Host ""
}

# 验证预期步骤
$missingSteps = @()
if ($ExpectedSteps.Count -gt 0) {
    Write-Host "Expected Steps Validation:"
    foreach ($step in $ExpectedSteps) {
        if ($uniqueSteps -contains $step) {
            Write-Host "  ✓ $step" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $step (Missing)" -ForegroundColor Red
            $missingSteps += $step
        }
    }
    Write-Host ""
}

# 生成报告
$success = ($pathErrors.Count -eq 0 -and $pathCompletes.Count -gt 0 -and $missingSteps.Count -eq 0)

$report = [PSCustomObject]@{
    PathName = $PathName
    LogFile = $LogFilePath
    StartCount = $pathStarts.Count
    StepCount = $pathSteps.Count
    UniqueSteps = $uniqueSteps
    CompleteCount = $pathCompletes.Count
    ErrorCount = $pathErrors.Count
    MissingSteps = $missingSteps
    Success = $success
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

Write-Host "----------------"
if ($success) {
    Write-Host "Result: SUCCESS ✓" -ForegroundColor Green
} else {
    Write-Host "Result: FAILED ✗" -ForegroundColor Red
    if ($pathErrors.Count -gt 0) {
        Write-Host "Reason: Errors found during path execution"
    } elseif ($pathCompletes.Count -eq 0) {
        Write-Host "Reason: Path did not complete"
    } elseif ($missingSteps.Count -gt 0) {
        Write-Host "Reason: Missing expected steps"
    }
}
Write-Host ""

# 输出JSON格式报告
$jsonReport = $report | ConvertTo-Json -Depth 3
Write-Host "JSON Report:"
Write-Host $jsonReport

# 返回报告对象
return $report
