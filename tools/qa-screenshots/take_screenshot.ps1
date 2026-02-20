param(
    [string]$OutputDir = "",
    [string]$FileName = ""
)

# Set default output directory
if ([string]::IsNullOrEmpty($OutputDir)) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $workspacePath = Split-Path -Parent $scriptPath
    $OutputDir = Join-Path $workspacePath "screenshots\raw"
}

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created directory: $OutputDir"
}

# Generate filename
if ([string]::IsNullOrEmpty($FileName)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $FileName = "screenshot_$timestamp"
}

# Full file path
$filePath = Join-Path $OutputDir "$FileName.png"

try {
    # Load required assemblies
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    # Get actual screen resolution (ignoring DPI scaling)
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class ScreenHelper {
        [DllImport("user32.dll")]
        public static extern int GetSystemMetrics(int nIndex);
        
        [DllImport("gdi32.dll")]
        public static extern int GetDeviceCaps(IntPtr hdc, int nIndex);
        
        [DllImport("user32.dll")]
        public static extern IntPtr GetDC(IntPtr hWnd);
        
        [DllImport("user32.dll")]
        public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
        
        public const int SM_CXSCREEN = 0;
        public const int SM_CYSCREEN = 1;
        public const int DESKTOPHORZRES = 118;
        public const int DESKTOPVERTRES = 117;
        
        public static int GetPhysicalScreenWidth() {
            try {
                IntPtr hdc = GetDC(IntPtr.Zero);
                if (hdc == IntPtr.Zero) return 0;
                int width = GetDeviceCaps(hdc, DESKTOPHORZRES);
                ReleaseDC(IntPtr.Zero, hdc);
                return width;
            }
            catch {
                return 0;
            }
        }
        
        public static int GetPhysicalScreenHeight() {
            try {
                IntPtr hdc = GetDC(IntPtr.Zero);
                if (hdc == IntPtr.Zero) return 0;
                int height = GetDeviceCaps(hdc, DESKTOPVERTRES);
                ReleaseDC(IntPtr.Zero, hdc);
                return height;
            }
            catch {
                return 0;
            }
        }
    }
"@

    # Get all screens info
    $screens = [System.Windows.Forms.Screen]::AllScreens
    Write-Host "Detected $($screens.Count) screen(s):"
    
    # Calculate total bounds across all screens
    $left = 0
    $top = 0
    $right = 0
    $bottom = 0
    
    foreach ($screen in $screens) {
        Write-Host "  - $($screen.DeviceName): $($screen.Bounds.Width) x $($screen.Bounds.Height) at ($($screen.Bounds.Left), $($screen.Bounds.Top))"
        if ($screen.Bounds.Left -lt $left) { $left = $screen.Bounds.Left }
        if ($screen.Bounds.Top -lt $top) { $top = $screen.Bounds.Top }
        if ($screen.Bounds.Right -gt $right) { $right = $screen.Bounds.Right }
        if ($screen.Bounds.Bottom -gt $bottom) { $bottom = $screen.Bounds.Bottom }
    }
    
    # Get physical screen resolution (ignoring DPI scaling)
    $physicalWidth = [ScreenHelper]::GetPhysicalScreenWidth()
    $physicalHeight = [ScreenHelper]::GetPhysicalScreenHeight()
    
    # If physical detection fails, use virtual resolution
    if ($physicalWidth -eq 0 -or $physicalHeight -eq 0) {
        Write-Host "Warning: Physical resolution detection failed, using virtual resolution" -ForegroundColor Yellow
        $primaryScreen = [System.Windows.Forms.Screen]::PrimaryScreen
        $physicalWidth = $primaryScreen.Bounds.Width
        $physicalHeight = $primaryScreen.Bounds.Height
    }
    
    # For multi-screen setup, use the total bounds
    if ($screens.Count -gt 1) {
        $totalWidth = $right - $left
        $totalHeight = $bottom - $top
        Write-Host "Multi-screen detected, using total bounds: $totalWidth x $totalHeight"
        $physicalWidth = $totalWidth
        $physicalHeight = $totalHeight
    }

    Write-Host "Screen info:"
    Write-Host "  Capture Resolution: $physicalWidth x $physicalHeight"
    Write-Host "  Primary Screen Virtual: $([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width) x $([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height)"

    # Validate resolution
    if ($physicalWidth -le 0 -or $physicalHeight -le 0) {
        throw "Invalid screen resolution: $physicalWidth x $physicalHeight"
    }
    
    if ($physicalWidth -gt 10000 -or $physicalHeight -gt 10000) {
        Write-Host "Warning: Unusually large resolution detected, capping to reasonable values" -ForegroundColor Yellow
        $physicalWidth = [Math]::Min($physicalWidth, 7680)  # 8K max
        $physicalHeight = [Math]::Min($physicalHeight, 4320)
    }

    # Create bitmap with detected resolution
    $bitmap = New-Object System.Drawing.Bitmap($physicalWidth, $physicalHeight)

    # Create graphics object
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # Copy screen content
    $graphics.CopyFromScreen(
        [System.Drawing.Point]::new($left, $top),
        [System.Drawing.Point]::Empty,
        [System.Drawing.Size]::new($physicalWidth, $physicalHeight)
    )

    # Save image
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()

    # Verify file
    if (Test-Path $filePath) {
        $fileInfo = Get-Item $filePath
        Write-Host "Screenshot saved successfully!" -ForegroundColor Green
        Write-Host "  File: $($fileInfo.Name)"
        Write-Host "  Size: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
        Write-Host "  Resolution: $physicalWidth x $physicalHeight"
        Write-Host "  Path: $filePath"
        return $filePath
    } else {
        Write-Host "Error: Failed to save screenshot" -ForegroundColor Red
        return $null
    }
}
catch {
    Write-Host "Error taking screenshot: $_" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
    return $null
}
