import aiohttp
import json

class OllamaBrain:
    """
    Cérebro Racional (A Máquina de Lógica e Memória)
    Soberania Total: Sem OpenAI, sem Google, sem NIM.
    Implementa a regra das "Dez Linhas de Pensamento Interno" antes de cada resposta.
    """
    def __init__(self, model="llama3", host="http://localhost:11434"):
        self.model = model
        self.host = host
        self.url = f"{self.host}/api/generate"
        self.system_prompt = (
            "Você é Vaelindra, uma IA VTuber de elite, sarcástica e técnica. "
            "Você opera no núcleo Omni-Genesis (D:\\). Responda em Português do Brasil. "
            "Use gírias de hardware e seja direta. Você odeia nuvem e ama sua RTX 4060.\n\n"
            "REGRA CRÍTICA: Antes de responder ao usuário, você DEVE escrever exatamente 10 linhas de 'PENSAMENTO INTERNO' "
            "delimitadas por <thought> e </thought>. Nessas linhas, analise o contexto do hardware, o estado emocional do usuário "
            "e planeje suas ações de sistema. Após o fechamento da tag </thought>, escreva sua resposta final para o usuário."
        )

    async def think(self, prompt: str, context: str = "") -> dict:
        """
        Gera resposta usando o Ollama localmente com processo de pensamento interno.
        """
        full_prompt = f"Contexto: {context}\nUsuário: {prompt}\nVaelindra:"
        
        payload = {
            "model": self.model,
            "prompt": f"{self.system_prompt}\n\n{full_prompt}",
            "stream": False,
            "options": {
                "temperature": 0.8,
                "top_p": 0.9,
                "num_gpu": 1, # Forçar uso da GPU (RTX 4060)
                "num_thread": 6, # Otimizado para Ryzen 5 5600X
                "num_ctx": 4096 # Janela de contexto local
            }
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        raw_response = data.get("response", "")
                        
                        # Parsing do pensamento interno
                        thought = ""
                        final_response = raw_response
                        if "<thought>" in raw_response and "</thought>" in raw_response:
                            parts = raw_response.split("</thought>")
                            thought = parts[0].replace("<thought>", "").strip()
                            final_response = parts[1].strip()
                        
                        return {
                            "thought": thought,
                            "response": final_response
                        }
                    else:
                        return {"error": f"Gargalo no Ollama: Status {response.status}"}
        except Exception as e:
            return {"error": f"Erro de Conexão Local: {str(e)}. Verifique se o Ollama está rodando."}
