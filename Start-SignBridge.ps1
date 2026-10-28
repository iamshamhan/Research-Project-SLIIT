$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$pythonExe = Join-Path $projectRoot 'backend\.venv\Scripts\python.exe'
$nextEntry = Join-Path $projectRoot 'frontend\node_modules\next\dist\bin\next'
if (!(Test-Path -LiteralPath $pythonExe) -or !(Test-Path -LiteralPath $nextEntry)) {
    throw 'Dependencies are missing. Follow README.md setup instructions first.'
}
$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3000, 8000) }
if ($listeners) { throw 'Port 3000 or 8000 is already in use. If SignBridge is running, open http://127.0.0.1:3000. Otherwise close the conflicting service and retry.' }
$backendProcess = $null
$frontendProcess = $null
try {
    Write-Host 'Starting SignBridge. Keep this window open; press Ctrl+C to stop.'
    $backendProcess = Start-Process -FilePath $pythonExe -ArgumentList '-m','uvicorn','main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'backend\server.log') -RedirectStandardError (Join-Path $projectRoot 'backend\server-error.log')
    $frontendProcess = Start-Process -FilePath 'node' -ArgumentList ('"' + $nextEntry + '"'),'dev','--hostname','127.0.0.1','--port','3000' -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'frontend\server.log') -RedirectStandardError (Join-Path $projectRoot 'frontend\server-error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) { throw 'A service stopped. See backend and frontend server-error.log files.' }
        try {
            $health = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2
            $page = Invoke-WebRequest 'http://127.0.0.1:3000' -TimeoutSec 2
            if ($health.status -eq 'ok' -and $page.StatusCode -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 1 }
    }
    if (!$ready) { throw 'Startup timed out. See the server logs.' }
    Write-Host 'Ready: http://127.0.0.1:3000 — open this address in your browser.'
    while (!$backendProcess.HasExited -and !$frontendProcess.HasExited) { Start-Sleep -Seconds 1 }
} finally {
    foreach ($serviceProcess in @($backendProcess, $frontendProcess)) {
        if ($null -ne $serviceProcess -and !$serviceProcess.HasExited) {
            # Stop only the service tree created by this launcher.
            & taskkill.exe /PID $serviceProcess.Id /T /F | Out-Null
        }
    }
}
