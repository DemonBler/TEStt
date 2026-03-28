import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

class LiveOverlay:
    """
    Sobreposições de Live (Inspiradas em AI-Waifu-Vtuber e Neuro-sama-clone)
    Vaelindra gera seus próprios overlays dinâmicos localmente.
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self, output_path=r"D:\Omni-Genesis - Núcleo IA VTuber\overlays\status.png"):
        self.output_path = output_path
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        self.width, self.height = 1920, 1080

    def generate_status_overlay(self, stats: dict):
        """
        Gera uma imagem de sobreposição com as estatísticas do sistema.
        """
        img = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Estética Extreme Canary: Neon Orange
        color = (242, 125, 38, 255)
        
        # Desenhar estatísticas no canto superior direito
        text = f"CPU: {stats['cpu']}% | RAM: {stats['ram']}% | GPU: {stats['gpu']}%"
        draw.text((1500, 50), text, fill=color)
        
        img.save(self.output_path)
        print(f" [OVERLAY] Sobreposição gerada: {self.output_path}")

class RenderingUtils:
    """
    Utilidades de Renderização (Inspiradas em Neuro-sama-clone)
    Vaelindra processa imagens e quadros de vídeo localmente via OpenCV.
    """
    def __init__(self):
        self.cv2 = cv2

    def process_frame(self, frame: np.ndarray):
        """
        Processa um quadro de vídeo localmente.
        """
        # Exemplo: Aplicar filtro neon
        gray = self.cv2.cvtColor(frame, self.cv2.COLOR_BGR2GRAY)
        edges = self.cv2.Canny(gray, 100, 200)
        return edges

    def save_frame(self, frame: np.ndarray, path: str):
        """
        Salva um quadro de vídeo localmente.
        """
        self.cv2.imwrite(path, frame)
        print(f" [RENDERING] Quadro salvo: {path}")
