param(
  [Parameter(Mandatory = $true)]
  [string]$InputDocx
)

$resolvedInput = (Resolve-Path -LiteralPath $InputDocx).Path
$word = $null
$document = $null

try {
  Write-Output "WORD_INSPECT_START $(Get-Date -Format o)"
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  Write-Output "WORD_CREATED $(Get-Date -Format o)"
  $document = $word.Documents.Open($resolvedInput, $false, $true)
  Write-Output "DOCUMENT_OPENED $(Get-Date -Format o)"
  $pages = $document.ComputeStatistics(2)
  Write-Output "PAGES_COMPUTED $pages $(Get-Date -Format o)"
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
