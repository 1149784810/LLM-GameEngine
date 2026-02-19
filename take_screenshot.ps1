Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Get screen bounds
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
Write-Host "Screen size: $($bounds.Width) x $($bounds.Height)"

# Create bitmap
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)

# Create graphics
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Copy screen
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

# Create directory
$screenshotDir = "e:\screenshots_temp"
if (!(Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Path $screenshotDir -Force | Out-Null
    Write-Host "Created directory: $screenshotDir"
}

# Generate filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filePath = Join-Path $screenshotDir "screenshot_$timestamp.png"
Write-Host "Save path: $filePath"

# Save image
$bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$bitmap.Dispose()

# Verify
if (Test-Path $filePath) {
    $fileInfo = Get-Item $filePath
    Write-Host "Screenshot saved successfully!"
    Write-Host "File size: $($fileInfo.Length) bytes"
    Write-Host "Full path: $filePath"
} else {
    Write-Host "Error: Screenshot file was not created"
}
