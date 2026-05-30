param(
    [string]$Namespace,
    [string]$Tag,
    [string]$EnvFile
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-EnvFileValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
            continue
        }

        if ($trimmed -match '^\s*([^=]+?)\s*=\s*(.*)\s*$') {
            $key = $matches[1].Trim()
            if ($key -eq $Name) {
                return $matches[2].Trim().Trim('"').Trim("'")
            }
        }
    }

    return $null
}

if (-not $EnvFile) {
    $candidatePaths = @(
        (Join-Path $PSScriptRoot "..\.env.prod"),
        (Join-Path (Get-Location) ".env.prod")
    )

    $EnvFile = $candidatePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

if (-not $Namespace) {
    $Namespace = if ($env:DOCKER_NAMESPACE) {
        $env:DOCKER_NAMESPACE
    }
    else {
        Get-EnvFileValue -Path $EnvFile -Name "DOCKER_NAMESPACE"
    }
}

if (-not $Tag) {
    $Tag = if ($env:IMAGE_TAG) {
        $env:IMAGE_TAG
    }
    else {
        Get-EnvFileValue -Path $EnvFile -Name "IMAGE_TAG"
    }
}

if (-not $Namespace) {
    $Namespace = "yourname"
}

if (-not $Tag) {
    $Tag = "1.0"
}

$services = @(
    @{ Name = "gateway"; Path = "GatewayService"; Args = @() },
    @{ Name = "identity"; Path = "IdentityService"; Args = @() },
    @{ Name = "payment"; Path = "PaymentService"; Args = @() },
    @{ Name = "notification"; Path = "NotificationService"; Args = @() },
    @{ Name = "gamification"; Path = "GamificationService"; Args = @() },
    @{ Name = "content"; Path = "ContentService"; Args = @() },
    @{ Name = "progress"; Path = "ProgressService"; Args = @() },
    @{ Name = "ai"; Path = "AIService"; Args = @() },
    @{ Name = "ml"; Path = "MLService"; Args = @() },
    @{ Name = "frontend"; Path = "Frontend"; Args = @("--build-arg", "VITE_API_BASE_URL=/api", "--build-arg", "VITE_BACKEND_BASE_URL=http://localhost:8081") }
)

foreach ($service in $services) {
    $image = "$Namespace/uifive-$($service.Name):$Tag"
    Write-Host "Building $image"

    $buildArgs = @("build", "-t", $image)
    $buildArgs += $service.Args
    $buildArgs += $service.Path

    & docker @buildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed for $image"
    }

    Write-Host "Pushing $image"
    & docker push $image
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed for $image"
    }
}

Write-Host "All images published successfully."
