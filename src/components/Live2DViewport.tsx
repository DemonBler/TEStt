import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { useSovereignStore } from "../store";

// Necessário para que o SDK encontre o core do modelo
(window as any).PIXI = PIXI;

interface Live2DViewportProps {
  modelUrl?: string;
  onModelLoad?: (model: any) => void;
}

export function Live2DViewport({ 
  modelUrl = 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model3.json',
  onModelLoad 
}: Live2DViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<any>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const { mouthLevel } = useSovereignStore();
  const [hasError, setHasError] = useState(false);

  // Sincronizar abertura de boca em tempo real
  useEffect(() => {
    if (modelRef.current && modelRef.current.internalModel) {
      const coreModel = (modelRef.current.internalModel as any).coreModel;
      if (coreModel) {
        const params = ["ParamMouthOpenY", "PARAM_MOUTH_OPEN_Y"];
        params.forEach(p => {
          try {
            if (coreModel.setParameterValueById) {
              coreModel.setParameterValueById(p, mouthLevel);
            } else if (coreModel.setParamFloat) {
              coreModel.setParamFloat(p, mouthLevel);
            }
          } catch(e) {}
        });
      }
    }
  }, [mouthLevel]);

  useEffect(() => {
    if (!canvasRef.current || hasError) return;

    let app: PIXI.Application;

    const initPixi = async () => {
      try {
        const { Live2DModel } = await import("pixi-live2d-display");
        
        // 1. Inicializar Aplicação Pixi
        app = new PIXI.Application({
          view: canvasRef.current!,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
          resizeTo: canvasRef.current!.parentElement || window,
        });
        appRef.current = app;

        // 2. Carregar o Modelo Live2D
        console.log("[Live2D] Carregando Modelo Soberano:", modelUrl);
        const model = await Live2DModel.from(modelUrl);
        modelRef.current = model;

        // Posicionamento e Escala
        model.anchor.set(0.5, 0.5);
        model.position.set(app.screen.width / 2, app.screen.height / 2);
        
        // Auto-escala para caber na altura
        const scale = (app.screen.height * 0.8) / model.height;
        model.scale.set(scale);

        // @ts-ignore
        app.stage.addChild(model);

        // Feedback de interação
        model.on("hit", (hitAreas: string[]) => {
          if (hitAreas.includes("body")) {
            model.motion("TapBody");
          }
        });

        if (onModelLoad) onModelLoad(model);
        console.log("[Live2D] Modelo Assimilado com Sucesso.");
      } catch (e) {
        console.error("[Live2D] Erro Fatal no Motor Gráfico:", e);
        setHasError(true);
      }
    };

    initPixi();

    return () => {
      modelRef.current?.destroy();
      app?.destroy(true, true);
    };
  }, [modelUrl, hasError]);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center border border-red-500/20 bg-red-500/5 rounded-2xl">
        <p className="text-red-400 font-mono text-xs uppercase tracking-widest text-center px-4">
          Visual Cortex Failure<br/>
          <span className="text-[9px] opacity-60">PixiJS / Live2D Cubism Error</span>
        </p>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
    />
  );
};
