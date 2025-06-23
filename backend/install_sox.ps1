# Download SoX installer
$url = "https://sourceforge.net/projects/sox/files/sox/14.4.2/sox-14.4.2-win32.exe/download"
$output = "sox-installer.exe"

Write-Host "Downloading SoX installer..."
Invoke-WebRequest -Uri $url -OutFile $output

# Install SoX silently
Write-Host "Installing SoX..."
Start-Process -FilePath $output -ArgumentList "/S" -Wait

# Clean up installer
Remove-Item $output

# Add SoX to PATH if not already there
$soxPath = "C:\Program Files (x86)\sox"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (-not $currentPath.Contains($soxPath)) {
    [Environment]::SetEnvironmentVariable("Path", $currentPath + ";" + $soxPath, "Machine")
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
}

Write-Host "SoX installation completed!" 