Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Pranavesh\.gemini\antigravity-ide\brain\687fc3b8-149a-4a89-8279-93f24232997f\apex_clean_ax_logo_1789220601568.jpg"
$orig = [System.Drawing.Image]::FromFile($src)

function Resize-And-Save($targetWidth, $targetHeight, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($orig, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath ($targetWidth x $targetHeight)"
}

Resize-And-Save 1024 1024 "c:\Paper Trading\public\logo.png"
Resize-And-Save 512 512 "c:\Paper Trading\public\icon-512.png"
Resize-And-Save 192 192 "c:\Paper Trading\public\icon-192.png"
Resize-And-Save 64 64 "c:\Paper Trading\public\favicon.png"

Resize-And-Save 1024 1024 "c:\Paper Trading\dist\logo.png"
Resize-And-Save 512 512 "c:\Paper Trading\dist\icon-512.png"
Resize-And-Save 192 192 "c:\Paper Trading\dist\icon-192.png"
Resize-And-Save 64 64 "c:\Paper Trading\dist\favicon.png"

$orig.Dispose()
Write-Output "All logo and PWA icons generated successfully!"
