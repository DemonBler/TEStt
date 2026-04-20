/**
 * SERVIÇO DE PERCEPÇÃO VISUAL - LOCAL VISION SERVICE (COMPUTER VISION)
 * Este módulo provê a capacidade de "enxergar" e descrever visualmente o ambiente da VTuber sem sair do navegador.
 * Ele utiliza a biblioteca @xenova/transformers para executar modelos de Visão Computacional localmente via ONNX Runtime.
 * As principais funcionalidades integradas neste serviço de soberania são:
 * 1. Carregamento do pipeline 'image-to-text', utilizando o modelo vit-gpt2 otimizado para execução em CPU/WebGL.
 * 2. Captura e processamento de quadros estáticos (frames) vindos do componente Chat ou do QuimeraCore.
 * 3. Geração de descrições baseadas em linguagem natural (Captions) que servem de contexto visual para o cérebro (LLM).
 * 4. Monitoramento reativo do progresso de carregamento dos artefatos do modelo, informando o usuário via barra de progresso.
 * 5. Gerenciamento de memória e singleton para o pipeline de visão, prevenindo recarregamentos desnecessários do modelo.
 * 6. Tratamento de erros de inferência para garantir que a falha na visão não interrompa o ciclo de diálogo da IA.
 * 7. Execução em sandbox total, garantindo que nenhum frame processado seja enviado para servidores externos ou nuvens.
 */
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
