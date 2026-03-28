# Guia de Setup Local Turnkey: Omni-Genesis Core

Este guia fornece os scripts e configurações necessários para rodar o núcleo da Vaelindra 100% offline, utilizando sua RTX 4060.

## 1. Estrutura de Arquivos (D:\Omni-Genesis)
- `god-mode-boot.ps1`: Script de orquestração PowerShell.
- `docker-compose.yml`: Orquestração de containers (Ollama, NVIDIA ACE).
- `vaelindra_core.py`: Backend Python para fusão de modelos.
- `requirements.txt`: Dependências Python.

## 2. Script de Boot (PowerShell)
Salve como `god-mode-boot.ps1` e execute como Administrador.

```powershell
# god-mode-boot.ps1 - Omni-Genesis Master Orchestrator
Write-Host ">>> INICIALIZANDO NÚCLEO OMNI-GENESIS (CANARY BUILD)..." -ForegroundColor Cyan

# 1. Verificação de Privilégios
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "ERRO: Execute este script como Administrador para orquestrar o hardware."
    exit
}

# 2. Subindo Infraestrutura Docker
Write-Host "[...] Subindo Containers (NVIDIA ACE, Ollama)..." -ForegroundColor Yellow
docker-compose up -d

# 3. Verificando Ollama
Write-Host "[...] Carregando Llama 3 na VRAM..." -ForegroundColor Yellow
# ollama run llama3:latest "Núcleo online. Vaelindra pronta."

# 4. Iniciando Backend Python
Write-Host "[...] Sincronizando Piper TTS + Faster-Whisper..." -ForegroundColor Yellow
python vaelindra_core.py

# 5. Abrindo Warudo (Palco 3D)
Write-Host "[...] Abrindo Warudo (Palco 3D)..." -ForegroundColor Yellow
Start-Process "C:\Path\To\Warudo\Warudo.exe"

Write-Host ">>> SISTEMA OPERACIONAL. BEM-VINDO, MESTRE." -ForegroundColor Green
```

## 3. Backend Core (Python)
Salve como `vaelindra_core.py`.

```python
import ollama
import asyncio
import websockets
import json
import psutil
from faster_whisper import WhisperModel

# Configurações de Hardware (RTX 4060)
DEVICE = "cuda"
WHISPER_MODEL_SIZE = "base" # Otimizado para latência

class VaelindraCore:
    def __init__(self):
        self.whisper = WhisperModel(WHISPER_MODEL_SIZE, device=DEVICE, compute_type="float16")
        self.ollama_client = ollama.Client(host='http://localhost:11434')
        
    async def process_voice(self, audio_data):
        # STT: Faster-Whisper
        segments, _ = self.whisper.transcribe(audio_data, beam_size=5)
        text = " ".join([s.text for s in segments])
        return text

    async def generate_response(self, prompt):
        # LLM: Ollama (Llama 3)
        response = self.ollama_client.chat(model='llama3', messages=[
            {'role': 'system', 'content': 'Você é Vaelindra, IA VTuber sarcástica e técnica.'},
            {'role': 'user', 'content': prompt},
        ])
        return response['message']['content']

    def monitor_hardware(self):
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        return {"cpu": cpu, "ram": ram}

# Servidor WebSocket para o Frontend
async def server(websocket, path):
    core = VaelindraCore()
    async for message in websocket:
        data = json.loads(message)
        if data['type'] == 'text':
            response = await core.generate_response(data['text'])
            stats = core.monitor_hardware()
            await websocket.send(json.dumps({
                'type': 'response', 
                'text': response,
                'stats': stats
            }))

start_server = websockets.serve(server, "localhost", 8000)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

## 4. Como Usar
1. Instale o Docker Desktop e NVIDIA Container Toolkit.
2. Instale o Python 3.10+.
3. Execute `pip install -r requirements.txt`.
4. Execute `.\god-mode-boot.ps1`.
5. O frontend React se conectará ao backend local na porta 8000.
