import { pipeline, env } from '@xenova/transformers';
import { useSovereignStore } from "../store";

// Otimização de Kernel para Ambiente de Browser / Sandbox
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

export const loadSTT = async (onProgress?: (progress: number) => void) => {
  if (transcriber) return transcriber;
  
  useSovereignStore.getState().setSttStatus('loading');
  try {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: (data: any) => {
          if (data.status === 'progress' && onProgress) {
              onProgress(Math.round(data.progress));
          }
      }
    }).catch(err => {
      console.error("[STT] Pipeline Initialization Error:", err);
      throw err;
    });
    useSovereignStore.getState().setSttStatus('active');
  } catch(e) {
    useSovereignStore.getState().setSttStatus('error');
    throw e;
  }
  return transcriber;
};

export const transcribeLocally = async (audioBlob: Blob) => {
  if (!transcriber) await loadSTT();
  
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Whisper expects 16kHz mono float32
  const float32Data = audioBuffer.getChannelData(0);
  
  const result = await transcriber(float32Data, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'portuguese',
    task: 'transcribe',
  });
  
  return result.text;
};
