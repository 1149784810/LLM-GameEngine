# 多智能体协作方案 - 优化配置部署脚本 (PowerShell)
# 使用方法: .\deploy.ps1 [trae_skills_path]

param(
    [string]$TraeSkillsPath = ".trae\skills"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  多智能体协作方案 - 优化配置部署工具  " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 检查路径是否存在
if (-not (Test-Path $TraeSkillsPath)) {
    Write-Host "错误: Trae技能目录不存在: $TraeSkillsPath" -ForegroundColor Red
    Write-Host "请确认Trae IDE已安装，或手动指定技能目录路径"
    Write-Host "用法: .\deploy.ps1 C:\path\to\.trae\skills"
    exit 1
}

Write-Host "✓ 技能目录: $TraeSkillsPath" -ForegroundColor Green
Write-Host ""

# 备份原有配置
Write-Host "步骤1: 备份原有配置..." -ForegroundColor Yellow
$BackupDir = "$TraeSkillsPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path $TraeSkillsPath -Destination $BackupDir -Recurse
Write-Host "✓ 备份已创建: $BackupDir" -ForegroundColor Green
Write-Host ""

# 更新技能文件
Write-Host "步骤2: 更新技能文件..." -ForegroundColor Yellow

# 更新 qa-standards-manager
$QaPath = Join-Path $TraeSkillsPath "qa-standards-manager"
if (Test-Path $QaPath) {
    Copy-Item "$ScriptDir\qa-standards-manager.md" "$QaPath\SKILL.md" -Force
    Write-Host "✓ 已更新: qa-standards-manager" -ForegroundColor Green
} else {
    Write-Host "! 跳过: qa-standards-manager (目录不存在)" -ForegroundColor Yellow
}

# 更新 project-flow-manager
$FlowPath = Join-Path $TraeSkillsPath "project-flow-manager"
if (Test-Path $FlowPath) {
    Copy-Item "$ScriptDir\project-flow-manager.md" "$FlowPath\SKILL.md" -Force
    Write-Host "✓ 已更新: project-flow-manager" -ForegroundColor Green
} else {
    Write-Host "! 跳过: project-flow-manager (目录不存在)" -ForegroundColor Yellow
}

# 更新 fullstack-game-engine
$EnginePath = Join-Path $TraeSkillsPath "fullstack-game-engine"
if (Test-Path $EnginePath) {
    Copy-Item "$ScriptDir\fullstack-game-engine.md" "$EnginePath\SKILL.md" -Force
    Write-Host "✓ 已更新: fullstack-game-engine" -ForegroundColor Green
} else {
    Write-Host "! 跳过: fullstack-game-engine (目录不存在)" -ForegroundColor Yellow
}

# 新增 bug-tracker
$BugTrackerPath = Join-Path $TraeSkillsPath "bug-tracker"
if (-not (Test-Path $BugTrackerPath)) {
    New-Item -ItemType Directory -Path $BugTrackerPath | Out-Null
    Write-Host "✓ 已创建: bug-tracker 目录" -ForegroundColor Green
}
Copy-Item "$ScriptDir\bug-tracker.md" "$BugTrackerPath\SKILL.md" -Force
Write-Host "✓ 已添加: bug-tracker" -ForegroundColor Green

# 更新 experience-db
$ExpPath = Join-Path $TraeSkillsPath "project-experience-summarizer"
if (Test-Path $ExpPath) {
    Copy-Item "$ScriptDir\experience-db.md" "$ExpPath\experience-db.md" -Force
    Write-Host "✓ 已更新: experience-db" -ForegroundColor Green
} else {
    Write-Host "! 跳过: experience-db (目录不存在)" -ForegroundColor Yellow
}

Write-Host ""

# 更新 fullstack-engine-init（添加bug-tracker检查）
Write-Host "步骤3: 更新初始化检查..." -ForegroundColor Yellow
$InitPath = Join-Path $TraeSkillsPath "fullstack-engine-init"
if (Test-Path $InitPath) {
    $InitFile = Join-Path $InitPath "SKILL.md"
    if (Test-Path $InitFile) {
        $Content = Get-Content $InitFile -Raw
        if ($Content -notmatch "bug-tracker") {
            # 在核心依赖部分添加bug-tracker
            $NewContent = $Content -replace "(### 核心依赖[\s\S]*?)(\| 2 \| requirement-normalizer)", "`$1| 3 | bug-tracker | `.trae/skills/bug-tracker/` | Bug追踪管理，防止问题回退 |`n`$2"
            Set-Content $InitFile $NewContent
            Write-Host "✓ 已更新: fullstack-engine-init (添加bug-tracker检查)" -ForegroundColor Green
        } else {
            Write-Host "✓ 已包含: bug-tracker检查" -ForegroundColor Green
        }
    }
} else {
    Write-Host "! 跳过: fullstack-engine-init (目录不存在)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "优化内容:"
Write-Host "  - 强制测试流程（功能/视觉/回归测试）"
Write-Host "  - 阶段门控机制（检查通过才能进入下一阶段）"
Write-Host "  - 审核检查清单（策划/程序审核逐项勾选）"
Write-Host "  - Bug闭环管理（记录→修复→验证→关闭）"
Write-Host "  - 经验库更新（新增4条经验记录）"
Write-Host ""
Write-Host "下一步:"
Write-Host "  1. 重启Trae IDE使配置生效"
Write-Host "  2. 查看 README.md 了解使用方法"
Write-Host "  3. 查看 优化对比说明.md 了解详细变更"
Write-Host ""
Write-Host "备份位置: $BackupDir"
Write-Host ""

pause
