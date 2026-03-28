import obsws_python as obs
import base64
from io import BytesIO

class OBSController:
    """
    Controle de Live e Orquestração de Cena (O Olho do Diretor)
    Vaelindra controla o OBS autonomamente para mudar o clima da live.
    Soberania Total: Sem chaves de nuvem, sem serviços externos.
    """
    def __init__(self, host="localhost", port=4455, password=""):
        self.host = host
        self.port = port
        self.password = password
        self.cl = None

    async def connect(self):
        """
        Conecta ao OBS via WebSocket local (Porta 4455 padrão).
        """
        try:
            self.cl = obs.ReqClient(host=self.host, port=self.port, password=self.password)
            print(" [OBS] Conectado ao OBS Studio (Websocket v5).")
        except Exception as e:
            print(f" [OBS] Falha na conexão: {e}. Verifique se o Websocket está ativo no OBS.")

    async def change_scene(self, scene_name: str):
        """
        Muda a cena do OBS autonomamente baseado no contexto da live.
        """
        if self.cl:
            try:
                self.cl.set_current_program_scene(scene_name)
                print(f" [OBS] Cena alterada para: {scene_name}")
            except Exception as e:
                print(f" [ERRO] Falha ao mudar cena: {e}")

    async def toggle_filter(self, source_name: str, filter_name: str, enabled: bool):
        """
        Ativa ou desativa filtros (ex: Filtro de Cor para emoção 'Hostil').
        """
        if self.cl:
            try:
                self.cl.set_source_filter_enabled(source_name, filter_name, enabled)
                print(f" [OBS] Filtro '{filter_name}' em '{source_name}' -> {enabled}")
            except Exception as e:
                print(f" [ERRO] Falha ao alternar filtro: {e}")

    async def get_screenshot(self, source_name: str = "Game Capture"):
        """
        Captura um frame do OBS para o Cérebro de Visão analisar.
        """
        if self.cl:
            try:
                response = self.cl.get_source_screenshot(source_name, "png")
                img_data = response.image_data
                # Retorna base64 para processamento local
                return img_data
            except Exception as e:
                print(f" [ERRO] Falha na captura de tela: {e}")
                return None
