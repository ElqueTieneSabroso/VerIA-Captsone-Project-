param(
  [Parameter(Mandatory = $true)]
  [string]$InputDocx,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$resolvedInput = (Resolve-Path -LiteralPath $InputDocx).Path
$resolvedWorkspace = (Resolve-Path -LiteralPath "C:\capstone").Path
$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)

if (-not $resolvedInput.StartsWith($resolvedWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "El documento debe estar dentro de C:\capstone."
}

if (-not $outputPath.StartsWith($resolvedWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "La salida debe estar dentro de C:\capstone."
}

$profilePath = Join-Path $outputPath "lo-profile"
$profileUri = "file:///" + ($profilePath -replace "\\", "/")
$soffice = "C:\capstone\.tools\LibreOffice-lessmsi\SourceDir\LibreOffice\program\soffice.com"
$pdftoppm = "C:\Users\IRowen\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe"
$pdfName = [System.IO.Path]::GetFileNameWithoutExtension($resolvedInput) + ".pdf"
$pdfPath = Join-Path $outputPath $pdfName
$pngPrefix = Join-Path $outputPath "page"

New-Item -ItemType Directory -Path $outputPath, $profilePath -Force | Out-Null

& $soffice "-env:UserInstallation=$profileUri" --headless --norestore --convert-to pdf --outdir $outputPath $resolvedInput
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $pdfPath)) {
  throw "LibreOffice no pudo convertir el DOCX."
}

& $pdftoppm -png -r 150 $pdfPath $pngPrefix
if ($LASTEXITCODE -ne 0) {
  throw "pdftoppm no pudo rasterizar el PDF."
}

$pages = Get-ChildItem -LiteralPath $outputPath -Filter "page-*.png" |
  Sort-Object { [int]($_.BaseName -replace "^page-", "") }

[PSCustomObject]@{
  PDF = $pdfPath
  Pages = $pages.Count
  FirstPage = $pages[0].FullName
  LastPage = $pages[-1].FullName
} | Format-List
