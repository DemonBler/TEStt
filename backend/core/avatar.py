import json
import asyncio
import websockets
import random

class AvatarController:
    """
    Controle de Avatar e Orquestração de Movimento (O Corpo Digital)
    Vaelindra controla seu avatar no Warudo via WebSocket local.
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self, host="localhost", port=19190):
        self.host = host
        self.port = port
        self.uri = f"ws://{self.host}:{self.port}"
        self.socket = None

    async def connect(self):
        """
        Conecta ao Warudo via WebSocket local (Porta 19190 padrão).
        """
        try:
            self.socket = await websockets.connect(self.uri)
            print(f" [AVATAR] Conectado ao Warudo: {self.uri}")
        except Exception as e:
            print(f" [ERRO] Falha na conexão Warudo: {e}. Verifique se o Warudo está aberto.")

    async def send_blendshapes(self, blendshapes: dict):
        """
        Envia blendshapes para o Warudo animar o avatar em tempo real.
        """
        if self.socket:
            try:
                payload = {
                    "type": "blendshapes",
                    "data": blendshapes
                }
                await self.socket.send(json.dumps(payload))
            except Exception as e:
                print(f" [ERRO] Falha ao enviar blendshapes: {e}")

    async def trigger_expression(self, expression_name: str):
        """
        Ativa expressões pré-definidas no Warudo (ex: 'Angry', 'Happy').
        """
        if self.socket:
            try:
                payload = {
                    "type": "expression",
                    "data": {"name": expression_name}
                }
                await self.socket.send(json.dumps(payload))
                print(f" [AVATAR] Expressão ativada: {expression_name}")
            except Exception as e:
                print(f" [ERRO] Falha ao ativar expressão: {e}")

class AvatarPhysics:
    """
    Motor de Física e Animação Procedural (O Sistema Nervoso)
    Vaelindra calcula suas próprias físicas de blendshape localmente.
    """
    def __init__(self):
        self.current_blendshapes = {}

    def calculate_mouth_physics(self, audio_level: float):
        """
        Calcula blendshapes de boca baseados no nível de áudio (Lip Sync).
        """
        mouth_open = min(1.0, audio_level * 5.0)
        self.current_blendshapes = {
            "mouthOpen": mouth_open,
            "mouthFunnel": mouth_open * 0.5,
            "jawOpen": mouth_open * 0.8
        }
        return self.current_blendshapes

    def get_idle_animation(self):
        """
        Gera animações ociosas (ex: piscar, micro-movimentos).
        """
        blink = 1.0 if random.random() > 0.98 else 0.0
        return {
            "eyeBlinkLeft": blink,
            "eyeBlinkRight": blink,
            "headTilt": (random.random() - 0.5) * 0.1
        }
