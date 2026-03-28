import sqlite3
import json
import os

class LocalMemory:
    """
    Memória Local (Inspirada em AI-Waifu-Vtuber e Neuro-sama-clone)
    Soberania Total: Sem Pinecone, sem MongoDB Atlas.
    """
    def __init__(self, db_path=r"D:\Omni-Genesis - Núcleo IA VTuber\memory.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """
        Inicializa o banco de dados SQLite local.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_msg TEXT,
                ai_msg TEXT,
                context TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def save_interaction(self, user_msg: str, ai_msg: str, context: str = ""):
        """
        Salva a interação na memória de longo prazo.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO interactions (user_msg, ai_msg, context) VALUES (?, ?, ?)', 
                       (user_msg, ai_msg, context))
        conn.commit()
        conn.close()

    def get_recent_memory(self, limit=5):
        """
        Recupera as últimas interações para manter o contexto.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT user_msg, ai_msg FROM interactions ORDER BY timestamp DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return rows

class ChatIntegrator:
    """
    Integração de Chat (Inspirado em AI-Vtuber-Ollama e Open-LLM-VTuber)
    Soberania Total: Sem APIs pagas de moderação.
    """
    def __init__(self, platform="Twitch"):
        self.platform = platform
        self.banned_words = ["nuvem", "cloud", "openai", "google"] # Vaelindra odeia esses termos

    def filter_message(self, message: str) -> bool:
        """
        Moderação local de mensagens.
        """
        for word in self.banned_words:
            if word in message.lower():
                return False
        return True

    async def fetch_messages(self):
        """
        Busca mensagens do chat via WebSocket local (ex: Twitch IRC).
        """
        # Lógica de conexão IRC local
        pass
