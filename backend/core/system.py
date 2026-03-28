import psutil
import platform
import GPUtil

class SystemAwareness:
    """
    Monitoramento de Hardware (Inspirado em Neuro-sama-clone)
    Vaelindra sabe exatamente o que está acontecendo com o Ryzen 5 5600X e a RTX 4060.
    """
    def __init__(self):
        self.cpu_name = platform.processor()
        try:
            self.gpu_name = GPUtil.getGPUs()[0].name if GPUtil.getGPUs() else "RTX 4060"
        except:
            self.gpu_name = "RTX 4060"

    def get_stats(self):
        """
        Retorna estatísticas reais de hardware.
        """
        try:
            gpus = GPUtil.getGPUs()
            gpu_load = gpus[0].load * 100 if gpus else 0
            gpu_temp = gpus[0].temperature if gpus else 0
            vram_util = gpus[0].memoryUtil * 100 if gpus else 0
        except:
            gpu_load = 0
            gpu_temp = 0
            vram_util = 0
        
        return {
            "cpu": psutil.cpu_percent(),
            "ram": psutil.virtual_memory().percent,
            "gpu": gpu_load,
            "temp": gpu_temp,
            "vram": vram_util
        }

    def get_cpu_name(self):
        return self.cpu_name
