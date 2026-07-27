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

New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
$pdfPath = Join-Path $outputPath "VERIA_Dossier_Tecnico_y_Calidad_2026-07-24.pdf"
$pngPrefix = Join-Path $outputPath "page"
$pdftoppm = "C:\Users\IRowen\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\override\pdftoppm.cmd"

$word = $null
$document = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($resolvedInput, $false, $true)
  $document.SaveAs2($pdfPath, 17)
} finally {
  if ($null -ne $document) {
    $document.Close($false)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null
  }
  if ($null -ne $word) {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

& $pdftoppm -png -r 150 $pdfPath $pngPrefix
if ($LASTEXITCODE -ne 0) {
  throw "pdftoppm no pudo rasterizar el PDF."
}

$pages = Get-ChildItem -LiteralPath $outputPath -Filter "page-*.png" |
  Sort-Object Name

[PSCustomObject]@{
  PDF = $pdfPath
  Pages = $pages.Count
  FirstPage = $pages[0].FullName
  LastPage = $pages[-1].FullName
} | Format-List
