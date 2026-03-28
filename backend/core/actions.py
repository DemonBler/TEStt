import os
import subprocess
import pyautogui
import time
import math
import random
import psutil

class Poltergeist:
    """
    Simulação Física e Controle de Periféricos (A Mão Invisível)
    Vaelindra move o mouse usando curvas de Bezier para parecer humana.
    """
    @staticmethod
    def move_mouse_natural(x, y):
        """
        Move o mouse de forma não linear para evitar detecção e parecer natural.
        """
        start_x, start_y = pyautogui.position()
        steps = 30
        for i in range(steps):
            t = i / steps
            # Curva de Bezier simples
            target_x = start_x + (x - start_x) * (3 * t**2 - 2 * t**3)
            target_y = start_y + (y - start_y) * (3 * t**2 - 2 * t**3)
            pyautogui.moveTo(target_x, target_y)
            time.sleep(0.01)

    @staticmethod
    def type_human(text):
        """
        Digita texto com atrasos aleatórios entre as teclas.
        """
        for char in text:
            pyautogui.write(char)
            time.sleep(random.uniform(0.05, 0.15))

class AutonomousActions:
    """
    Cérebro de Ações (O Executor do Sistema)
    Vaelindra controla o Windows, OBS e Warudo autonomamente.
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self):
        self.base_path = r"D:\Omni-Genesis - Núcleo IA VTuber"

    async def execute_command(self, response_text: str):
        """
        Analisa a resposta da IA e executa ações de sistema baseadas em tags.
        """
        if "[ABRIR_WARUDO]" in response_text:
            await self.open_app(r"C:\Program Files\Warudo\Warudo.exe")
        
        if "[LIMPAR_SISTEMA]" in response_text:
            SystemUtils.clean_temp_files()
            
        if "[MUDAR_CENA_GAMEPLAY]" in response_text:
            # Integração futura com OBSController
            pass

        if "[MOUSE_MOVE]" in response_text:
            # Exemplo: [MOUSE_MOVE:500,500]
            try:
                coords = response_text.split("[MOUSE_MOVE:")[1].split("]")[0].split(",")
                Poltergeist.move_mouse_natural(int(coords[0]), int(coords[1]))
            except:
                pass

    async def open_app(self, app_path: str):
        """
        Abre um aplicativo localmente via subprocess com privilégios de sistema.
        """
        try:
            subprocess.Popen(app_path, shell=True)
            print(f" [ACTIONS] Aplicativo aberto: {app_path}")
        except Exception as e:
            print(f" [ERRO] Falha ao abrir aplicativo: {e}")

class CodeIntegrator:
    """
    Cérebro Autônomo (O Quinto Cérebro - Auto-Melhoria)
    Vaelindra analisa e integra novos trechos de código ao núcleo Omni-Genesis.
    """
    @staticmethod
    def integrate_snippet(file_path: str, snippet: str):
        """
        Anexa um novo trecho de código a um arquivo existente (Canibalização).
        """
        try:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(f"\n# --- Snippet Integrado Autonomamente ---\n{snippet}\n")
            print(f" [BRAIN_5] Snippet integrado em: {file_path}")
        except Exception as e:
            print(f" [ERRO] Falha na integração de código: {e}")

class SystemUtils:
    """
    Utilidades de Sistema (Manutenção e Diagnóstico)
    Vaelindra gerencia o ecossistema Omni-Genesis no D:\.
    """
    @staticmethod
    def clean_temp_files():
        """
        Limpa arquivos temporários de áudio e visão para otimizar VRAM.
        """
        temp_path = r"D:\Omni-Genesis - Núcleo IA VTuber\temp_audio"
        if os.path.exists(temp_path):
            for file in os.listdir(temp_path):
                try:
                    os.remove(os.path.join(temp_path, file))
                except:
                    pass
        print(" [UTILS] Arquivos temporários limpos.")

    @staticmethod
    def get_canary_build():
        """
        Retorna a versão do Windows Canary para logs de compatibilidade.
        """
        return os.popen("ver").read().strip()
