import os
import pyautogui
import base64
from io import BytesIO
from PIL import Image

class VisionLocal:
    """
    Visão Local (Inspirada em Neuro-sama-clone)
    Vaelindra "vê" o que está acontecendo na tela do Windows Canary.
    """
    def __init__(self):
        self.screenshot_path = r"D:\Omni-Genesis - Núcleo IA VTuber\temp_vision\screenshot.png"
        os.makedirs(os.path.dirname(self.screenshot_path), exist_ok=True)

    async def capture_screen(self) -> str:
        """
        Captura a tela e retorna o base64 para o Ollama analisar.
        """
        screenshot = pyautogui.screenshot()
        screenshot.save(self.screenshot_path)
        
        # Converter para Base64 para o Ollama (Llava/Llama 3 Vision)
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
