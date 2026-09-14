Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Pranavesh\.gemini\antigravity-ide\brain\687fc3b8-149a-4a89-8279-93f24232997f\.user_uploaded\media_1789277529587.jpg"
$orig = [System.Drawing.Image]::FromFile($src)

function Resize-And-Save($targetWidth, $targetHeight, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($orig, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath ($targetWidth x $targetHeight)"
}

# Generate in public/
Resize-And-Save 1024 1024 "c:\Paper Trading\public\logo.png"
Resize-And-Save 512 512 "c:\Paper Trading\public\icon-512.png"
Resize-And-Save 384 384 "c:\Paper Trading\public\icon-384.png"
Resize-And-Save 256 256 "c:\Paper Trading\public\icon-256.png"
Resize-And-Save 192 192 "c:\Paper Trading\public\icon-192.png"
Resize-And-Save 144 144 "c:\Paper Trading\public\icon-144.png"
Resize-And-Save 128 128 "c:\Paper Trading\public\icon-128.png"
Resize-And-Save 96 96 "c:\Paper Trading\public\icon-96.png"
Resize-And-Save 48 48 "c:\Paper Trading\public\icon-48.png"
Resize-And-Save 32 32 "c:\Paper Trading\public\favicon-32.png"
Resize-And-Save 16 16 "c:\Paper Trading\public\favicon-16.png"
Resize-And-Save 512 512 "c:\Paper Trading\public\favicon.png"

# Generate in dist/
if (Test-Path "c:\Paper Trading\dist") {
    Resize-And-Save 1024 1024 "c:\Paper Trading\dist\logo.png"
    Resize-And-Save 512 512 "c:\Paper Trading\dist\icon-512.png"
    Resize-And-Save 384 384 "c:\Paper Trading\dist\icon-384.png"
    Resize-And-Save 256 256 "c:\Paper Trading\dist\icon-256.png"
    Resize-And-Save 192 192 "c:\Paper Trading\dist\icon-192.png"
    Resize-And-Save 144 144 "c:\Paper Trading\dist\icon-144.png"
    Resize-And-Save 128 128 "c:\Paper Trading\dist\icon-128.png"
    Resize-And-Save 96 96 "c:\Paper Trading\dist\icon-96.png"
    Resize-And-Save 48 48 "c:\Paper Trading\dist\icon-48.png"
    Resize-And-Save 32 32 "c:\Paper Trading\dist\favicon-32.png"
    Resize-And-Save 16 16 "c:\Paper Trading\dist\favicon-16.png"
    Resize-And-Save 512 512 "c:\Paper Trading\dist\favicon.png"
}

$orig.Dispose()

# Remove any old SVG logos so they never override the official logo
if (Test-Path "c:\Paper Trading\public\logo.svg") { Remove-Item "c:\Paper Trading\public\logo.svg" -Force }
if (Test-Path "c:\Paper Trading\public\favicon.svg") { Remove-Item "c:\Paper Trading\public\favicon.svg" -Force }
if (Test-Path "c:\Paper Trading\dist\logo.svg") { Remove-Item "c:\Paper Trading\dist\logo.svg" -Force }
if (Test-Path "c:\Paper Trading\dist\favicon.svg") { Remove-Item "c:\Paper Trading\dist\favicon.svg" -Force }

Write-Output "All logo and favicon assets updated with new official user image!"
