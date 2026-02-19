param(
    [Parameter(Mandatory=$true)]
    [string]$WindowTitle,
    
    [string]$ApplicationPath = "",
    
    [string]$ProcessName = "",
    
    [string]$ValidationName = "",
    
    [switch]$Maximize = $true
)

# Windows API for window control
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowControl {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool IsZoomed(IntPtr hWnd);
    
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_SHOWMAXIMIZED = 3;
    public const int SW_SHOWMINIMIZED = 2;
    public const int SW_MAXIMIZE = 3;
    
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    public static string GetWindowTitle(IntPtr hWnd) {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hWnd, sb, 256);
        return sb.ToString();
    }
}
"@

# Get paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspacePath = Split-Path -Parent $scriptPath
$screenshotsPath = Join-Path $workspacePath "screenshots"

Write-Host "========================================"
Write-Host "  Maximize & Screenshot Workflow"
Write-Host "========================================"
Write-Host ""

# Function to find window
function Find-WindowByTitle {
    param([string]$title)
    $foundHwnd = [IntPtr]::Zero
    $callback = {
        param([IntPtr]$hWnd, [IntPtr]$lParam)
        $windowTitle = [WindowControl]::GetWindowTitle($hWnd)
        if ($windowTitle -like "*$title*" -and [WindowControl]::IsWindowVisible($hWnd)) {
            $script:foundHwnd = $hWnd
            return $false
        }
        return $true
    }
    $delegate = [WindowControl+EnumWindowsProc]$callback
    [WindowControl]::EnumWindows($delegate, [IntPtr]::Zero) | Out-Null
    return $script:foundHwnd
}

# Step 1: Start application if needed
Write-Host "Step 1: Finding/Starting application..."
$hWnd = Find-WindowByTitle -title $WindowTitle

if ($hWnd -eq [IntPtr]::Zero) {
    Write-Host "Window not found. Starting application..."
    if ($ApplicationPath -and (Test-Path $ApplicationPath)) {
        Start-Process $ApplicationPath
    } elseif ($ProcessName) {
        Start-Process $ProcessName
    } else {
        Write-Host "Error: No application path or process name provided"
        exit 1
    }
    Start-Sleep -Seconds 4
    $hWnd = Find-WindowByTitle -title $WindowTitle
}

if ($hWnd -eq [IntPtr]::Zero) {
    Write-Host "Error: Could not find or start application"
    exit 1
}

Write-Host "Found window: $WindowTitle"
Write-Host ""

# Step 2: Restore and bring to front
Write-Host "Step 2: Bringing window to front..."
if ([WindowControl]::IsIconic($hWnd)) {
    [WindowControl]::ShowWindow($hWnd, [WindowControl]::SW_RESTORE) | Out-Null
}
[WindowControl]::SetForegroundWindow($hWnd) | Out-Null
Start-Sleep -Milliseconds 500
Write-Host "Window activated"
Write-Host ""

# Step 3: Maximize window
if ($Maximize) {
    Write-Host "Step 3: Maximizing window..."
    [WindowControl]::ShowWindow($hWnd, [WindowControl]::SW_MAXIMIZE) | Out-Null
    Start-Sleep -Seconds 2
    
    # Verify maximized
    if ([WindowControl]::IsZoomed($hWnd)) {
        Write-Host "Window maximized successfully"
    } else {
        Write-Host "Warning: Window may not be maximized"
    }
    Write-Host ""
}

# Step 4: Wait for stabilization
Write-Host "Step 4: Waiting for window to stabilize..."
Start-Sleep -Seconds 2
Write-Host ""

# Step 5: Take screenshot
Write-Host "Step 5: Taking screenshot..."
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bounds = $screen.Bounds

Write-Host "Screen resolution: $($bounds.Width) x $($bounds.Height)"

$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

# Generate filename
if ([string]::IsNullOrEmpty($ValidationName)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $fileName = "screenshot_$timestamp"
} else {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $fileName = "${ValidationName}_$timestamp"
}

$outputDir = Join-Path $screenshotsPath "raw"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$filePath = Join-Path $outputDir "$fileName.png"
$bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

if (Test-Path $filePath) {
    $fileInfo = Get-Item $filePath
    Write-Host "Screenshot saved successfully!"
    Write-Host "  File: $($fileInfo.Name)"
    Write-Host "  Size: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
    Write-Host "  Path: $filePath"
} else {
    Write-Host "Error: Failed to save screenshot"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Screenshot Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Full-screen screenshot captured of: $WindowTitle"
Write-Host "Saved to: $filePath"
Write-Host ""

return $filePath
