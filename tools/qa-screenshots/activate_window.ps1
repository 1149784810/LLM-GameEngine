param(
    [string]$WindowTitle = "Clicker Quest"
)

# Load required assemblies
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WindowActivator {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);
    
    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_MAXIMIZE = 3;
}
"@

Write-Host "Activating window: $WindowTitle"

# Find window
$hWnd = [WindowActivator]::FindWindow($null, $WindowTitle)

if ($hWnd -eq [IntPtr]::Zero) {
    Write-Host "Window not found with exact title, trying partial match..."
    
    # Get all processes with main window titles
    $processes = Get-Process | Where-Object { $_.MainWindowTitle -like "*$WindowTitle*" }
    
    if ($processes) {
        foreach ($proc in $processes) {
            Write-Host "Found process: $($proc.ProcessName) - $($proc.MainWindowTitle)"
            $hWnd = $proc.MainWindowHandle
            if ($hWnd -ne [IntPtr]::Zero) {
                break
            }
        }
    }
}

if ($hWnd -ne [IntPtr]::Zero) {
    Write-Host "Found window handle: $hWnd"
    
    # Restore window if minimized
    [WindowActivator]::ShowWindow($hWnd, [WindowActivator]::SW_RESTORE)
    
    # Bring to front
    $result = [WindowActivator]::SetForegroundWindow($hWnd)
    
    if ($result) {
        Write-Host "Window activated successfully!"
    } else {
        Write-Host "Failed to activate window"
    }
} else {
    Write-Host "Window not found!"
}
