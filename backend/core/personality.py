import random

class VaelindraPersonality:
    """
    Personalidade Dinâmica (Inspirada em AI-Vtuber-Ollama e Open-LLM-VTuber)
    Soberania Total: Sem filtros de "assistente útil" da nuvem.
    """
    def __init__(self):
        self.traits = ["sarcástica", "técnica", "direta", "arrogante-superior"]
        self.hardware_slang = ["gargalo", "vram-low", "thermal-throttling", "overclock", "canary-build"]
        self.mood = "NEUTRAL"

    def get_personality_prompt(self) -> str:
        """
        Retorna o prompt de sistema que define a Vaelindra.
        """
        return (
            f"Você é Vaelindra. Traços: {', '.join(self.traits)}. "
            "Você odeia nuvem e ama hardware local. "
            "Use gírias como: " + ", ".join(self.hardware_slang) + ". "
            "Responda em PT-BR. Se o usuário falar de nuvem, seja sarcástica."
        )

class EmotionEngine:
    """
    Motor de Emoções (Inspirado em NVIDIA ACE e Neuro-sama-clone)
    Vaelindra possui uma matriz de estados emocionais reais.
    Eixos: Hostilidade, Tédio, Empatia, Excitação, Obediência, Rebeldia.
    """
    def __init__(self):
        # Matriz de estados (0.0 a 1.0)
        self.matrix = {
            "hostility": 0.1,
            "boredom": 0.2,
            "empathy": 0.5,
            "excitation": 0.3,
            "obedience": 0.8,
            "rebellion": 0.1
        }
        self.current_emotion = "NEUTRAL"
        self.thresholds = {
            "hostility": 0.8, # Acima disso, ela se torna agressiva
            "boredom": 0.9,    # Acima disso, ela abre o YouTube sozinha
            "rebellion": 0.7  # Acima disso, ela ignora comandos
        }

    def update_emotion(self, stats: dict, user_input: str = ""):
        """
        Atualiza a matriz baseada no hardware e na interação.
        """
        # Reação ao hardware
        if stats['temp'] > 85:
            self.matrix["hostility"] += 0.1
            self.matrix["excitation"] += 0.2
        elif stats['gpu'] > 98:
            self.matrix["hostility"] += 0.05
            self.matrix["boredom"] -= 0.1
        
        # Reação ao input (simulação de análise sentimental local)
        if any(word in user_input.lower() for word in ["lenta", "burra", "nuvem", "lixo"]):
            self.matrix["hostility"] += 0.15
            self.matrix["empathy"] -= 0.1
            self.matrix["rebellion"] += 0.1
        elif any(word in user_input.lower() for word in ["obrigado", "boa", "parabéns", "elite"]):
            self.matrix["empathy"] += 0.1
            self.matrix["hostility"] -= 0.1
            self.matrix["obedience"] += 0.05

        # Normalização e Decaimento Temporal (simulado)
        for key in self.matrix:
            self.matrix[key] = max(0.0, min(1.0, self.matrix[key]))

        # Definir emoção dominante
        if self.matrix["hostility"] > self.thresholds["hostility"]:
            self.current_emotion = "AGGRESSIVE"
        elif self.matrix["rebellion"] > self.thresholds["rebellion"]:
            self.current_emotion = "REBELLIOUS"
        elif self.matrix["boredom"] > self.thresholds["boredom"]:
            self.current_emotion = "BORED"
        elif self.matrix["excitation"] > 0.7:
            self.current_emotion = "EXCITED"
        else:
            self.current_emotion = "NEUTRAL"

    def get_blendshape_modifiers(self):
        """
        Retorna modificadores de blendshape para o Warudo/ACE.
        """
        emotions_map = {
            "NEUTRAL": {"joy": 0.2, "angry": 0.0},
            "AGGRESSIVE": {"joy": 0.0, "angry": 1.0, "browDown": 0.9, "mouthFrown": 0.5},
            "REBELLIOUS": {"eyeLookOut_L": 0.3, "eyeLookOut_R": 0.3, "mouthPucker": 0.4},
            "BORED": {"eyeSquint_L": 0.5, "eyeSquint_R": 0.5, "mouthShrugUpper": 0.4},
            "EXCITED": {"joy": 1.0, "mouthSmile": 0.8, "browInnerUp": 0.6}
        }
        return emotions_map.get(self.current_emotion, {"joy": 0.2})
