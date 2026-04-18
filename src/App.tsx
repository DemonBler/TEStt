import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  Settings as SettingsIcon, 
  Power,
  Zap,
  Activity,
  Mic,
  MessageSquare,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { useSovereignStore } from "./store";
import { Viewport } from "./components/Viewport";
import { Chat } from "./components/Chat";
import { SettingsPanel } from "./components/SettingsPanel";
import { VRMAnatomyInspector } from "./components/VRMAnatomyInspector";

const StatusBadge = ({ label, status, detail }: { label: string, status: 'offline' | 'loading' | 'active' | 'error', detail?: string }) => {
  const colors = {
    offline: 'text-white/20 border-white/10 bg-white/5',
    loading: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10 animate-pulse',
    active: 'text-green-500 border-green-500/50 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
    error: 'text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all relative group ${colors[status]}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-current'}`} />
      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label}</span>
      {status === 'error' && (
         <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-black border border-red-500/50 rounded-lg text-[8px] text-red-500 uppercase z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
            {detail || 'Falha Crítica. Verifique Kernel/Rede.'}
         </div>
      )}
    </div>
  );
};

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, x: 5 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all relative group w-full text-left border ${
      activeTab === id 
        ? `bg-white/10 border-white/10 text-white shadow-xl` 
        : "text-white/30 border-transparent hover:text-white/60 hover:bg-white/5"
    }`}
  >
    <Icon className={`w-4 h-4 ${activeTab === id ? "text-neon-blue" : ""}`} />
    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">{label}</span>
    {activeTab === id && (
      <motion.div 
        layoutId="active-pill"
        className="absolute left-0 w-1 h-6 bg-neon-blue rounded-r-full"
      />
    )}
  </motion.button>
);

export default function App() {
  const activeTab = useSovereignStore((state) => state.activeTab);
  const setActiveTab = useSovereignStore((state) => state.setActiveTab);
  const isLive = useSovereignStore((state) => state.isLive);
  const organismState = useSovereignStore((state) => state.organismState);
  
  const sttStatus = useSovereignStore((state) => state.sttStatus);
  const ttsStatus = useSovereignStore((state) => state.ttsStatus);
  const llmStatus = useSovereignStore((state) => state.llmStatus);
  
  const transparentBackground = useSovereignStore((state) => state.transparentBackground);
  const setUser = useSovereignStore((state) => state.setUser);
  const vrmInspectorEnabled = useSovereignStore((state) => state.vrmInspectorEnabled);
  const [isBooting, setIsBooting] = React.useState(true);
  const [neuralIgnited, setNeuralIgnited] = React.useState(false);

  useEffect(() => {
    setUser({ uid: 'sovereign_user', displayName: 'Drevlan', email: 'root@sovereign', photoURL: null });
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(bootTimer);
  }, [setUser]);

  useEffect(() => {
    document.body.classList.toggle('transparent-mode', transparentBackground);
  }, [transparentBackground]);

  const handleIgnition = () => {
    setNeuralIgnited(true);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtx.resume();
    window.dispatchEvent(new CustomEvent('neural_ignite'));
  };

  if (isBooting) {
    return (
      <div className={`h-screen w-screen ${transparentBackground ? 'bg-transparent' : 'bg-[#050505]'} flex flex-col items-center justify-center font-mono overflow-hidden relative`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-neon-blue/20 blur-[120px] rounded-full animate-pulse" />
          <Zap className="w-16 h-16 text-neon-blue relative z-10 animate-bounce" />
        </motion.div>
        <h1 className="text-3xl font-black tracking-[0.8em] text-white mt-8 neon-text">SOVEREIGN</h1>
        <div className="mt-12 w-64 h-[1px] bg-white/10 relative overflow-hidden">
           <motion.div 
             className="absolute inset-0 bg-neon-blue"
             animate={{ x: ["-100%", "100%"] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
           />
        </div>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mt-6">Arquitetura de Sintonia Neural v5.0 // Fedora Kernel</p>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen text-white overflow-hidden flex font-sans relative ${transparentBackground ? 'bg-transparent' : 'bg-[#050505]'}`}>
      <AnimatePresence>
        {!neuralIgnited && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-3xl"
          >
             <div className="max-w-md space-y-12">
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-blue/30 bg-neon-blue/5 mb-4">
                    <Activity className="w-3 h-3 text-neon-blue" />
                    <span className="text-[9px] font-mono text-neon-blue uppercase tracking-widest font-bold">Injeção de Kernel Pronta</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Sincronia Neural</h2>
                  <p className="text-xs font-mono text-white/40 leading-relaxed uppercase tracking-widest px-8">
                    Assumindo controle dos periféricos locais. STT, TTS e LLM serão inicializados em modo Soberano.
                  </p>
               </div>
               <motion.button
                 whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,243,255,0.4)" }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleIgnition}
                 className="group relative w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.4em] border-none transition-all"
               >
                 <span className="relative z-10">Ignição Neural</span>
                 <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-20 transition-opacity blur-xl rounded-2xl" />
               </motion.button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-pink/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>

      {/* Navigation Rail */}
      <aside className="w-20 lg:w-72 h-full glass border-r border-white/5 flex flex-col z-50 overflow-hidden relative">
        <div className="p-8 space-y-12 h-full flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-neon-blue" />
            </div>
            <div className="hidden lg:block overflow-hidden">
               <h1 className="text-lg font-black tracking-tighter text-white uppercase italic truncate">Sovereign</h1>
               <p className="text-[8px] font-mono text-white/40 uppercase tracking-[0.2em]">Build 5.0.2-canary</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="home" icon={Monitor} label="Main Controller" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="settings" icon={SettingsIcon} label="Neural Kernel" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>

          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="hidden lg:block space-y-3">
               <div className="flex justify-between items-center px-1">
                 <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Nível de Sincronia</span>
                 <span className="text-[9px] font-mono text-neon-blue uppercase font-bold tracking-widest">100%</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-neon-blue shadow-[0_0_10px_#00f3ff]" 
                   animate={{ width: ["100%", "95%", "100%"] }} 
                   transition={{ duration: 4, repeat: Infinity }} 
                 />
               </div>
            </div>
            
            <div className="flex flex-col gap-2">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hidden lg:block">
                  <div className="flex items-center gap-3 mb-2">
                     <ShieldCheck className="w-3 h-3 text-neon-pink" />
                     <span className="text-[9px] font-mono text-white/80 uppercase font-bold tracking-widest">Status Comercial</span>
                  </div>
                  <div className="text-[8px] font-mono text-white/40 uppercase leading-tight italic">
                     Licença Permanente // Edição Soberana
                  </div>
               </div>
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center group"
                >
                  <Power className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="hidden lg:block ml-3 text-[10px] font-mono uppercase font-black tracking-widest">Desconectar</span>
               </motion.button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between glass shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em]">Protocolo Ativo</span>
              <span className="text-xs font-mono text-white font-bold tracking-widest uppercase">Kernel Monólito Federated</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-3 h-8 px-4 border-l border-white/10">
               <StatusBadge label="LLM" status={llmStatus} />
               <StatusBadge label="STT" status={sttStatus} />
               <StatusBadge label="TTS" status={ttsStatus} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
               <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em]">IA State</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${organismState === 'IDLE' ? 'bg-white/20' : 'bg-neon-blue animate-pulse shadow-[0_0_5px_#00f3ff]'}`} />
                  <span className="text-[10px] font-mono text-white uppercase font-black tracking-widest">{organismState}</span>
               </div>
            </div>
            <div className={`px-5 py-2 rounded-xl border transition-all ${isLive ? "border-neon-pink/50 bg-neon-pink/5" : "border-white/10"}`}>
               <span className={`text-[10px] font-mono uppercase tracking-[0.3em] font-black ${isLive ? "text-neon-pink" : "text-white/30"}`}>
                 {isLive ? "Transmission Live" : "Offline"}
               </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 min-h-0">
          <AnimatePresence mode="wait">
             {activeTab === 'home' ? (
                <motion.div 
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full flex flex-col lg:flex-row gap-8"
                >
                   {/* Avatar Stage */}
                   <div className="flex-[5] flex flex-col gap-8 min-h-0">
                      <div className="flex-1 glass rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] group">
                        <Viewport />
                        
                        <div className="absolute inset-0 pointer-events-none border-[20px] border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {vrmInspectorEnabled && <VRMAnatomyInspector />}

                        {/* Top Left HUD */}
                        <div className="absolute top-8 left-8 flex flex-col gap-3">
                           <div className="glass px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 text-neon-blue">
                              <Cpu className="w-4 h-4" />
                              <span className="text-[10px] font-mono font-black uppercase tracking-widest">Anatomia Virtual Ativa</span>
                           </div>
                        </div>

                        {/* Bottom Bar Info */}
                        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end pointer-events-none">
                           <div className="space-y-1">
                              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white opacity-40">System_VTuber_Alpha</h3>
                              <div className="flex gap-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-neon-blue rounded-full" />
                                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Bone_Matrix: Fused</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-neon-pink rounded-full" />
                                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Limbic_Response: Low_Latency</span>
                                 </div>
                              </div>
                           </div>
                           <div className="font-mono text-[8px] text-white/20 uppercase tracking-[0.5em]">
                             Buffer_State: Operational
                           </div>
                        </div>
                      </div>
                      
                      {/* Secondary Controller Bar */}
                      <div className="h-24 glass rounded-3xl border border-white/10 p-6 flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <button className="flex flex-col items-center gap-1 group">
                               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-neon-blue/20 group-hover:border-neon-blue transition-all">
                                  <Mic className="w-4 h-4 text-white/40 group-hover:text-neon-blue" />
                               </div>
                               <span className="text-[8px] font-mono text-white/40 uppercase font-black">Microfone</span>
                            </button>
                            <div className="h-8 w-[1px] bg-white/10" />
                            <div className="space-y-1">
                               <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block">Input Gain</span>
                               <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-neon-blue w-1/2" />
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-4">
                               <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Protocolo Comercial</span>
                               <span className="text-[10px] font-mono text-white font-black uppercase">Licença Ativa</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border-2 border-neon-blue/30 flex items-center justify-center text-neon-blue animate-pulse">
                               <ShieldCheck className="w-6 h-6" />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Interaction Sidebar */}
                   <div className="flex-[3] flex flex-col gap-8 min-h-0">
                      <div className="flex-1 glass rounded-[2.5rem] border border-white/10 p-8 flex flex-col shadow-2xl overflow-hidden relative">
                         <div className="flex items-center gap-3 mb-6 shrink-0">
                            <MessageSquare className="w-5 h-5 text-neon-pink" />
                            <h2 className="text-xs font-mono font-black uppercase tracking-[0.3em] text-white/60">Stream Chat Matrix</h2>
                         </div>
                         <div className="flex-1 min-h-0">
                            <Chat />
                         </div>
                      </div>
                      
                      {/* State Metrics */}
                      <div className="h-48 glass rounded-[2rem] border border-white/10 p-6 grid grid-cols-2 gap-4">
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Latência de Resposta</span>
                            <div className="flex items-baseline gap-2">
                               <span className="text-2xl font-mono font-black text-white italic">42</span>
                               <span className="text-[10px] font-mono text-neon-blue uppercase">ms</span>
                            </div>
                         </div>
                         <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Carga da WebGPU</span>
                            <div className="flex items-baseline gap-2">
                               <span className="text-2xl font-mono font-black text-white italic">14</span>
                               <span className="text-[10px] font-mono text-neon-pink uppercase">%</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
             ) : (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full h-full glass rounded-[3rem] border border-white/10 overflow-hidden shadow-inner"
                >
                   <SettingsPanel />
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
