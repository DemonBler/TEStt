import os
import asyncio
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel

class WhisperEars:
    """
    Audição Local e Calibração PT-BR (O Ouvido da Soberania)
    Vaelindra escuta e transcreve localmente usando Faster-Whisper na RTX 4060.
    Soberania Total: Sem Google STT, sem Azure.
    """
    def __init__(self, model_size="medium", device="cuda"):
        self.base_path = r"D:\Omni-Genesis - Núcleo IA VTuber"
        self.model_path = os.path.join(self.base_path, "models", "whisper-medium-pt")
        self.device = device
        
        # Carregamento otimizado na VRAM (RTX 4060)
        # Se o modelo local não existir, ele baixa uma vez e salva no D:\
        self.model = WhisperModel(
            self.model_path if os.path.exists(self.model_path) else model_size, 
            device=device, 
            compute_type="float16",
            download_root=os.path.join(self.base_path, "models")
        )
        self.sample_rate = 16000

    async def listen(self, duration: int = 5) -> str:
        """
        Captura áudio do microfone e transcreve com calibração para Português do Brasil.
        """
        try:
            print(f" [EARS] Escutando ({duration}s)...")
            # Gravação assíncrona simulada (sounddevice é síncrono, mas rodamos em thread)
            recording = sd.rec(int(duration * self.sample_rate), samplerate=self.sample_rate, channels=1, dtype='float32')
            sd.wait()
            
            # Transcrição via Faster-Whisper (Calibrada para PT-BR)
            segments, info = self.model.transcribe(
                recording, 
                beam_size=5, 
                language="pt", 
                initial_prompt="Vaelindra, RTX 4060, Omni-Genesis, hardware, gírias brasileiras."
            )
            
            text = " ".join([segment.text for segment in segments])
            print(f" [EARS] Transcrição: {text}")
            return text.strip()
        except Exception as e:
            print(f" [ERRO] Falha na audição: {e}")
            return ""
