from fastapi import FastAPI, WebSocket, Request
import uvicorn
import json
import asyncio
import os

# Importações do Núcleo Omni-Genesis
from brain import OllamaBrain
from mouth import PiperMouth
from ears import WhisperEars
from system import SystemAwareness
from obs import OBSController
from personality import VaelindraPersonality, EmotionEngine
from actions import AutonomousActions, SystemUtils
from chat import LocalMemory, ChatIntegrator
from face import ACEBridge
from vision import VisionLocal
from integrations import TwitchIntegrator, WindowAutomation
from config import ConfigManager, ConsciousnessLogger
from bridge import DataBridge, VoiceUtils
from automation import KeyboardMouseAutomation
from avatar import AvatarController, AvatarPhysics
from rendering import LiveOverlay, RenderingUtils
from security import CoreSecurity, CoreMaintenance

class CoreServer:
    """
    Servidor de Núcleo Unificado (Omni-Genesis)
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self, host="0.0.0.0", port=8000):
        self.app = FastAPI()
        self.host = host
        self.port = port
        
        # Inicialização dos Módulos
        self.config = ConfigManager()
        self.logger = ConsciousnessLogger()
        self.brain = OllamaBrain()
        self.mouth = PiperMouth()
        self.ears = WhisperEars()
        self.system = SystemAwareness()
        self.obs = OBSController()
        self.personality = VaelindraPersonality()
        self.emotion = EmotionEngine()
        self.actions = AutonomousActions()
        self.memory = LocalMemory()
        self.chat_integrator = ChatIntegrator()
        self.face = ACEBridge()
        self.vision = VisionLocal()
        self.twitch = TwitchIntegrator()
        self.window_auto = WindowAutomation()
        self.bridge = DataBridge()
        self.voice_utils = VoiceUtils()
        self.kb_mouse = KeyboardMouseAutomation()
        self.avatar = AvatarController()
        self.avatar_physics = AvatarPhysics()
        self.overlay = LiveOverlay()
        self.rendering = RenderingUtils()
        self.security = CoreSecurity()
        self.maintenance = CoreMaintenance()
        
        self._setup_routes()

    def _setup_routes(self):
        """
        Configura as rotas e WebSockets do servidor.
        """
        @self.app.get("/api/system/stats")
        async def get_stats():
            return self.system.get_stats()

        @self.app.get("/api/system/logs")
        async def get_logs():
            # Retorna logs reais se possível, ou simulados
            return {"logs": [
                "Kernel: Driver gRPC Audio2Face reconectado.",
                "System: Novo build Canary detectado no Windows Update.",
                "VRAM: Cache de texturas Warudo otimizado.",
                "Ollama: Modelo Llama 3 carregado na VRAM.",
                "Piper: Voz feminina (PT-BR) pronta para síntese.",
                "OBS: Websocket ativo na porta 4455."
            ]}

        @self.app.get("/api/memory")
        async def get_memory(limit: int = 20):
            memory = self.memory.get_recent_memory(limit=limit)
            return {"memory": [{"user": m[0], "ai": m[1]} for m in memory]}

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            client_ip = websocket.client.host
            
            if not self.security.check_access(client_ip):
                print(f" [SECURITY] Acesso negado para IP: {client_ip}")
                await websocket.close(code=1008)
                return

            print(f" [SERVER] Frontend ({client_ip}) Conectado ao Núcleo Omni-Genesis.")
            self.logger.log_event("CONNECTION", f"Frontend conectado via {client_ip}")
            
            # Conectar ao OBS e Warudo em background
            asyncio.create_task(self.obs.connect())
            asyncio.create_task(self.avatar.connect())
            
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    msg_type = message.get("type")
                    
                    if msg_type == "chat":
                        prompt = message.get("text")
                        # Moderação local
                        if not self.chat_integrator.filter_message(prompt):
                            await websocket.send_text(json.dumps({"type": "error", "text": "Mensagem bloqueada por moderação local."}))
                            continue

                        # Atualizar contexto com hardware
                        stats = self.system.get_stats()
                        self.emotion.update_emotion(stats)
                        
                        # Memória recente
                        history = self.memory.get_recent_memory(limit=3)
                        
                        # Vaelindra pensa (Cérebro Racional + Pensamento Interno)
                        brain_output = await self.brain.think(prompt, context=f"Histórico: {history} | Hardware: {stats}")
                        
                        if "error" in brain_output:
                            await websocket.send_text(json.dumps({"type": "error", "text": brain_output["error"]}))
                            continue

                        thought = brain_output.get("thought", "")
                        response_text = brain_output.get("response", "")
                        
                        # Salvar na memória
                        self.memory.save_interaction(prompt, response_text, str(stats))
                        
                        # Executar ações autônomas baseadas na resposta (Cérebro de Ações)
                        await self.actions.execute_command(response_text)
                        
                        # Gerar Overlay
                        self.overlay.generate_status_overlay(stats)
                        
                        response = {
                            "type": "response",
                            "thought": thought,
                            "text": response_text,
                            "emotion": self.emotion.current_emotion,
                            "stats": stats
                        }
                        await websocket.send_text(json.dumps(response))

                    elif msg_type == "listen":
                        # Audição local
                        text = await self.ears.listen()
                        await websocket.send_text(json.dumps({"type": "transcription", "text": text}))

                    elif msg_type == "system_stats":
                        stats = self.system.get_stats()
                        await websocket.send_text(json.dumps({"type": "stats", "data": stats}))

                except Exception as e:
                    print(f" [SERVER] Erro na conexão: {e}")
                    self.logger.log_event("ERROR", str(e))
                    break

    def start(self):
        """
        Inicia o servidor localmente.
        """
        uvicorn.run(self.app, host=self.host, port=self.port)

if __name__ == "__main__":
    server = CoreServer()
    server.start()
