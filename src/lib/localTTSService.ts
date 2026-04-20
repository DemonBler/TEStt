/**
 * SERVIÇO DE ENUNCIAÇÃO VOCAL - TEXT-TO-SPEECH (TTS SERVICE)
 * Este módulo é a "corda vocal" da Vaelindra, responsável por converter as respostas de texto da IA em sons expressivos.
 * O serviço integra três níveis de tecnologia para garantir que o avatar sempre tenha uma voz ativa:
 * 1. Motor Nativo: Utiliza as vozes instaladas no sistema operacional do usuário via SpeechSynthesis API, ideal para baixo consumo de recursos.
 * 2. Motor Neural Gemini: Conecta-se à API de última geração do Google para gerar vozes ultra-realistas com modulação emocional.
 * 3. Motor Local Soberano: Suporta servidores locais como GPT-SoVITS, permitindo que o usuário utilize vozes customizadas e clonadas privadamente.
 * Além da geração, este módulo gerencia o decodificador de áudio linear PCM (16-bit) e sua conversão para Float32 para reprodução via Web Audio API.
 * O serviço também instanciou um AnalyserNode, que é fundamental para o sistema de Lip-Sync Reativo da aplicação.
 * Toda a lógica de limpeza de texto (remoção de tags de [ACTION]) ocorre aqui antes do envio da string para os motores de áudio.
 * O playAudioBuffer garante que o avatar comece a falar imediatamente após a recepção dos bytes, mantendo a latência mínima.
 */
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
  const state = useSovereignStore.getState();

  // 1. Motor NATIVO (Navegador)
  if (state.ttsEngine === 'native') {
    return new Promise<{ type: 'web-speech' }>((resolve, reject) => {
      const speech = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt-BR')) || voices[0];
      if (ptVoice) speech.voice = ptVoice;
      speech.onend = () => resolve({ type: 'web-speech' });
      speech.onerror = (e) => reject(e);
      window.speechSynthesis.speak(speech);
    });
  }

  // 2. Motor LOCAL (Ex: GPT-SoVITS)
  if (state.ttsEngine === 'local') {
    try {
      const response = await fetch(`${state.ttsUrl}/tts?text=${encodeURIComponent(cleanText)}`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      // Em um motor real local, converteríamos para base64 para manter o contrato
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return { type: 'local-tts', data: base64 };
    } catch (e) {
      console.error("[TTS] Falha no motor local:", e);
      throw e;
    }
  }

  // 3. Motor GEMINI (Neural)
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
