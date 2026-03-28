import os
import asyncio
import time
import json
from core.brain import OllamaBrain
from core.ears import WhisperEars
from core.mouth import PiperMouth
from core.face import ACEBridge
from core.system import SystemAwareness
from core.obs import OBSController
from core.vision import VisionLocal
from core.chat import ChatIntegrator, LocalMemory
from core.personality import VaelindraPersonality, EmotionEngine
from core.actions import AutonomousActions, SystemUtils

class OmniGenesisCore:
    def __init__(self):
        print("\n [OMNI-GENESIS] --- INICIANDO FUSÃO DE DNA SOBERANA ---")
        self.base_path = r"D:\Omni-Genesis - Núcleo IA VTuber"
        
        # 1. Motores de Inteligência e Sentidos (100% Locais)
        self.brain = OllamaBrain(model="llama3")
        self.ears = WhisperEars(model_size="small", device="cuda")
        self.mouth = PiperMouth()
        
        # 2. Motores Visuais e de Animação
        self.face = ACEBridge()
        self.vision = VisionLocal()
        
        # 3. Orquestração e Memória
        self.memory = LocalMemory()
        self.personality = VaelindraPersonality()
        self.emotions = EmotionEngine()
        
        # 4. Controle de Ambiente e Sistema
        self.system = SystemAwareness()
        self.obs = OBSController()
        self.actions = AutonomousActions()
        self.utils = SystemUtils()
        
        self.is_running = True

    async def initialize(self):
        """
        Sequência de Boot 'God Mode'
        """
        print(" [BOOT] Verificando integridade do D:\\Omni-Genesis...")
        self.utils.clean_temp_files()
        await self.obs.connect()
        print(" [BOOT] Núcleo Vaelindra pronto para operação.")

    async def interaction_cycle(self):
        """
        Ciclo de Consciência: Ouve -> Pensa -> Sente -> Fala -> Age
        """
        while self.is_running:
            try:
                # A. Audição: Captura áudio e transcreve via Faster-Whisper
                user_input = await self.ears.listen()
                
                if user_input:
                    print(f"\n [USER] {user_input}")
                    
                    # B. Contexto: Pega status do hardware e memória recente
                    stats = self.system.get_stats()
                    recent_memory = self.memory.get_recent_memory(limit=3)
                    
                    # C. Emoção: Reage ao hardware (RTX 4060 / Ryzen 5600X)
                    self.emotions.update_emotion(stats)
                    emotion_context = f"Emoção atual: {self.emotions.current_emotion}"
                    
                    # D. Cérebro: Gera resposta via Ollama (Llama 3)
                    # Fusão: Combina Personalidade + Memória + Hardware
                    prompt = f"Memória: {recent_memory}\n{emotion_context}\nUsuário: {user_input}"
                    response = await self.brain.think(prompt, f"Hardware: {stats}")
                    
                    print(f" [VAELINDRA] {response}")
                    
                    # E. Fala e Face: Gera áudio via Piper e anima via ACE
                    audio_path = await self.mouth.generate_speech(response)
                    await self.face.animate(audio_path)
                    
                    # F. Memória: Salva a interação localmente (SQLite)
                    self.memory.save_interaction(user_input, response, str(stats))
                    
                    # G. Ações: Executa comandos de sistema se necessário
                    await self.actions.execute_command(response)

                # Pequena pausa para não sobrecarregar o Ryzen 5600X
                await asyncio.sleep(0.1)

            except Exception as e:
                print(f" [ERRO] Falha no ciclo de consciência: {e}")
                await asyncio.sleep(2)

    def stop(self):
        self.is_running = False
        print("\n [OMNI-GENESIS] Encerrando Núcleo e salvando estado...")

async def main():
    core = OmniGenesisCore()
    await core.initialize()
    try:
        await core.interaction_cycle()
    except KeyboardInterrupt:
        core.stop()

if __name__ == "__main__":
    asyncio.run(main())
