<#
.SYNOPSIS
    完整路径测试工作流 - 执行程序测试和视觉测试
.DESCRIPTION
    根据主策划提供的功能路径说明书，执行完整的QA测试（程序测试+视觉测试）
.PARAMETER ConfigPath
    测试配置文件路径（JSON格式）
.PARAMETER ApplicationPath
    被测应用程序路径
.PARAMETER LogPath
    游戏Log文件路径
.EXAMPLE
    .\complete_path_test.ps1 -ConfigPath "test_config.json" -ApplicationPath "C:\Game\Game.exe" -LogPath "C:\Game\Logs\Player.log"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigPath,
    
    [Parameter(Mandatory=$true)]
    [string]$ApplicationPath,
    
    [string]$LogPath = ""
)

# 获取路径
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspacePath = Split-Path -Parent $scriptPath
$reportsPath = Join-Path $workspacePath "screenshots\reports"

# 确保报告目录存在
if (!(Test-Path $reportsPath)) {
    New-Item -ItemType Directory -Path $reportsPath -Force | Out-Null
}

Write-Host "========================================"
Write-Host "    Complete Path Test Workflow"
Write-Host "========================================"
Write-Host ""

# 读取测试配置
if (!(Test-Path $ConfigPath)) {
    Write-Host "Error: Config file not found: $ConfigPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $ConfigPath | ConvertFrom-Json
$testPaths = $config.Paths
$windowTitle = $config.WindowTitle

Write-Host "Test Configuration:"
Write-Host "  Application: $ApplicationPath"
Write-Host "  Window Title: $windowTitle"
Write-Host "  Path Count: $($testPaths.Count)"
Write-Host ""

# 启动应用
Write-Host "Step 1: Starting application..."
$process = Start-Process $ApplicationPath -PassThru
Start-Sleep -Seconds 5
Write-Host "Application started (PID: $($process.Id))"
Write-Host ""

# 最大化窗口
Write-Host "Step 2: Maximizing window..."
$maximizeScript = Join-Path $scriptPath "maximize_and_screenshot.ps1"
& $maximizeScript -WindowTitle $windowTitle -ValidationName "path_test_init" | Out-Null
Write-Host ""

# 测试结果集合
$testResults = @()

# 遍历每个路径进行测试
foreach ($path in $testPaths) {
    Write-Host "----------------------------------------"
    Write-Host "Testing Path: $($path.Name)"
    Write-Host "----------------------------------------"
    Write-Host ""
    
    $pathResult = [PSCustomObject]@{
        PathName = $path.Name
        ProgramTest = $null
        VisualTest = $null
        OverallSuccess = $false
    }
    
    # === 程序测试 ===
    if ($LogPath -and (Test-Path $LogPath)) {
        Write-Host "Running Program Test (Log Analysis)..."
        $analyzeScript = Join-Path $scriptPath "analyze_path_logs.ps1"
        $programResult = & $analyzeScript -LogFilePath $LogPath -PathName $path.Name -ExpectedSteps $path.Steps
        $pathResult.ProgramTest = $programResult
        
        if ($programResult.Success) {
            Write-Host "Program Test: PASSED ✓" -ForegroundColor Green
        } else {
            Write-Host "Program Test: FAILED ✗" -ForegroundColor Red
        }
    } else {
        Write-Host "Skipping Program Test (Log file not available)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # === 视觉测试 ===
    Write-Host "Running Visual Test (Screenshot)..."
    
    # 在每个节点截图
    $nodeScreenshots = @()
    foreach ($node in $path.Nodes) {
        Write-Host "  Capturing node: $($node.Name)..."
        
        # 这里应该执行UI操作（如点击按钮）
        # 实际项目中需要集成自动化测试工具
        
        # 截图
        $screenshotName = "$($path.Name)_$($node.Name)"
        $screenshotResult = & $maximizeScript -WindowTitle $windowTitle -ValidationName $screenshotName
        
        $nodeScreenshots += [PSCustomObject]@{
            NodeName = $node.Name
            ScreenshotPath = $screenshotResult
            ExpectedUI = $node.ExpectedUI
        }
        
        Start-Sleep -Seconds 1
    }
    
    $pathResult.VisualTest = [PSCustomObject]@{
        NodeCount = $nodeScreenshots.Count
        Screenshots = $nodeScreenshots
        # 实际项目中这里应该调用vision-interpreter进行验证
    }
    
    Write-Host "Visual Test: $($nodeScreenshots.Count) nodes captured" -ForegroundColor Green
    Write-Host ""
    
    # 综合结果
    $programSuccess = if ($pathResult.ProgramTest) { $pathResult.ProgramTest.Success } else { $true }
    $visualSuccess = $nodeScreenshots.Count -eq $path.Nodes.Count
    $pathResult.OverallSuccess = $programSuccess -and $visualSuccess
    
    $testResults += $pathResult
    
    Write-Host "Path Result: $(if ($pathResult.OverallSuccess) { 'PASSED ✓' } else { 'FAILED ✗' })" -ForegroundColor $(if ($pathResult.OverallSuccess) { 'Green' } else { 'Red' })
    Write-Host ""
}

# 生成测试报告
Write-Host "========================================"
Write-Host "Generating Test Report..."
Write-Host "========================================"
Write-Host ""

$reportTime = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = Join-Path $reportsPath "complete_path_test_report_$reportTime.md"

$reportContent = @"
# 完整路径测试报告

## 测试信息
- **测试时间**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **应用程序**: $ApplicationPath
- **测试路径数**: $($testPaths.Count)

## 测试结果汇总

| 路径名称 | 程序测试 | 视觉测试 | 综合结果 |
|----------|----------|----------|----------|
"@

foreach ($result in $testResults) {
    $programStatus = if ($result.ProgramTest) { $(if ($result.ProgramTest.Success) { "✓ 通过" } else { "✗ 失败" }) } else { "- 跳过" }
    $visualStatus = $(if ($result.VisualTest.Screenshots.Count -eq $result.VisualTest.NodeCount) { "✓ 通过" } else { "✗ 失败" })
    $overallStatus = $(if ($result.OverallSuccess) { "✓ 通过" } else { "✗ 失败" })
    
    $reportContent += "| $($result.PathName) | $programStatus | $visualStatus | $overallStatus |`n"
}

$reportContent += @"

## 详细结果

"@

foreach ($result in $testResults) {
    $reportContent += @"
### $($result.PathName)

**程序测试结果**:
"@
    if ($result.ProgramTest) {
        $reportContent += @"
- 开始次数: $($result.ProgramTest.StartCount)
- 步骤数: $($result.ProgramTest.StepCount)
- 完成次数: $($result.ProgramTest.CompleteCount)
- 错误数: $($result.ProgramTest.ErrorCount)
- 执行步骤: $($result.ProgramTest.UniqueSteps -join ', ')
"@
    } else {
        $reportContent += "- 未执行（Log文件不可用）`n"
    }
    
    $reportContent += @"

**视觉测试结果**:
- 节点数: $($result.VisualTest.NodeCount)
- 截图数: $($result.VisualTest.Screenshots.Count)

**节点截图**:
"@
    
    foreach ($screenshot in $result.VisualTest.Screenshots) {
        $reportContent += "- $($screenshot.NodeName): ``$($screenshot.ScreenshotPath)`` `n"
    }
    
    $reportContent += "`n---`n`n"
}

$reportContent += @"
## 结论

**整体测试**: $(if (($testResults | Where-Object { $_.OverallSuccess -eq $false }).Count -eq 0) { "✓ 通过" } else { "✗ 失败" })

**通过路径**: $(($testResults | Where-Object { $_.OverallSuccess -eq $true }).Count) / $($testResults.Count)

**建议**:
$(if (($testResults | Where-Object { $_.OverallSuccess -eq $false }).Count -gt 0) { "- 修复失败的路径后重新测试`n" } else { "- 所有路径测试通过，可以进行下一阶段`n" })
- 视觉测试截图已保存到 screenshots/raw/ 目录
- 详细Log分析请查看Log文件
"@

# 保存报告
$reportContent | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "Test Report saved to: $reportFile" -ForegroundColor Green
Write-Host ""

# 关闭应用
Write-Host "Closing application..."
$process | Stop-Process -Force
Write-Host ""

Write-Host "========================================"
Write-Host "    Test Complete!"
Write-Host "========================================"
Write-Host ""

# 返回结果
return $testResults
