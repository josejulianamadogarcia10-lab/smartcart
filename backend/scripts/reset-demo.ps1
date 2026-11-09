$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PSScriptRoot '..\.env'
$databaseName = Get-Content $envPath |
  Where-Object { $_ -match '^DB_DATABASE=' } |
  ForEach-Object { ($_ -split '=', 2)[1].Trim() }

if ($databaseName -eq 'smartcart_test') {
  throw 'Reinicio abortado: este script no puede tocar smartcart_test.'
}

if ([string]::IsNullOrWhiteSpace($databaseName)) {
  throw 'Reinicio abortado: DB_DATABASE no está definido en backend/.env.'
}

Write-Host "ADVERTENCIA: se borrarán todos los datos de '$databaseName', incluidos productos y promociones creados manualmente."
Write-Host 'La base smartcart_test está protegida y no será utilizada por este script.'
$confirmation = Read-Host 'Escribe REINICIAR DEMO para continuar'

if ($confirmation -cne 'REINICIAR DEMO') {
  Write-Host 'Reinicio cancelado.'
  exit 0
}

php artisan migrate:fresh --seed
