$source = "C:\Users\Admin\.gemini\antigravity\scratch\rain-forecasting-system"
$temp = "C:\Users\Admin\.gemini\antigravity\scratch\temp_project_export"
$dest = "C:\Users\Admin\.gemini\antigravity\scratch\Rain_Forecasting_Project.zip"

Write-Host "Creating a temporary copy of the project..."
if (Test-Path $temp) { Remove-Item -Path $temp -Recurse -Force }
Copy-Item -Path $source -Destination $temp -Recurse

Write-Host "Removing heavy node_modules and cache folders..."
Remove-Item -Path "$temp\server\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$temp\client\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$temp\ml\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Compressing into ZIP file (this might take a moment)..."
if (Test-Path $dest) { Remove-Item -Path $dest -Force }
Compress-Archive -Path "$temp\*" -DestinationPath $dest

Write-Host "Cleaning up temporary files..."
Remove-Item -Path $temp -Recurse -Force

Write-Host "✅ ZIP file created successfully at: $dest"
