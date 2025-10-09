# Script PowerShell para Build e Push da Imagem Docker
# Uso: .\build-and-push.ps1 [versao]

param(
    [string]$Version = "latest",
    [string]$DockerUsername = "seu-usuario"  # Altere aqui
)

$IMAGE_NAME = "sistema-ata-audio"
$FULL_IMAGE_NAME = "$DockerUsername/$IMAGE_NAME:$Version"

Write-Host "🐳 Iniciando build da imagem Docker..." -ForegroundColor Green
Write-Host "📦 Imagem: $FULL_IMAGE_NAME" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "Inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Verificar se está logado
$dockerInfo = docker info 2>&1
if ($dockerInfo -notmatch "Username") {
    Write-Host "⚠️  Você não está logado no Docker Hub" -ForegroundColor Yellow
    Write-Host "Execute: docker login" -ForegroundColor Yellow
    
    $login = Read-Host "Deseja fazer login agora? (s/n)"
    if ($login -eq "s") {
        docker login
    } else {
        exit 1
    }
}

# Build da imagem
Write-Host "🔨 Construindo imagem..." -ForegroundColor Cyan
Push-Location frontend
docker build -f Dockerfile.prod -t $FULL_IMAGE_NAME .
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar tamanho
$imageInfo = docker images $FULL_IMAGE_NAME --format "{{.Size}}"
Write-Host "📊 Tamanho da imagem: $imageInfo" -ForegroundColor Cyan
Write-Host ""

# Push para Docker Hub
Write-Host "📤 Enviando imagem para Docker Hub..." -ForegroundColor Cyan
docker push $FULL_IMAGE_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Imagem enviada com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Disponível em: https://hub.docker.com/r/$DockerUsername/$IMAGE_NAME" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Para usar na VPS:" -ForegroundColor Yellow
    Write-Host "   docker pull $FULL_IMAGE_NAME" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Agora execute: .\deploy-from-registry.ps1" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao enviar imagem!" -ForegroundColor Red
    exit 1
}


