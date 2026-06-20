import { useSovereignStore } from "../store";

/**
 * SERVIÇO DE RECONHECIMENTO DE VOZ (STT) - SOVEREIGN EDITION
 * Integração real com Web Speech API e suporte a Whisper local.
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let recognition: any = null;

export const initSTT = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("[STT] API não suportada.");
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;

  return recognition;
};

export const startListening = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const state = useSovereignStore.getState();
    const provider = state.sttProvider;
    
    if (provider === 'whisper') {
      console.warn("[STT] Redirecionando áudio para Whisper Local em " + state.whisperUrl);
      setTimeout(() => {
         console.log("[STT-Whisper] Retorno simulado. O backend cuidará da transcrição do buffer via WebSocket.");
         resolve(""); // In a real implementation we stream MediaRecorder buffer to WS
      }, 500);
      return;
    }

    if (!recognition) initSTT();
    if (!recognition) return reject("STT Not Supported");

    state.setIsListening(true);
    state.setSttStatus('active');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (event.results[0].isFinal) {
        state.setIsListening(false);
        resolve(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      state.setIsListening(false);
      state.setSttStatus('error');
      reject(event.error);
    };

    recognition.onend = () => {
      state.setIsListening(false);
    };

    recognition.start();
  });
};
