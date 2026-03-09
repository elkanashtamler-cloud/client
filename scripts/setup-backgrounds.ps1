# Reads source folder from scripts\backgrounds-source.txt (one line = path)
# Then copies images to public\backgrounds and creates list.json

$pathFile = Join-Path $PSScriptRoot "backgrounds-source.txt"
if (-not (Test-Path $pathFile)) {
    Set-Content -Path $pathFile -Value "C:\Users\elkan\OneDrive\Desktop\YOUR-PHOTOS-FOLDER" -Encoding UTF8
    Write-Host "Created backgrounds-source.txt - put your photos folder path in it, then run again."
    exit 0
}

$sourceDir = (Get-Content -Path $pathFile -Encoding UTF8 -Raw).Trim()
$targetDir = Join-Path $PSScriptRoot "..\public\backgrounds"
$extensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif")

if (-not (Test-Path $sourceDir)) {
    Write-Host "Folder not found. Edit scripts\backgrounds-source.txt"
    exit 1
}

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

$files = Get-ChildItem -Path $sourceDir -File | Where-Object {
    $extensions -contains $_.Extension.ToLower()
}

if ($files.Count -eq 0) {
    Write-Host "No images found in folder."
    exit 0
}

$names = @()
foreach ($f in $files) {
    $dest = Join-Path $targetDir $f.Name
    Copy-Item -Path $f.FullName -Destination $dest -Force
    $names += $f.Name
    Write-Host "Copied: $($f.Name)"
}

$listPath = Join-Path $targetDir "list.json"
$names | ConvertTo-Json | Set-Content -Path $listPath -Encoding UTF8
Write-Host "Done. list.json has $($names.Count) images."
