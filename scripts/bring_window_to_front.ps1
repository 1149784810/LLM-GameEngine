<#
.SYNOPSIS
    窗口置顶脚本 - 将指定窗口置于屏幕最前方
.DESCRIPTION
    通过窗口标题查找应用程序窗口，并将其置顶显示
.PARAMETER WindowTitle
    窗口标题（支持部分匹配）
.PARAMETER ProcessName
    进程名称（可选，用于启动应用）
.PARAMETER ApplicationPath
    应用程序路径（可选，用于启动应用）
.EXAMPLE
    .\bring_window_to_front.ps1 -WindowTitle "全栈游戏开发引擎"
    将标题包含"全栈游戏开发引擎"的窗口置顶
.EXAMPLE
    .\bring_window_to_front.ps1 -ProcessName "notepad" -WindowTitle "无标题"
    启动记事本并将窗口置顶
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$WindowTitle,
    
    [string]$ProcessName = "",
    
    [string]$ApplicationPath = ""
)

# 添加Windows API类型
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
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_SHOWMAXIMIZED = 3;
    
    public static string GetWindowTitle(IntPtr hWnd) {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hWnd, sb, 256);
        return sb.ToString();
    }
}
"@

function Find-WindowByTitle {
    param([string]$title)
    
    $foundHwnd = [IntPtr]::Zero
    
    $callback = {
        param([IntPtr]$hWnd, [IntPtr]$lParam)
        
        $windowTitle = [WindowHelper]::GetWindowTitle($hWnd)
        
        if ($windowTitle -like "*$title*" -and [WindowHelper]::IsWindowVisible($hWnd)) {
            $script:foundHwnd = $hWnd
            return $false  # Stop enumeration
        }
        return $true  # Continue enumeration
    }
    
    $delegate = [WindowHelper+EnumWindowsProc]$callback
    [WindowHelper]::EnumWindows($delegate, [IntPtr]::Zero) | Out-Null
    
    return $script:foundHwnd
}

function Bring-WindowToFront {
    param([IntPtr]$hWnd)
    
    # 如果窗口最小化，先恢复
    if ([WindowHelper]::IsIconic($hWnd)) {
        [WindowHelper]::ShowWindow($hWnd, [WindowHelper]::SW_RESTORE) | Out-Null
    }
    
    # 将窗口置顶
    $result = [WindowHelper]::SetForegroundWindow($hWnd)
    
    return $result
}

# 主逻辑
try {
    Write-Host "Looking for window with title: '$WindowTitle'"
    
    # 首先尝试查找窗口
    $hWnd = Find-WindowByTitle -title $WindowTitle
    
    # 如果没找到窗口，尝试启动应用
    if ($hWnd -eq [IntPtr]::Zero) {
        Write-Host "Window not found. Attempting to start application..."
        
        if (-not [string]::IsNullOrEmpty($ApplicationPath) -and (Test-Path $ApplicationPath)) {
            Start-Process $ApplicationPath
            Write-Host "Started application: $ApplicationPath"
        }
        elseif (-not [string]::IsNullOrEmpty($ProcessName)) {
            try {
                Start-Process $ProcessName
                Write-Host "Started process: $ProcessName"
            }
            catch {
                Write-Host "Failed to start process: $_" -ForegroundColor Red
                exit 1
            }
        }
        else {
            Write-Host "Window not found and no application path or process name provided to start." -ForegroundColor Red
            exit 1
        }
        
        # 等待应用启动
        Write-Host "Waiting for application to start..."
        Start-Sleep -Seconds 3
        
        # 重新查找窗口
        $hWnd = Find-WindowByTitle -title $WindowTitle
    }
    
    # 尝试置顶窗口
    if ($hWnd -ne [IntPtr]::Zero) {
        Write-Host "Found window handle: $hWnd"
        
        $result = Bring-WindowToFront -hWnd $hWnd
        
        if ($result) {
            Write-Host "Window brought to front successfully!" -ForegroundColor Green
            
            # 等待一下确保窗口已置顶
            Start-Sleep -Milliseconds 500
            
            # 验证当前活动窗口
            $currentHwnd = [WindowHelper]::GetForegroundWindow()
            if ($currentHwnd -eq $hWnd) {
                Write-Host "Verified: Window is now in foreground" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "Warning: Window may not be in foreground" -ForegroundColor Yellow
                exit 0
            }
        } else {
            Write-Host "Failed to bring window to front" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Window not found after attempting to start application" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
