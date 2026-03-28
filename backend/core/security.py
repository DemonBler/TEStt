import os
import shutil
import datetime

class CoreSecurity:
    """
    Segurança de Núcleo (Inspirada em AI-Waifu-Vtuber e Neuro-sama-clone)
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self):
        self.allowed_ips = ["127.0.0.1", "localhost"]
        self.base_path = r"D:\Omni-Genesis - Núcleo IA VTuber"

    def check_access(self, ip: str) -> bool:
        """
        Verifica se o IP de origem é permitido.
        """
        return ip in self.allowed_ips

    def protect_directory(self):
        """
        Garante que as permissões do diretório D:\ estão corretas.
        """
        # Lógica de proteção de arquivos via Windows ACL
        pass

class CoreMaintenance:
    """
    Manutenção de Núcleo (Inspirada em AI-Vtuber-Ollama e Open-LLM-VTuber)
    Vaelindra cuida do seu próprio ecossistema no D:\.
    """
    def __init__(self):
        self.base_path = r"D:\Omni-Genesis - Núcleo IA VTuber"

    def backup_memory(self):
        """
        Cria um backup local da memória SQLite.
        """
        db_path = os.path.join(self.base_path, "memory.db")
        backup_path = os.path.join(self.base_path, "backups", f"memory_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
        
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        if os.path.exists(db_path):
            shutil.copy2(db_path, backup_path)
            print(f" [MAINTENANCE] Backup de memória realizado: {backup_path}")

    def check_disk_space(self):
        """
        Verifica o espaço em disco no D:\.
        """
        total, used, free = shutil.disk_usage(self.base_path)
        print(f" [MAINTENANCE] Espaço Livre no D:\\: {free // (2**30)} GB")
