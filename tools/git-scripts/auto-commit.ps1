# Auto Commit Script - 自动提交并清理临时文件
# 使用方法: .\auto-commit.ps1 -Message "提交信息"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Update files",
    
    [Parameter(Mandatory=$false)]
    [string[]]$TempFilesToDelete = @()
)

$ErrorActionPreference = "Stop"

# 定位到仓库根目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptPath\..\.."
Set-Location $repoRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Auto Commit Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否有变更
$status = git status --short
if (-not $status) {
    Write-Host "没有需要提交的变更" -ForegroundColor Yellow
    exit 0
}

Write-Host "[1/3] 添加所有变更..." -ForegroundColor Green
git add -A

Write-Host "[2/3] 提交变更..." -ForegroundColor Green
git commit -m "$Message"

Write-Host "[3/3] 推送到远端..." -ForegroundColor Green
git push origin master

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "提交成功！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# 删除临时文件
if ($TempFilesToDelete.Count -gt 0) {
    Write-Host ""
    Write-Host "清理临时文件..." -ForegroundColor Yellow
    foreach ($file in $TempFilesToDelete) {
        $fullPath = Join-Path $repoRoot $file
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Force
            Write-Host "  已删除: $file" -ForegroundColor Gray
        }
    }
}

# 自动清理常见的临时脚本
$commonTempFiles = @(
    "do-push.bat",
    "quick-push.bat",
    "temp-*.bat",
    "git-commit*.bat",
    "git-push*.bat"
)

Write-Host ""
Write-Host "自动清理临时脚本..." -ForegroundColor Yellow
foreach ($pattern in $commonTempFiles) {
    $files = Get-ChildItem -Path $repoRoot -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file.FullName -Force
        Write-Host "  已删除: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "完成！" -ForegroundColor Green
