# OMNI-GENESIS: SCRIPT DE BOOT 'GOD MODE'
# Este script orquestra a inicialização de todo o ecossistema VTuber IA.

Write-Host "--- INICIANDO OMNI-GENESIS NÚCLEO IA VTUBER ---" -ForegroundColor Cyan
Write-Host "Verificando integridade do sistema..."

# 1. Verificar se o Docker está rodando (Para NVIDIA ACE)
if (!(Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Host " [!] Docker Desktop não detectado. Iniciando..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker Desktop\Docker Desktop.exe"
    Start-Sleep -Seconds 15
}

# 2. Iniciar Ollama (Cérebro Local)
if (!(Get-Process "ollama" -ErrorAction SilentlyContinue)) {
    Write-Host " [!] Ollama não detectado. Iniciando..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

# 3. Iniciar Warudo (Renderizador de Avatar)
Write-Host " [!] Iniciando Warudo..." -ForegroundColor Yellow
# Substitua pelo caminho real do executável do Warudo
# Start-Process "D:\Warudo\Warudo.exe"

# 4. Iniciar OBS Studio
if (!(Get-Process "obs64" -ErrorAction SilentlyContinue)) {
    Write-Host " [!] Iniciando OBS Studio..." -ForegroundColor Yellow
    Start-Process "obs64"
}

# 5. Iniciar Backend Python (Núcleo Vaelindra)
Write-Host " [!] Iniciando Backend Omni-Genesis..." -ForegroundColor Yellow
cd "D:\Omni-Genesis - Núcleo IA VTuber"
Start-Process "python" -ArgumentList "backend/RUNP.py"

Write-Host "--- SISTEMA OMNI-GENESIS OPERACIONAL ---" -ForegroundColor Green
Write-Host "Vaelindra está pronta para dominar a live."
