import { GoogleGenAI } from "@google/genai";

export class LocalAIService {
  private static OLLAMA_URL = "http://localhost:11434/api/generate";
  private static WHISPER_URL = "http://localhost:5000/transcribe"; // Placeholder for local Whisper API
  private static PIPER_URL = "http://localhost:5001/speak"; // Placeholder for local Piper API
  private static ACE_URL = "localhost:50051"; // gRPC for NVIDIA Audio2Face

  static async generateResponse(prompt: string, model: string = "llama3"): Promise<string> {
    try {
      const response = await fetch(this.OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `Você é Vaelindra, uma IA VTuber de elite, sarcástica, técnica e direta. Responda em Português do Brasil. Use gírias de hardware e termos de insider. Prompt: ${prompt}`,
          stream: false
        })
      });

      if (!response.ok) throw new Error("Ollama offline");
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.warn("[OMNI-GENESIS] Ollama falhou, tentando fallback seguro (Gemini)...");
      // Fallback to Gemini if local fails (simulating "cloud as a last resort" or just erroring)
      return this.cloudFallback(prompt);
    }
  }

  private static async cloudFallback(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return "ERRO: Núcleo local offline e nenhuma chave de nuvem configurada.";
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `[MODO_FALLBACK_NUVEM] Você é Vaelindra, uma IA VTuber de elite. Responda em PT-BR: ${prompt}`,
    });
    return response.text || "Sem resposta.";
  }

  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Simulating local Faster-Whisper call
    console.log("[OMNI-GENESIS] Transcrevendo áudio localmente via Faster-Whisper...");
    return "Transcrição local simulada (PT-BR).";
  }

  static async speakText(text: string): Promise<ArrayBuffer | null> {
    // Simulating local Piper TTS call
    console.log("[OMNI-GENESIS] Gerando fala localmente via Piper TTS (.onnx)...");
    return null;
  }

  static async syncAudio2Face(audioBuffer: ArrayBuffer): Promise<void> {
    // Simulating gRPC bridge to NVIDIA Audio2Face
    console.log("[OMNI-GENESIS] Sincronizando áudio com blendshapes (NVIDIA ACE)...");
  }

  static async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      return response.ok;
    } catch {
      return false;
    }
  }
}
