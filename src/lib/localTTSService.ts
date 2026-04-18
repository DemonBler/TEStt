import { pipeline, env } from '@xenova/transformers';
import { useSovereignStore } from '../store';

// Kernel Optimization for Browser Sandbox
env.allowLocalModels = false;
env.useBrowserCache = true;

let ttsPipeline: any = null;

export const loadTTS = async (onProgress?: (p: number) => void) => {
  if (ttsPipeline) return ttsPipeline;
  
  useSovereignStore.getState().setTtsStatus('loading');
  try {
    // Using Xenova/mms-tts-por which is a high-quality VITS Neural Model for Portuguese
    ttsPipeline = await pipeline('text-to-speech', 'Xenova/mms-tts-por', {
      progress_callback: (data: any) => {
        if (data.status === 'progress' && onProgress) {
          onProgress(Math.round(data.progress));
        }
      }
    }).catch(err => {
      console.error("[TTS] Pipeline Initialization Error:", err);
      throw err;
    });
    useSovereignStore.getState().setTtsStatus('active');
  } catch(e) {
    useSovereignStore.getState().setTtsStatus('error');
    throw e;
  }
  return ttsPipeline;
};

export const generateLocalTTS = async (text: string) => {
  const cleanText = text.replace(/\[ACTION:[a-zA-Z0-9_]+\]/g, '').trim();
  const state = useSovereignStore.getState();

  // OVERRIDE: Assimilated GPT-SoVITS API Integration (from Riko Project architecture)
  if (state.useGptSovits && state.gptSovitsUrl) {
    try {
      const url = new URL(state.gptSovitsUrl);
      url.searchParams.append('text', cleanText);
      url.searchParams.append('text_lang', state.gptSovitsLang || 'pt');
      if (state.gptSovitsRefAudio) url.searchParams.append('ref_audio_path', state.gptSovitsRefAudio);
      if (state.gptSovitsPromptText) url.searchParams.append('prompt_text', state.gptSovitsPromptText);
      url.searchParams.append('prompt_lang', state.gptSovitsLang || 'pt');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("GPT-SoVITS API failed");
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return { type: 'audioBuffer', data: decodedBuffer };
    } catch (e) {
      console.error("GPT-SoVITS failed, falling back to MMS VITS", e);
    }
  }

  // DEFAULT: Native MMS-TTS
  const tts = await loadTTS();
  const output = await tts(cleanText);
  return { type: 'float32', data: output };
};

export const playAudioBuffer = (audioPayload: any, sampleRate: number = 16000) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioContext.createBufferSource();
  
  if (audioPayload.type === 'audioBuffer') {
      source.buffer = audioPayload.data;
  } else {
      // MMS float32 fallback
      const audioData = audioPayload.data.audio || audioPayload.data;
      const buffer = audioContext.createBuffer(1, audioData.length, sampleRate);
      buffer.getChannelData(0).set(audioData);
      source.buffer = buffer;
  }
  
  const analyser = audioContext.createAnalyser();
  // Higher resolution for better lip sync
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.4;
  
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  source.start();
  return { source, audioContext, analyser };
};
