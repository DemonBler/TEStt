import { useSovereignStore } from '../store';
import { GoogleGenAI, Modality } from "@google/genai";

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

export const loadTTS = async (onProgress?: (p: number) => void) => {
  if (onProgress) onProgress(100);
  useSovereignStore.getState().setTtsStatus('active');
  return true;
};

export const generateLocalTTS = async (text: string) => {
  const cleanText = text.replace(/\[ACTION:[a-zA-Z0-9_]+\]/g, '').trim();
  
  if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              // Escolhendo 'Kore' por ser uma voz equilibrada, mas o usuário pode preferir outras
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Falha ao gerar áudio neural.");

    return { type: 'gemini-tts', data: base64Audio };
  } catch (error) {
    console.error("[TTS] Erro Gemini Voice:", error);
    throw error;
  }
};

export const playAudioBuffer = (audioPayload: any) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
  }

  const base64 = audioPayload.data;
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Int16Array(len / 2);
  
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
  }

  // Convert linear16 PCM to float32 for AudioBuffer
  const floatData = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    floatData[i] = bytes[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, floatData.length, 24000);
  buffer.copyToChannel(floatData, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  source.connect(analyser!);
  analyser!.connect(audioContext.destination);
  
  source.start(0);

  return { source, analyser: analyser! };
};
