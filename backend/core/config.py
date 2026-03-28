import yaml
import os
import logging

class ConfigManager:
    """
    Configuração Centralizada (Inspirada em AI-Vtuber-Ollama e Open-LLM-VTuber)
    Soberania Total: Sem chaves de nuvem, sem segredos externos.
    """
    def __init__(self, config_path=r"D:\Omni-Genesis - Núcleo IA VTuber\config.yaml"):
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self):
        """
        Carrega o arquivo YAML local.
        """
        if not os.path.exists(self.config_path):
            # Configuração padrão soberana
            default_config = {
                "brain": {"model": "llama3", "host": "http://localhost:11434"},
                "ears": {"model_size": "small", "device": "cuda"},
                "mouth": {"voice": "pt_BR-fabiana-medium.onnx"},
                "face": {"grpc_url": "localhost:50051"},
                "obs": {"host": "localhost", "port": 4455, "password": ""},
                "system": {"base_path": r"D:\Omni-Genesis - Núcleo IA VTuber"}
            }
            with open(self.config_path, 'w') as f:
                yaml.dump(default_config, f)
            return default_config
        
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

class ConsciousnessLogger:
    """
    Log de Consciência (Inspirado em Neuro-sama-clone)
    Vaelindra monitora seu próprio barramento de dados.
    """
    def __init__(self, log_path=r"D:\Omni-Genesis - Núcleo IA VTuber\consciousness.log"):
        logging.basicConfig(
            filename=log_path,
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        self.logger = logging.getLogger("Omni-Genesis")

    def log_event(self, event_type: str, message: str):
        """
        Registra um evento de consciência.
        """
        self.logger.info(f"{event_type}: {message}")
        print(f" [LOG] {event_type}: {message}")
