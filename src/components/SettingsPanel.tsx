/**
 * PAINEL DE CONTROLE DO KERNEL - SETTINGS PANEL (COMPONENT)
 * Este módulo é o centro de comando administrativo da Vaelindra, permitindo o ajuste fino de todos os parâmetros do organismo.
 * Ele centraliza as configurações de identidade, infraestrutura e interface, integrando diversos subcomponentes.
 * As principais funcionalidades gerenciadas por este painel são:
 * 1. Validação de Licenciamento Soberano, desbloqueando funcionalidades avançadas do núcleo através de chaves de ativação.
 * 2. Injeção de Matrizes de Identidade via arquivos JSON, permitindo a mudança completa da personalidade e cenário da VTuber.
 * 3. Monitoramento em tempo real do status de prontidão dos módulos individuais (STT, TTS, LLM) através de indicadores visuais.
 * 4. Configuração de Percepção Visual, alternando entre fontes de vídeo (Webcam/Tela) e ativando o processamento multimodal.
 * 5. Controle de interface para produtores de conteúdo, como o modo Chroma Key e o Inspetor de Anatomia VRM para depuração.
 * 6. Integração direta com o componente CoreSettings para a sincronia rápida de hardware e modelos locais (Ollama/LM Studio).
 */
import React, { useRef } from 'react';
import { useSovereignStore } from '../store';
import { 
  Cpu, 
  Terminal, 
  Shield, 
  Database, 
  Mic, 
  Brain, 
  Activity, 
  UserPlus, 
  Monitor, 
  Music, 
  Eye, 
  Zap, 
  ShieldCheck, 
  Bot,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { parseCharacterCardJSON } from '../lib/characterCardParser';
import { CHARACTER_PRESETS } from '../lib/characterPresets';
import { CoreSettings } from './CoreSettings';

export const SettingsPanel = () => {
  const activeCharacterCard = useSovereignStore((state) => state.activeCharacterCard);
  const setActiveCharacterCard = useSovereignStore((state) => state.setActiveCharacterCard);
  const sttStatus = useSovereignStore((state) => state.sttStatus);
  const ttsStatus = useSovereignStore((state) => state.ttsStatus);
  const llmStatus = useSovereignStore((state) => state.llmStatus);
  const isLicensed = useSovereignStore((state) => state.isLicensed);
  const setIsLicensed = useSovereignStore((state) => state.setIsLicensed);
  const licenseKey = useSovereignStore((state) => state.licenseKey);
  const setLicenseKey = useSovereignStore((state) => state.setLicenseKey);
  
  const transparentBackground = useSovereignStore((state) => state.transparentBackground);
  const setTransparentBackground = useSovereignStore((state) => state.setTransparentBackground);
  const useGptSovits = useSovereignStore((state) => state.useGptSovits);
  const setUseGptSovits = useSovereignStore((state) => state.setUseGptSovits);
  const gptSovitsUrl = useSovereignStore((state) => state.gptSovitsUrl);
  const setGptSovitsConfig = useSovereignStore((state) => state.setGptSovitsConfig);
  const vrmInspectorEnabled = useSovereignStore((state) => state.vrmInspectorEnabled);
  const setVrmInspectorEnabled = useSovereignStore((state) => state.setVrmInspectorEnabled);
  const visionEnabled = useSovereignStore((state) => state.visionEnabled);
  const setVisionEnabled = useSovereignStore((state) => state.setVisionEnabled);
  const visionSource = useSovereignStore((state) => state.visionSource);
  const setVisionSource = useSovereignStore((state) => state.setVisionSource);
  const twitchChannel = useSovereignStore(state => state.twitchChannel);
  const setTwitchChannel = useSovereignStore(state => state.setTwitchChannel);
  const obsUrl = useSovereignStore(state => state.obsUrl);
  const setObsConfig = useSovereignStore(state => state.setObsConfig);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyLicense = () => {
    if (licenseKey.toLowerCase() === 'sovereign-alpha-2026') {
      setIsLicensed(true);
      alert("NÚCLEO VALIDADO. LICENÇA SOBERANA ATIVADA.");
    } else {
      alert("ERRO DE SINCRO: CHAVE INVÁLIDA.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
       const content = evt.target?.result as string;
       const card = parseCharacterCardJSON(content);
       if (card) {
          setActiveCharacterCard(card);
          alert(`Núcleo de Personalidade [${card.name}] Injetado com Sucesso.`);
       } else {
          alert('Falha ao processar arquivo JSON.');
       }
    };
    reader.readAsText(file);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'active') return <ShieldCheck className="w-4 h-4 text-green-500" />;
    if (status === 'loading') return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
    if (status === 'error') return <Zap className="w-4 h-4 text-red-500" />;
    return <Zap className="w-4 h-4 text-white/20" />;
  };

  return (
    <div className="h-full w-full flex flex-col p-12 overflow-y-auto font-mono scrollbar-hide">
      <div className="flex justify-between items-start mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-blue/30 bg-neon-blue/5">
             <Cpu className="w-3 h-3 text-neon-blue" />
             <span className="text-[10px] text-neon-blue uppercase tracking-widest font-bold">Kernel Neural Config</span>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">NÚCLEO SOBERANO</h2>
          <p className="text-white/40 max-w-md text-xs uppercase tracking-widest leading-relaxed">
            Personalize a infraestrutura cognitiva e os parâmetros de assimilação do organismo digital.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-w-[320px]">
           <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-black uppercase text-white/80">Licenciamento</h3>
                 <StatusIcon status={isLicensed ? 'active' : 'offline'} />
              </div>
              <div className="space-y-4">
                 <input 
                   type="text" 
                   value={licenseKey}
                   onChange={(e) => setLicenseKey(e.target.value)}
                   placeholder="CHAVE DE ACESSO..."
                   disabled={isLicensed}
                   className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white uppercase tracking-widest outline-none focus:border-neon-blue transition-all"
                 />
                 <button 
                   onClick={handleVerifyLicense}
                   disabled={isLicensed}
                   className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                     isLicensed 
                     ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                     : 'bg-white text-black hover:bg-neon-blue'
                   }`}
                 >
                   {isLicensed ? 'SISTEMA ATIVADO' : 'Sincronizar Licença'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div className="space-y-12">
           <section className="space-y-8">
              <CoreSettings />
           </section>

           <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
                   <Activity className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-widest italic">Módulos Soberanos</h3>
              </div>
              
              <div className="grid gap-6">
                 {[
                   { id: 'LLM', label: 'Cortex Cognitivo', status: llmStatus, desc: 'Motor de inferência Web-LLM (Qwen2/SmolLM)' },
                   { id: 'STT', label: 'Matriz de Escuta', status: sttStatus, desc: 'Whisper Local via Xenova' },
                   { id: 'TTS', label: 'Enunciação Vocal', status: ttsStatus, desc: 'MMS Neural TTS / VITS' }
                 ].map(mod => (
                   <div key={mod.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{mod.id}</span>
                            <h4 className="text-sm font-black uppercase text-white">{mod.label}</h4>
                         </div>
                         <p className="text-[10px] font-mono text-white/30 truncate max-w-[200px]">{mod.desc}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className={`px-3 py-1 rounded-full border text-[8px] font-mono uppercase font-bold ${
                           mod.status === 'active' ? 'border-green-500/50 text-green-500' : 'border-white/10 text-white/20'
                         }`}>
                           {mod.status}
                         </div>
                         <StatusIcon status={mod.status} />
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-neon-pink">
                   <Monitor className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-widest italic">Interface & Visual</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                       <h4 className="text-xs font-black uppercase text-white">Chroma Key (Mascote)</h4>
                       <p className="text-[10px] text-white/30 uppercase mt-1">Torna o fundo transparente para uso em OBS</p>
                    </div>
                    <button 
                      onClick={() => setTransparentBackground(!transparentBackground)}
                      className={`w-12 h-6 rounded-full relative transition-all ${transparentBackground ? 'bg-neon-pink' : 'bg-white/10'}`}
                    >
                       <motion.div 
                         animate={{ x: transparentBackground ? 24 : 4 }}
                         className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                       />
                    </button>
                 </div>

                 <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                       <h4 className="text-xs font-black uppercase text-white">VRM Anatomy Inspector</h4>
                       <p className="text-[10px] text-white/30 uppercase mt-1">Analisa malha e ossos em tempo real</p>
                    </div>
                    <button 
                      onClick={() => setVrmInspectorEnabled(!vrmInspectorEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${vrmInspectorEnabled ? 'bg-neon-blue' : 'bg-white/10'}`}
                    >
                       <motion.div 
                         animate={{ x: vrmInspectorEnabled ? 24 : 4 }}
                         className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                       />
                    </button>
                 </div>
              </div>
           </section>
        </div>

        <div className="space-y-12">
           <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                     <Settings className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black uppercase tracking-widest italic">Matriz de Identidade</h3>
                </div>
                <label className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase cursor-pointer hover:bg-white/10 transition-all">
                   Injetar JSON
                   <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".json" />
                </label>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white text-black space-y-8 shadow-2xl">
                 <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-black flex items-center justify-center text-white">
                       <Bot className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase text-black/40">Soberano Ativo</span>
                       <h4 className="text-4xl font-black italic uppercase leading-none">{activeCharacterCard?.name || 'VAELINDRA'}</h4>
                       <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded bg-black text-white text-[8px] font-black uppercase italic">Neural_v5</span>
                          <span className="px-2 py-0.5 rounded border border-black text-black text-[8px] font-black uppercase italic">Uncensored</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase text-black/40">Imprint Neural</span>
                       <p className="text-xs font-bold leading-relaxed">{activeCharacterCard?.description || 'Nenhum imprint carregado.'}</p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase text-black/40">Cenário de Operação</span>
                       <p className="text-[10px] leading-relaxed text-black/60">{activeCharacterCard?.scenario || 'O ambiente é o Monolito local.'}</p>
                    </div>
                 </div>
              </div>
           </section>

           <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                   <Eye className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-black uppercase tracking-widest italic">Retina & Percepção</h3>
              </div>
              
              <div className="grid gap-6">
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                       <h4 className="text-xs font-black uppercase text-white">Visão Computacional Local</h4>
                       <p className="text-[10px] text-white/30 uppercase mt-1">Processamento de frames via ViT/LLaVA</p>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                          <button 
                            onClick={() => setVisionSource('webcam')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${visionSource === 'webcam' ? 'bg-white text-black' : 'text-white/40'}`}
                          >
                            Webcam
                          </button>
                          <button 
                            onClick={() => setVisionSource('screen')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${visionSource === 'screen' ? 'bg-white text-black' : 'text-white/40'}`}
                          >
                            Screen
                          </button>
                       </div>
                       <button 
                         onClick={() => setVisionEnabled(!visionEnabled)}
                         className={`w-12 h-6 rounded-full relative transition-all ${visionEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                       >
                          <motion.div 
                            animate={{ x: visionEnabled ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                          />
                       </button>
                    </div>
                 </div>
              </div>
           </section>
        </div>
      </div>

      <div className="mt-auto pt-20 border-t border-white/5 opacity-20">
         <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.4em]">
            <span>SOVEREIGN ARCHITECTURE</span>
            <span>BUILD 2026.04.17</span>
            <span>UNLICENSED REPRODUCTION PROHIBITED</span>
         </div>
      </div>
    </div>
  );
};
