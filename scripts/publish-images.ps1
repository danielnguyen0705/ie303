param(
    [string]$Namespace = $(if ($env:DOCKER_NAMESPACE) { $env:DOCKER_NAMESPACE } else { "yourname" }),
    [string]$Tag = $(if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "1.0" })
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

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
