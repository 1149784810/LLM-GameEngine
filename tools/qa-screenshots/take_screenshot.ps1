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

    # Get primary screen bounds
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bounds = $screen.Bounds

    Write-Host "Screen info:"
    Write-Host "  Resolution: $($bounds.Width) x $($bounds.Height)"

    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)

    # Create graphics object
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # Copy screen content
    $graphics.CopyFromScreen(
        $bounds.Location,
        [System.Drawing.Point]::Empty,
        $bounds.Size
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
