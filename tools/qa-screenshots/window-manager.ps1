param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("bring-to-front", "set-topmost", "remove-topmost", "find-window", "list-windows")]
    [string]$Action,
    
    [string]$WindowTitle = "",
    [string]$ProcessName = "",
    [int]$TimeoutSeconds = 5
)

# 添加Windows API类型定义
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowManager {
    // Windows API 常量
    public const uint SW_SHOW = 5;
    public const uint SW_RESTORE = 9;
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public static readonly IntPtr HWND_TOP = new IntPtr(0);
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const uint SWP_FRAMECHANGED = 0x0020;
    
    // Windows API 函数
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, uint nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    
    // 将窗口置顶
    public static bool SetTopmost(IntPtr hWnd) {
        if (!IsWindow(hWnd)) return false;
        return SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
    }
    
    // 取消窗口置顶
    public static bool RemoveTopmost(IntPtr hWnd) {
        if (!IsWindow(hWnd)) return false;
        return SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
    }
    
    // 将窗口带到前台
    public static bool BringToFront(IntPtr hWnd) {
        if (!IsWindow(hWnd)) return false;
        
        // 如果窗口最小化，先恢复
        if (IsIconic(hWnd)) {
            ShowWindow(hWnd, SW_RESTORE);
        }
        
        // 设置前台窗口
        return SetForegroundWindow(hWnd);
    }
    
    // 获取窗口标题
    public static string GetWindowTitle(IntPtr hWnd) {
        int length = GetWindowTextLength(hWnd);
        if (length == 0) return "";
        StringBuilder sb = new StringBuilder(length + 1);
        GetWindowText(hWnd, sb, sb.Capacity);
        return sb.ToString();
    }
}
"@

# 获取所有可见窗口的列表
function Get-VisibleWindows {
    $windows = @()
    $callback = {
        param([IntPtr]$hWnd, [IntPtr]$lParam)
        
        if ([WindowManager]::IsWindowVisible($hWnd)) {
            $title = [WindowManager]::GetWindowTitle($hWnd)
            if ($title -and $title.Length -gt 0) {
                $processId = 0
                [void][WindowManager]::GetWindowThreadProcessId($hWnd, [ref]$processId)
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    $windows += [PSCustomObject]@{
                        Handle = $hWnd
                        Title = $title
                        ProcessId = $processId
                        ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
                    }
                } catch {}
            }
        }
        return $true
    }
    
    $delegate = [WindowManager+EnumWindowsProc]$callback
    [void][WindowManager]::EnumWindows($delegate, [IntPtr]::Zero)
    
    return $windows
}

# 根据标题查找窗口
function Find-WindowByTitle {
    param([string]$TitlePattern)
    
    $windows = Get-VisibleWindows
    $matched = $windows | Where-Object { $_.Title -like "*$TitlePattern*" }
    
    if ($matched.Count -gt 0) {
        return $matched[0].Handle
    }
    return [IntPtr]::Zero
}

# 根据进程名查找窗口
function Find-WindowByProcess {
    param([string]$ProcName)
    
    $windows = Get-VisibleWindows
    $matched = $windows | Where-Object { $_.ProcessName -like "*$ProcName*" }
    
    if ($matched.Count -gt 0) {
        return $matched[0].Handle
    }
    return [IntPtr]::Zero
}

# 主逻辑
switch ($Action) {
    "list-windows" {
        Write-Host "=== 当前可见窗口列表 ===" -ForegroundColor Cyan
        $windows = Get-VisibleWindows | Sort-Object ProcessName
        $windows | Format-Table -AutoSize
        Write-Host "共找到 $($windows.Count) 个可见窗口" -ForegroundColor Green
    }
    
    "find-window" {
        if ([string]::IsNullOrEmpty($WindowTitle) -and [string]::IsNullOrEmpty($ProcessName)) {
            Write-Host "错误: 必须提供 WindowTitle 或 ProcessName 参数" -ForegroundColor Red
            exit 1
        }
        
        $hWnd = [IntPtr]::Zero
        if (-not [string]::IsNullOrEmpty($WindowTitle)) {
            $hWnd = Find-WindowByTitle -TitlePattern $WindowTitle
        } else {
            $hWnd = Find-WindowByProcess -ProcName $ProcessName
        }
        
        if ($hWnd -ne [IntPtr]::Zero) {
            $title = [WindowManager]::GetWindowTitle($hWnd)
            Write-Host "找到窗口: '$title' (Handle: $hWnd)" -ForegroundColor Green
            return $hWnd
        } else {
            Write-Host "未找到匹配的窗口" -ForegroundColor Yellow
            return $null
        }
    }
    
    "bring-to-front" {
        if ([string]::IsNullOrEmpty($WindowTitle) -and [string]::IsNullOrEmpty($ProcessName)) {
            Write-Host "错误: 必须提供 WindowTitle 或 ProcessName 参数" -ForegroundColor Red
            exit 1
        }
        
        $hWnd = [IntPtr]::Zero
        $searchStart = Get-Date
        
        # 等待并尝试查找窗口
        while ($hWnd -eq [IntPtr]::Zero -and ((Get-Date) - $searchStart).TotalSeconds -lt $TimeoutSeconds) {
            if (-not [string]::IsNullOrEmpty($WindowTitle)) {
                $hWnd = Find-WindowByTitle -TitlePattern $WindowTitle
            } else {
                $hWnd = Find-WindowByProcess -ProcName $ProcessName
            }
            
            if ($hWnd -eq [IntPtr]::Zero) {
                Start-Sleep -Milliseconds 500
            }
        }
        
        if ($hWnd -eq [IntPtr]::Zero) {
            Write-Host "错误: 在 ${TimeoutSeconds} 秒内未找到匹配的窗口" -ForegroundColor Red
            exit 1
        }
        
        $title = [WindowManager]::GetWindowTitle($hWnd)
        Write-Host "正在将窗口置顶: '$title'" -ForegroundColor Cyan
        
        # 先取消置顶（如果有）
        [void][WindowManager]::RemoveTopmost($hWnd)
        Start-Sleep -Milliseconds 100
        
        # 带到前台
        $result = [WindowManager]::BringToFront($hWnd)
        
        if ($result) {
            Write-Host "✅ 窗口已成功带到前台: '$title'" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 窗口带到前台可能失败" -ForegroundColor Yellow
        }
    }
    
    "set-topmost" {
        if ([string]::IsNullOrEmpty($WindowTitle) -and [string]::IsNullOrEmpty($ProcessName)) {
            Write-Host "错误: 必须提供 WindowTitle 或 ProcessName 参数" -ForegroundColor Red
            exit 1
        }
        
        $hWnd = [IntPtr]::Zero
        if (-not [string]::IsNullOrEmpty($WindowTitle)) {
            $hWnd = Find-WindowByTitle -TitlePattern $WindowTitle
        } else {
            $hWnd = Find-WindowByProcess -ProcName $ProcessName
        }
        
        if ($hWnd -eq [IntPtr]::Zero) {
            Write-Host "错误: 未找到匹配的窗口" -ForegroundColor Red
            exit 1
        }
        
        $title = [WindowManager]::GetWindowTitle($hWnd)
        Write-Host "正在设置窗口置顶: '$title'" -ForegroundColor Cyan
        
        $result = [WindowManager]::SetTopmost($hWnd)
        
        if ($result) {
            Write-Host "✅ 窗口已置顶: '$title'" -ForegroundColor Green
        } else {
            Write-Host "❌ 窗口置顶失败" -ForegroundColor Red
        }
    }
    
    "remove-topmost" {
        if ([string]::IsNullOrEmpty($WindowTitle) -and [string]::IsNullOrEmpty($ProcessName)) {
            Write-Host "错误: 必须提供 WindowTitle 或 ProcessName 参数" -ForegroundColor Red
            exit 1
        }
        
        $hWnd = [IntPtr]::Zero
        if (-not [string]::IsNullOrEmpty($WindowTitle)) {
            $hWnd = Find-WindowByTitle -TitlePattern $WindowTitle
        } else {
            $hWnd = Find-WindowByProcess -ProcName $ProcessName
        }
        
        if ($hWnd -eq [IntPtr]::Zero) {
            Write-Host "错误: 未找到匹配的窗口" -ForegroundColor Red
            exit 1
        }
        
        $title = [WindowManager]::GetWindowTitle($hWnd)
        Write-Host "正在取消窗口置顶: '$title'" -ForegroundColor Cyan
        
        $result = [WindowManager]::RemoveTopmost($hWnd)
        
        if ($result) {
            Write-Host "✅ 窗口已取消置顶: '$title'" -ForegroundColor Green
        } else {
            Write-Host "❌ 取消置顶失败" -ForegroundColor Red
        }
    }
}
