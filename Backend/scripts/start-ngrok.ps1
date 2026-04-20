$ErrorActionPreference = "Stop"

param(
    [int]$Port = 8080,
    [string]$WebhookPath = "/api/payments/webhook/vnpay"
)

function Assert-CommandExists {
    param([string]$CommandName)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay '$CommandName'. Cai dat ngrok truoc khi chay script."
    }
}

Assert-CommandExists -CommandName "ngrok"

$projectRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $projectRoot "logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ngrokProcess) {
    $outLog = Join-Path $logsDir "ngrok.out.log"
    $errLog = Join-Path $logsDir "ngrok.err.log"
    $ngrokProcess = Start-Process `
        -FilePath "ngrok" `
        -ArgumentList @("http", "$Port") `
        -PassThru `
        -WindowStyle Hidden `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog
}

$tunnelApi = "http://127.0.0.1:4040/api/tunnels"
$response = $null
for ($i = 0; $i -lt 20; $i++) {
    try {
        $response = Invoke-RestMethod -Method Get -Uri $tunnelApi -TimeoutSec 3
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            break
        }
    } catch {
        # ngrok web api may not be ready yet
    }
    Start-Sleep -Seconds 1
}

if (-not $response -or -not $response.tunnels -or $response.tunnels.Count -eq 0) {
    throw "Khong lay duoc tunnel tu ngrok. Kiem tra logs/ngrok.err.log"
}

$selectedTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
if (-not $selectedTunnel) {
    $selectedTunnel = $response.tunnels | Select-Object -First 1
}

$publicUrl = $selectedTunnel.public_url.TrimEnd("/")
$ipnUrl = "$publicUrl$WebhookPath"

Write-Output "ngrok pid: $($ngrokProcess.Id)"
Write-Output "NGROK_PUBLIC_URL=$publicUrl"
Write-Output "VNPAY_IPN_URL=$ipnUrl"
Write-Output "Dat URL nay trong VNPay sandbox (IPN/Notify URL): $ipnUrl"
