import os
import json
import asyncio
import grpc

class DataBridge:
    """
    Ponte de Dados e Orquestração Pentárquica (O Sistema Circulatório)
    Gerencia a comunicação entre os 5 cérebros (Racional, Emocional, Ações, Animação, Autônomo).
    Implementa o MCP (Model Context Protocol) para troca de estado local.
    """
    def __init__(self):
        self.brains_state = {
            "rational": {},
            "emotional": {},
            "actions": {},
            "animation": {},
            "autonomous": {}
        }

    async def sync_brains(self, source: str, data: dict):
        """
        Sincroniza o estado de um cérebro com os outros (MCP Local).
        """
        if source in self.brains_state:
            self.brains_state[source].update(data)
            # print(f" [BRIDGE] Estado sincronizado: {source}")
            
    def get_global_context(self):
        """
        Retorna o estado consolidado de todos os cérebros para o Ollama.
        """
        return json.dumps(self.brains_state)

class VoiceUtils:
    """
    Utilidades de Voz e Processamento de Sinal (O Ouvido Interno)
    Vaelindra processa seu próprio áudio via FFmpeg local para Audio2Face.
    """
    def __init__(self):
        self.ffmpeg_path = "ffmpeg" # Deve estar no PATH do Windows Canary

    def convert_for_ace(self, input_path: str, output_path: str):
        """
        Converte áudio para o formato gRPC do Audio2Face (PCM 16-bit, 16kHz, Mono).
        """
        try:
            command = f"{self.ffmpeg_path} -i {input_path} -acodec pcm_s16le -ar 16000 -ac 1 {output_path} -y"
            subprocess.run(command, shell=True, check=True, capture_output=True)
            return True
        except Exception as e:
            print(f" [ERRO] Falha na conversão para ACE: {e}")
            return False

    def play_local(self, audio_path: str):
        """
        Reproduz áudio localmente via ffplay (Soberania Total).
        """
        try:
            command = f"ffplay -nodisp -autoexit -loglevel quiet {audio_path}"
            subprocess.Popen(command, shell=True)
        except Exception as e:
            print(f" [ERRO] Falha na reprodução local: {e}")
