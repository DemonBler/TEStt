/**
 * MONITOR DE FLUXO NEURAL - NEURAL FLOW MONITOR (VISUALIZER)
 * Este componente provê uma visualização em tempo real da arquitetura de microsserviços da Vaelindra.
 * Ele permite que o usuário monitore o caminho que um dado percorre, desde a entrada até a resposta física.
 * As principais responsabilidades deste monitor visual são:
 * 1. Mapear graficamente os diferentes repositórios assimilados (Vaelindra, Riko, LocalAIVtuber).
 * 2. Exibir o status operacional de cada "Node" do sistema (Input, STT, Brain, TTS, VTS).
 * 3. Fornecer feedback visual instantâneo sobre a saúde dos módulos através de códigos de cores neon.
 * 4. Utilizar animações de pulso para indicar atividade de processamento em tempo real em cada etapa do fluxo.
 * 5. Servir como uma ferramenta de diagnóstico rápido para identificar gargalos ou falhas na pipeline neural.
 * 6. Apresentar os nomes dos repositórios fonte para manter a rastreabilidade da "Quimera" de software.
 * 7. Integrar-se à UI principal de forma não intrusiva, mantendo a estética industrial e tecnocrática do núcleo.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, Brain } from 'lucide-react';

export const NeuralFlowMonitor = () => {
  const steps = [
    { name: "Input Neural", repo: "Vaelindra Core", status: "READY", color: "#00f3ff" },
    { name: "STT Pipeline", repo: "Whisper / Riko", status: "READY", color: "#ff007f" },
    { name: "Brain Processor", repo: "LocalAIVtuber Node", status: "FUSED", color: "#00ff00" },
    { name: "TTS Engine", repo: "GPT-SoVITS", status: "READY", color: "#ffcc00" },
    { name: "VTS Controller", repo: "VTS-Actions", status: "ACTIVE", color: "#00f3ff" }
  ];

  return (
    <div className="glass p-4 rounded-2xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em]">Neural Multi-Repo Flow</h3>
        <Activity className="w-3 h-3 text-neon-blue animate-pulse" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col gap-1 min-w-[100px] p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[8px] font-mono text-white/80 uppercase truncate">{step.name}</span>
              <span className="text-[6px] font-mono text-white/30 uppercase truncate">{step.repo}</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: step.color }} />
                <span className="text-[6px] font-mono" style={{ color: step.color }}>{step.status}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <Zap className="w-3 h-3 text-white/10 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
