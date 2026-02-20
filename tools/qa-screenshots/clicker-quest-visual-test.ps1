<#
.SYNOPSIS
    Clicker Quest 自动化视觉测试脚本
.DESCRIPTION
    根据功能路径说明书自动测试所有界面交互
#>

param(
    [string]$OutputDir = "E:\全栈游戏开发引擎\screenshots\clicker-quest-visual-test"
)

# 加载Windows API
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowHelper {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_SHOWMAXIMIZED = 3;
    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
    
    public static string GetWindowTitle(IntPtr hWnd) {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hWnd, sb, 256);
        return sb.ToString();
    }
    
    public static void ClickAt(int x, int y) {
        SetCursorPos(x, y);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        Start-Sleep -Milliseconds 50
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
}
"@

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 创建输出目录
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$script:foundHwnd = [IntPtr]::Zero

function Find-WindowByTitle {
    param([string]$title)
    
    $script:foundHwnd = [IntPtr]::Zero
    
    $callback = {
        param([IntPtr]$hWnd, [IntPtr]$lParam)
        
        $windowTitle = [WindowHelper]::GetWindowTitle($hWnd)
        
        if ($windowTitle -like "*$title*" -and [WindowHelper]::IsWindowVisible($hWnd)) {
            $script:foundHwnd = $hWnd
            return $false
        }
        return $true
    }
    
    $delegate = [WindowHelper+EnumWindowsProc]$callback
    [WindowHelper]::EnumWindows($delegate, [IntPtr]::Zero) | Out-Null
    
    return $script:foundHwnd
}

function Take-Screenshot {
    param([string]$FileName)
    
    $filePath = Join-Path $OutputDir "$FileName.png"
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bounds = $screen.Bounds
    
    $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "  Screenshot saved: $FileName.png"
    return $filePath
}

function Click-AtPosition {
    param([int]$X, [int]$Y)
    
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
    Start-Sleep -Milliseconds 100
    
    Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint info, uint extraInfo);' -Name U32 -Namespace W
    [W.U32]::mouse_event(0x02, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [W.U32]::mouse_event(0x04, 0, 0, 0, 0)
    
    Start-Sleep -Milliseconds 300
}

function Bring-WindowToFront {
    param([IntPtr]$hWnd)
    
    if ([WindowHelper]::IsIconic($hWnd)) {
        [WindowHelper]::ShowWindow($hWnd, [WindowHelper]::SW_RESTORE) | Out-Null
    }
    
    [WindowHelper]::SetForegroundWindow($hWnd) | Out-Null
    Start-Sleep -Milliseconds 500
}

# 主测试流程
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clicker Quest Visual Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$testResults = @()

# Step 1: 打开浏览器访问游戏
Write-Host "`n[Step 1] Opening browser with game..." -ForegroundColor Yellow

$gameUrl = "http://localhost:8080/"
Start-Process "msedge" $gameUrl
Start-Sleep -Seconds 3

# 查找浏览器窗口
$hWnd = Find-WindowByTitle -title "Clicker Quest"
if ($hWnd -eq [IntPtr]::Zero) {
    $hWnd = Find-WindowByTitle -title "localhost:8080"
}
if ($hWnd -eq [IntPtr]::Zero) {
    $hWnd = Find-WindowByTitle -title "Edge"
}

if ($hWnd -ne [IntPtr]::Zero) {
    Bring-WindowToFront -hWnd $hWnd
    Write-Host "  Browser window found and brought to front" -ForegroundColor Green
} else {
    Write-Host "  Warning: Could not find browser window" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 2: 截图主界面
Write-Host "`n[Step 2] Testing Main Screen..." -ForegroundColor Yellow
Take-Screenshot -FileName "01-main-screen"
$testResults += @{Step="Main Screen"; Status="Captured"}

# Step 3: 测试点击按钮
Write-Host "`n[Step 3] Testing Click Button..." -ForegroundColor Yellow

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$centerX = [int]($screen.Bounds.Width / 2)
$centerY = [int]($screen.Bounds.Height / 2)

Click-AtPosition -X $centerX -Y $centerY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "02-click-action"
$testResults += @{Step="Click Action"; Status="Captured"}

# 多次点击测试连击
1..3 | ForEach-Object {
    Click-AtPosition -X $centerX -Y $centerY
    Start-Sleep -Milliseconds 200
}
Take-Screenshot -FileName "03-combo-test"
$testResults += @{Step="Combo Test"; Status="Captured"}

# Step 4: 测试商店按钮
Write-Host "`n[Step 4] Testing Shop Screen..." -ForegroundColor Yellow

$navY = [int]($screen.Bounds.Height - 60)
$shopX = [int]($screen.Bounds.Width / 4)

Click-AtPosition -X $shopX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "04-shop-screen"
$testResults += @{Step="Shop Screen"; Status="Captured"}

# 测试商店分类标签
$tabY = [int]($screen.Bounds.Height * 0.25)
$tab2X = [int]($screen.Bounds.Width * 0.4)
Click-AtPosition -X $tab2X -Y $tabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "05-shop-category-click"
$testResults += @{Step="Shop Category"; Status="Captured"}

# 返回主界面
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 5: 测试道具按钮
Write-Host "`n[Step 5] Testing Items Screen..." -ForegroundColor Yellow

$itemsX = [int]($screen.Bounds.Width / 2)
Click-AtPosition -X $itemsX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "06-items-screen"
$testResults += @{Step="Items Screen"; Status="Captured"}

# 返回主界面
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 6: 测试成就按钮
Write-Host "`n[Step 6] Testing Achievements Screen..." -ForegroundColor Yellow

$achieveX = [int]($screen.Bounds.Width * 3 / 4)
Click-AtPosition -X $achieveX -Y $navY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "07-achievements-screen"
$testResults += @{Step="Achievements Screen"; Status="Captured"}

# 测试成就分类标签
$achieveTabY = [int]($screen.Bounds.Height * 0.2)
$achieveTab2X = [int]($screen.Bounds.Width * 0.35)
Click-AtPosition -X $achieveTab2X -Y $achieveTabY
Start-Sleep -Milliseconds 500
Take-Screenshot -FileName "08-achievements-category"
$testResults += @{Step="Achievements Category"; Status="Captured"}

# 返回主界面
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 7: 测试设置按钮
Write-Host "`n[Step 7] Testing Settings Screen..." -ForegroundColor Yellow

$settingsX = [int]($screen.Bounds.Width - 50)
$settingsY = 50
Click-AtPosition -X $settingsX -Y $settingsY
Start-Sleep -Seconds 1
Take-Screenshot -FileName "09-settings-screen"
$testResults += @{Step="Settings Screen"; Status="Captured"}

# 返回主界面
Click-AtPosition -X 50 -Y 50
Start-Sleep -Seconds 1

# Step 8: 最终主界面截图
Write-Host "`n[Step 8] Final Main Screen..." -ForegroundColor Yellow
Take-Screenshot -FileName "10-final-main-screen"
$testResults += @{Step="Final Main Screen"; Status="Captured"}

# 输出测试结果
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Visual Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nScreenshots saved to: $OutputDir" -ForegroundColor White
Write-Host "`nTest Steps Completed:" -ForegroundColor White
$testResults | ForEach-Object {
    Write-Host "  - $($_.Step): $($_.Status)" -ForegroundColor Green
}

# 关闭浏览器
Write-Host "`nClosing browser..." -ForegroundColor Yellow
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue

Write-Host "`nDone!" -ForegroundColor Green
