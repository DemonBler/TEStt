import { useSovereignStore } from "../store";

/**
 * SERVIÇO DE SÍNTESE DE VOZ (TTS) - SOVEREIGN EDITION
 * Suporta motores locais (GPT-SoVITS / Piper) e nativos do navegador.
 */

export const generateLocalTTS = async (text: string): Promise<ArrayBuffer> => {
  const state = useSovereignStore.getState();
  state.setTtsStatus('loading');

  if (state.ttsEngine === 'local') {
    try {
      const response = await fetch(`${state.ttsUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: "Vaelindra" })
      });
      const buffer = await response.arrayBuffer();
      state.setTtsStatus('active');
      return buffer;
    } catch (e) {
      console.error("[TTS] Local Engine Failure:", e);
      state.setTtsStatus('error');
    }
  }

  // Fallback: Silently handled by playAudioBuffer for native
  state.setTtsStatus('active');
  return new ArrayBuffer(0);
};

export const playAudioBuffer = async (text: string, buffer?: ArrayBuffer) => {
  const state = useSovereignStore.getState();
  
  if (buffer && buffer.byteLength > 0) {
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = await audioContext.decodeAudioData(buffer);
    source.connect(audioContext.destination);
    
    source.onended = () => {
      state.setIsPlaying(false);
      state.setMouthLevel(0);
    };

    state.setIsPlaying(true);
    source.start();
    
    // Simple mock for lip-sync during playback
    const interval = setInterval(() => {
      if (!state.isPlaying) {
        clearInterval(interval);
        return;
      }
      state.setMouthLevel(Math.random() * 0.5 + 0.3);
    }, 100);
    
  } else {
    // Native Speech Synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    
    utterance.onstart = () => state.setIsPlaying(true);
    utterance.onend = () => {
      state.setIsPlaying(false);
      state.setMouthLevel(0);
    };

    // Native LipSync proxy
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
         state.setMouthLevel(Math.random() * 0.5 + 0.3);
      } else {
         clearInterval(interval);
         state.setMouthLevel(0);
      }
    }, 80);

    window.speechSynthesis.speak(utterance);
  }
};
