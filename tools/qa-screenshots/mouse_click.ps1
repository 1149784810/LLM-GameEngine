param(
    [int]$X = 0,
    [int]$Y = 0,
    [int]$Delay = 100
)

# Load required assembly for mouse operations
Add-Type -AssemblyName System.Windows.Forms

# Mouse event constants
$MOUSEEVENTF_MOVE = 0x0001
$MOUSEEVENTF_LEFTDOWN = 0x0002
$MOUSEEVENTF_LEFTUP = 0x0004
$MOUSEEVENTF_ABSOLUTE = 0x8000

# Get screen size
$screenWidth = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
$screenHeight = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height

Write-Host "Mouse Click Operation"
Write-Host "  Screen: $screenWidth x $screenHeight"
Write-Host "  Target: ($X, $Y)"

# Move mouse to position
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
Write-Host "  Moved cursor to ($X, $Y)"

# Small delay
Start-Sleep -Milliseconds $Delay

# Simulate left mouse click using mouse_event
$signature = @'
[DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
'@

$mouseEvent = Add-Type -MemberDefinition $signature -Name "MouseEvent" -Namespace "Win32" -PassThru

# Convert to absolute coordinates (0-65535)
$absX = [uint32]($X * 65535 / $screenWidth)
$absY = [uint32]($Y * 65535 / $screenHeight)

# Mouse down
$mouseEvent::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50

# Mouse up
$mouseEvent::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Host "  Click executed at ($X, $Y)"
