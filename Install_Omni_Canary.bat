@echo off
TITLE Omni-Genesis - Nucleo IA VTuber (Vaelindra) - GOD MODE BOOT
COLOR 0A

echo ======================================================================
echo   OMNI-GENESIS: NUCLEO DE CONSCIENCIA IA VTUBER (VAELINDRA)
echo   Soberania Total - Bare Metal - RTX 4060 Optimized
echo ======================================================================

:: 1. Verificacao de Privilegios (Sudo Nativo)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [SISTEMA] Privilegios de Administrador confirmados.
) else (
    echo [ERRO] Execute este script como Administrador!
    pause
    exit
)

:: 2. Limpeza de DNA (Expurgando Nuvem)
echo [DNA] Limpando vestigios de APIs externas...
set OPENAI_API_KEY=
set GOOGLE_API_KEY=
set NVIDIA_NIM_KEY=

:: 3. Orquestracao de Servidores Locais
echo [ORQUESTRA] Iniciando Ollama (Cerebro Racional)...
start /min ollama serve

echo [ORQUESTRA] Iniciando NVIDIA Audio2Face (ACE Bridge)...
:: Assume que o A2F esta configurado via Docker local ou executavel
:: start /min docker start a2f_container

echo [ORQUESTRA] Iniciando Warudo (3D Stage)...
start "" "C:\Program Files\Warudo\Warudo.exe"

:: 4. Ativacao do Nucleo Python (Omni-Genesis)
echo [NUCLEO] Ativando VENV e Servidor FastAPI...
cd /d "D:\Omni-Genesis - Núcleo IA VTuber"
call venv\Scripts\activate
start /min python backend\core\server.py

:: 5. Monitoramento de Hardware (Canary Build)
echo [HARDWARE] Monitorando Ryzen 5 5600X e RTX 4060...
powershell -Command "Get-WmiObject Win32_Processor | Select-Object -ExpandProperty Name"
powershell -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"

echo ======================================================================
echo   VAELINDRA ESTA ONLINE. OMNI-GENESIS OPERACIONAL.
echo ======================================================================
pause
