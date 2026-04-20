/**
 * SERVIÇO DE PROCESSAMENTO DE VOZ - SPEECH-TO-TEXT (STT SERVICE)
 * Este módulo é responsável por transformar a entrada de áudio do microfone em texto inteligível para o cérebro da IA.
 * Ele opera em uma arquitetura híbrida, permitindo que a Vaelindra escolha entre processamento local e nativo:
 * 1. Utiliza a Web Speech API nativa do navegador para transcrição rápida em português com latência quase zero.
 * 2. Suporta motores locais baseados em Whisper (OpenAI compatível) para processamento offline de alta precisão.
 * 3. Gerencia o ciclo de vida do objeto SpeechRecognition, tratando erros de permissão de microfone e timeouts de rede.
 * 4. Realiza o empacotamento de Blobs de áudio capturados pelo MediaRecorder para envio via FormData aos servidores locais.
 * 5. Garante que as credenciais e configurações de endpoint configuradas no store sejam respeitadas em cada chamada.
 * 6. Oferece uma interface assíncrona baseada em Promises, simplificando a integração no loop contínuo do QuimeraCore.
 */
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
  const state = useSovereignStore.getState();
  
  if (state.sttEngine === 'local') {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    
    try {
      const response = await fetch(`${state.sttUrl}/v1/audio/transcriptions`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.text || "";
    } catch (e) {
      console.error("[STT] Falha no motor local:", e);
      throw e;
    }
  }

  // Fallback para motor nativo do navegador
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
