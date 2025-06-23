# Download SoX installer
$soxUrl = "https://sourceforge.net/projects/sox/files/sox/14.4.2/sox-14.4.2-win32.exe/download"
$installerPath = "$env:TEMP\sox-installer.exe"

Write-Host "Downloading SoX installer..."
Invoke-WebRequest -Uri $soxUrl -OutFile $installerPath

# Install SoX
Write-Host "Installing SoX..."
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait

# Add SoX to PATH if not already present
$soxPath = "C:\Program Files (x86)\sox"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$soxPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$soxPath", "Machine")
    $env:Path = "$env:Path;$soxPath"
}

Write-Host "SoX installation completed. Please restart your terminal to use SoX." 