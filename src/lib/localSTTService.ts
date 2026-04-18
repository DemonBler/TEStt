import { useSovereignStore } from "../store";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let recognition: any = null;

export const loadSTT = async (onProgress?: (progress: number) => void) => {
  // Web Speech API is native, no loading needed.
  if (onProgress) onProgress(100);
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
      console.error("[STT] Web Speech API não suportada neste navegador.");
      useSovereignStore.getState().setSttStatus('error');
      throw new Error("Web Speech API not supported");
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;

  useSovereignStore.getState().setSttStatus('active');
  return recognition;
};

export const transcribeLocally = async (audioBlob: Blob): Promise<string> => {
  // In native API flow, transcribing via blob isn't how it works.
  // We need to return an interface that enables events.
  return new Promise((resolve, reject) => {
    if (!recognition) {
       reject("Recognition not initialized");
       return;
    }
    
    recognition.onresult = (event: any) => {
       const transcript = event.results[0][0].transcript;
       resolve(transcript);
    };
    
    recognition.onerror = (event: any) => {
       reject(event.error);
    };
    
    recognition.start();
  });
};
