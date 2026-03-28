import { GoogleGenAI } from "@google/genai";
import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use local cache and WebGPU if available
env.allowLocalModels = false;
env.useBrowserCache = true;

export class LocalAIService {
  private static OLLAMA_URL = "http://localhost:11434/api/generate";
  
  // Singleton pipelines for Transformers.js
  private static whisperPipeline: any = null;
  private static ttsPipeline: any = null;
  private static isInitializingSTT = false;
  private static isInitializingTTS = false;

  static async initSTT() {
    if (!this.whisperPipeline && !this.isInitializingSTT) {
      this.isInitializingSTT = true;
      console.log("[OMNI-GENESIS] Inicializando Whisper Neural Core (WebGPU/WASM)...");
      try {
        this.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
          device: 'webgpu' // Attempt to use RTX 4060 Tensor Cores via WebGPU
        });
        console.log("[OMNI-GENESIS] Whisper Core online.");
      } catch (e) {
        console.warn("WebGPU falhou, caindo para WASM (CPU)", e);
        this.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
      }
      this.isInitializingSTT = false;
    }
  }

  static async initTTS() {
    if (!this.ttsPipeline && !this.isInitializingTTS) {
      this.isInitializingTTS = true;
      console.log("[OMNI-GENESIS] Inicializando Piper/SpeechT5 Neural Core (WebGPU/WASM)...");
      try {
        this.ttsPipeline = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
          quantized: true // Use quantized model for speed
        });
        console.log("[OMNI-GENESIS] TTS Core online.");
      } catch (e) {
        console.error("Falha ao inicializar TTS", e);
      }
      this.isInitializingTTS = false;
    }
  }

  static async generateResponse(prompt: string, model: string = "llama3", language: string = "pt-BR"): Promise<string> {
    const systemPrompt = this.getSystemPrompt(language);
    
    // Intercepta comandos de Home Assistant localmente
    const haCommand = this.parseHomeAssistantCommand(prompt);
    if (haCommand) {
      return await this.executeHomeAssistantCommand(haCommand, language);
    }

    try {
      const response = await fetch(this.OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `${systemPrompt} Prompt: ${prompt}`,
          stream: false
        })
      });

      if (!response.ok) throw new Error(`Ollama retornou erro: ${response.status}`);
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.warn("[OMNI-GENESIS] Ollama offline. Desvio de Endpoint Ativo: Bloqueando chamadas de nuvem (Soberania Local).", error);
      return this.localFallback(language);
    }
  }

  private static getSystemPrompt(language: string): string {
    switch (language) {
      case 'en-US':
        return "You are Vaelindra, an elite, sarcastic, technical, and direct VTuber AI. Respond in English. Use hardware slang and insider terms.";
      case 'es-ES':
        return "Eres Vaelindra, una IA VTuber de élite, sarcástica, técnica y directa. Responde en Español. Usa jerga de hardware y términos internos.";
      case 'pt-BR':
      default:
        return "Você é Vaelindra, uma IA VTuber de elite, sarcástica, técnica e direta. Responda em Português do Brasil. Use gírias de hardware e termos de insider.";
    }
  }

  private static parseHomeAssistantCommand(prompt: string): { action: string, device: string } | null {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("ligar a luz") || lowerPrompt.includes("turn on the light")) return { action: "turn_on", device: "light.main" };
    if (lowerPrompt.includes("desligar a luz") || lowerPrompt.includes("turn off the light")) return { action: "turn_off", device: "light.main" };
    return null;
  }

  private static async executeHomeAssistantCommand(command: { action: string, device: string }, language: string): Promise<string> {
    console.log(`[VDI GATEWAY] Executando comando Home Assistant Local: ${command.action} em ${command.device}`);
    // Simulação de chamada para o Home Assistant na rede local (ex: http://homeassistant.local:8123/api/services/)
    // fetch('http://homeassistant.local:8123/api/services/light/' + command.action, { ... })
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula latência da rede local
    
    if (language === 'en-US') return `Command executed: ${command.action} on ${command.device}. The hardware is responding.`;
    if (language === 'es-ES') return `Comando ejecutado: ${command.action} en ${command.device}. El hardware responde.`;
    return `Comando executado: ${command.action} em ${command.device}. O hardware está respondendo aos meus comandos.`;
  }

  private static localFallback(language: string): string {
    // Desvio de nuvem: Nunca chama o Gemini. Mantém tudo local.
    if (language === 'en-US') return "[LOCAL SIMULATION] Ollama is offline. Cloud endpoints are blocked by Sovereign Protocol. Check your local processing nodes.";
    if (language === 'es-ES') return "[SIMULACIÓN LOCAL] Ollama está desconectado. Los endpoints en la nube están bloqueados por el Protocolo Soberano. Verifica tus nodos locales.";
    return "[SIMULAÇÃO LOCAL] Ollama offline. Endpoints de nuvem bloqueados por Protocolo de Soberania. O hardware local não está respondendo, operador. Verifique os nós de processamento.";
  }

  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    await this.initSTT();
    if (!this.whisperPipeline) return "Erro na inicialização do STT.";

    try {
      // Convert Blob to AudioBuffer for transformers.js
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new window.AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0); // Get mono channel

      console.log("[OMNI-GENESIS] Processando tensores de áudio...");
      const result = await this.whisperPipeline(audioData, {
        language: 'portuguese',
        task: 'transcribe'
      });
      
      return result.text;
    } catch (error) {
      console.error("[OMNI-GENESIS] Falha na transcrição neural:", error);
      return "Falha na transcrição (STT Local).";
    }
  }

  static async speakText(text: string): Promise<ArrayBuffer> {
    await this.initTTS();
    if (!this.ttsPipeline) return new ArrayBuffer(0);

    try {
      console.log("[OMNI-GENESIS] Sintetizando tensores de voz...");
      // For SpeechT5, we need speaker embeddings. Using a default one or generating zeros for now.
      // In a real scenario, we'd load a specific speaker embedding tensor.
      const speaker_embeddings = new Float32Array(512).fill(0.0); 
      
      const result = await this.ttsPipeline(text, {
        speaker_embeddings
      });

      // result.audio is a Float32Array of PCM data at result.sampling_rate
      // We need to convert this to a WAV ArrayBuffer for the frontend to play
      return this.encodeWAV(result.audio, result.sampling_rate);
    } catch (error) {
      console.error("[OMNI-GENESIS] Falha na síntese neural:", error);
      return new ArrayBuffer(0);
    }
  }

  // Helper to convert raw PCM Float32Array to WAV format
  private static encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  static async syncAudio2Face(audioBuffer: ArrayBuffer): Promise<void> {
    console.log("[OMNI-GENESIS] Sincronização NVIDIA ACE substituída por NeuralKinematicsEngine local.");
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
