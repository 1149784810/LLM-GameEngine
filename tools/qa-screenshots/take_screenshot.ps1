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
            IntPtr hdc = GetDC(IntPtr.Zero);
            int width = GetDeviceCaps(hdc, DESKTOPHORZRES);
            ReleaseDC(IntPtr.Zero, hdc);
            return width;
        }
        
        public static int GetPhysicalScreenHeight() {
            IntPtr hdc = GetDC(IntPtr.Zero);
            int height = GetDeviceCaps(hdc, DESKTOPVERTRES);
            ReleaseDC(IntPtr.Zero, hdc);
            return height;
        }
    }
"@

    # Get physical screen resolution
    $physicalWidth = [ScreenHelper]::GetPhysicalScreenWidth()
    $physicalHeight = [ScreenHelper]::GetPhysicalScreenHeight()
    
    # Fallback to virtual resolution if physical detection fails
    if ($physicalWidth -eq 0 -or $physicalHeight -eq 0) {
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen
        $physicalWidth = $screen.Bounds.Width
        $physicalHeight = $screen.Bounds.Height
    }

    Write-Host "Screen info:"
    Write-Host "  Physical Resolution: $physicalWidth x $physicalHeight"
    Write-Host "  Virtual Resolution: $([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width) x $([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height)"

    # Create bitmap with physical resolution
    $bitmap = New-Object System.Drawing.Bitmap($physicalWidth, $physicalHeight)

    # Create graphics object
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # Copy screen content from (0,0) with physical size
    $graphics.CopyFromScreen(
        [System.Drawing.Point]::Empty,
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
        Write-Host "Screenshot saved successfully!"
        Write-Host "  File: $($fileInfo.Name)"
        Write-Host "  Size: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
        Write-Host "  Resolution: $physicalWidth x $physicalHeight"
        Write-Host "  Path: $filePath"
        return $filePath
    } else {
        Write-Host "Error: Failed to save screenshot"
        return $null
    }
}
catch {
    Write-Host "Error taking screenshot: $_"
    return $null
}
