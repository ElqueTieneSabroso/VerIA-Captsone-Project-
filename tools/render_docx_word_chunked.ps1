param(
  [Parameter(Mandatory = $true)]
  [string]$InputDocx,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory,

  [int]$ChunkSize = 5
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
$python = "C:\Users\IRowen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$mergeScript = "C:\capstone\tools\merge_pdfs.py"
$word = $null
$document = $null
$parts = [System.Collections.Generic.List[string]]::new()

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($resolvedInput, $false, $true)
  $pageCount = $document.ComputeStatistics(2)
  Write-Output "PAGES $pageCount"

  for ($first = 1; $first -le $pageCount; $first += $ChunkSize) {
    $last = [Math]::Min($first + $ChunkSize - 1, $pageCount)
    $part = Join-Path $outputPath ("part-{0:D3}-{1:D3}.pdf" -f $first, $last)
    Write-Output "EXPORT $first-$last"
    $document.ExportAsFixedFormat(
      $part,
      17,
      $false,
      0,
      3,
      $first,
      $last,
      0,
      $true,
      $true,
      0,
      $true,
      $true,
      $false
    )
    $parts.Add($part)
  }
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

& $python $mergeScript $pdfPath @parts
if ($LASTEXITCODE -ne 0) {
  throw "No se pudieron unir los fragmentos PDF."
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
