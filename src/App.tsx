import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Mic, 
  MicOff, 
  Settings, 
  Activity,
  Send,
  Sparkles,
  BrainCircuit,
  Box,
  Image as ImageIcon
} from "lucide-react";
import { Live2DViewport } from "./components/Live2DViewport";
import { VRMViewport } from "./components/VRMViewport";
import { aiService } from "./services/localAIService";
import { startListening } from "./services/localSTTService";
import { generateLocalTTS, playAudioBuffer } from "./services/localTTSService";
import { useSovereignStore } from "./store";
import { parseCharacterFile } from "./lib/characterCardParser";

export default function App() {
  const { isLive, setIsLive } = useSovereignStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isAiReady, setIsAiReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [renderMode, setRenderMode] = useState<'3D' | '2D'>('3D');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Inicializar o Cérebro Soberano (WebGPU)
  useEffect(() => {
    aiService.init(
      () => setIsAiReady(true),
      (p) => setLoadingProgress(p)
    );
  }, []);

  // Auto-scroll para o chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSTT = async () => {
    if (!isAiReady || isThinking) return;
    setIsListening(true);
    try {
      const text = await startListening();
      if (text) {
        setInput(text);
        await processResponse(text);
      }
    } catch (e) {
      console.error("STT Error:", e);
    } finally {
      setIsListening(false);
    }
  };

  const processResponse = async (userMsg: string) => {
    setIsThinking(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const systemPrompt = useSovereignStore.getState().activeCharacterCard?.system_prompt || "Você é Vaelindra Soberana.";
      const response = await aiService.generate(userMsg, systemPrompt);
      
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      
      // Voz Real (TTS)
      const buffer = await generateLocalTTS(response);
      playAudioBuffer(response, buffer);
      
    } catch (e) {
      console.error("Neural Error:", e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isAiReady || isThinking) return;
    const userMsg = input.trim();
    setInput("");
    await processResponse(userMsg);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const card = await parseCharacterFile(file);
      if (card) {
        useSovereignStore.getState().setActiveCharacterCard(card);
        setMessages([{ role: 'ai', content: card.first_mes }]);
        console.log(`[Neural Link] Personagem assimilado: ${card.name}`);
      }
    }
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      className="h-screen w-screen flex bg-black selection:bg-neon-blue selection:text-black font-sans"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,180,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Header / Top Stats */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-xl bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-neon-blue animate-pulse" />
            </div>
            <div>
              <h1 className="text-[10px] font-black tracking-widest uppercase text-white/90">Vaelindra Sovereign v2.5k</h1>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isAiReady ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse transition-all shadow-[0_0_5px_#eab308]'}`} />
                <span className="text-[8px] font-mono uppercase text-white/40">
                  {isAiReady ? 'Neural Engine: Optimized' : `Syncing Kernels: ${loadingProgress}%`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-white/30">
             <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                   <Activity className="w-3 h-3 text-neon-purple" />
                   <span className="text-[8px] font-mono">LAT: 12ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <Cpu className="w-3 h-3 text-neon-blue" />
                   <span className="text-[8px] font-mono tracking-tighter uppercase">WebGPU: {isAiReady ? 'Active' : 'Wait'}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Viewport - Centralized and Large */}
        <div className="flex-1 relative overflow-hidden group">
          {renderMode === '3D' ? (
            <VRMViewport modelUrl="https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/AliciaSolid.vrm" />
          ) : (
            <Live2DViewport onModelLoad={(m) => setModel(m)} />
          )}

          {/* OVERLAY DE SINCRONIZAÇÃO NEURAL BLOCKER */}
          {!isAiReady && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 p-8 border border-neon-blue/20 bg-black/60 rounded-3xl">
                <BrainCircuit className="w-12 h-12 text-neon-blue animate-pulse" />
                <h2 className="text-xl font-bold font-mono text-white tracking-widest text-center">
                  INICIALIZANDO MALHA NEURAL
                </h2>
                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-neon-blue shadow-[0_0_10px_#00f0ff] transition-all duration-300"
                    style={{ width: `${Math.max(5, loadingProgress)}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-neon-blue/70">
                  Baixando Cérebro Base (Isso ocorre apenas na 1ª vez)
                </p>
                <p className="text-[10px] text-white/40 max-w-[250px] text-center mt-2">
                  Até o cérebro estar pronto, microfone e chat estão desativados.
                </p>
              </div>
            </div>
          )}
          
          {/* Action Overlay */}
          <div className="absolute right-6 top-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-50">
             <button 
                onClick={() => setRenderMode(prev => prev === '3D' ? '2D' : '3D')}
                className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center hover:border-neon-blue hover:text-neon-blue transition-all hover:scale-110"
                title={`Mudar para modo ${renderMode === '3D' ? '2D (Live2D)' : '3D (VRM)'}`}
             >
                {renderMode === '3D' ? <ImageIcon className="w-4 h-4" /> : <Box className="w-4 h-4" />}
             </button>
             <button className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center hover:border-neon-blue hover:text-neon-blue transition-all hover:scale-110 mt-2">
                <Settings className="w-4 h-4" />
             </button>
             <button 
                onClick={handleSTT}
                className={`w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center hover:border-neon-blue transition-all hover:scale-110 ${isListening ? 'border-neon-blue text-neon-blue animate-pulse' : ''}`}
             >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
             </button>
          </div>

          <div className="absolute bottom-6 left-6 max-w-sm z-50">
             <div className="px-4 py-3 glass rounded-2xl border border-neon-blue/20 backdrop-blur-md bg-black/40">
                <p className="text-[9px] font-mono text-neon-blue uppercase mb-1 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Architecture Note
                </p>
                <p className="text-[10px] text-white/70 leading-relaxed italic">
                  "O modelo Extreme integra Motores 3D/2D, operando em baixa latência via <span className="text-neon-blue font-bold">Sovereign Core</span>."
                </p>
             </div>
          </div>
        </div>

        {/* Chat UI - Docked at Bottom */}
        <section className="h-72 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex flex-col">
           <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
           >
              <AnimatePresence initial={false}>
                {messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center flex-col text-white/20"
                  >
                    <Terminal className="w-8 h-8 mb-4 opacity-30" />
                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] font-bold">Awaiting User Instruction</p>
                  </motion.div>
                )}
                {messages.map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-[11px] font-medium leading-relaxed ${
                      m.role === 'user' 
                      ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue'
                      : 'bg-white/5 border border-white/10 text-white/90 shadow-xl'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex gap-1.5">
                      <div className="w-1 h-1 bg-neon-blue rounded-full animate-bounce [animation-duration:0.8s]" />
                      <div className="w-1 h-1 bg-neon-blue rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.1s]" />
                      <div className="w-1 h-1 bg-neon-blue rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
           
           <div className="p-5 border-t border-white/5 bg-black/40">
              <div className="max-w-4xl mx-auto relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isAiReady ? "Comande a Vaelindra..." : "Inicializando Protocolo Canary Extreme..."}
                  className="w-full bg-white/5 border border-white/10 h-14 rounded-2xl px-6 text-xs focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/20 transition-all pr-14 placeholder:text-white/20 font-medium"
                  disabled={!isAiReady || isThinking}
                />
                <button 
                  onClick={handleSend}
                  disabled={!isAiReady || isThinking}
                  className="absolute right-3 p-3 bg-neon-blue/10 rounded-xl text-neon-blue hover:bg-neon-blue hover:text-black transition-all disabled:opacity-10 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
           </div>
        </section>
      </div>

      {/* Side Decorative Bar (Small but technical) */}
      <div className="w-[4px] bg-gradient-to-b from-transparent via-neon-blue/30 to-transparent opacity-50" />
    </div>
  );
}
