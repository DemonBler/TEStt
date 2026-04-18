import { pipeline, env } from '@xenova/transformers';

let visionPipeline: any = null;

export const loadVisionModel = async (onProgress?: (p: number) => void) => {
  if (visionPipeline) return visionPipeline;
  
  // Usando ViT-GPT2 localmente via WebGL/WASM para extração visual leve
  env.allowLocalModels = false;
  
  visionPipeline = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
    progress_callback: (data: any) => {
      if (data.status === 'progress' && onProgress) {
        onProgress(Math.round(data.progress));
      }
    }
  });
  return visionPipeline;
};

export const captionImageLocally = async (dataUrl: string) => {
  try {
    const model = await loadVisionModel();
    const result = await model(dataUrl);
    return result[0]?.generated_text || "";
  } catch (err) {
    console.error("Local Vision Error:", err);
    return "";
  }
};
