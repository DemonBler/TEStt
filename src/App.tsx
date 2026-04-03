import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  Zap, 
  Activity, 
  Share2, 
  Settings as SettingsIcon, 
  ShieldAlert,
  Power
} from "lucide-react";
import { useSovereignStore } from "./store";
import { Viewport } from "./components/Viewport";
import { Telemetry } from "./components/Telemetry";
import { Chat } from "./components/Chat";

import { SettingsPanel } from "./components/SettingsPanel";

const NavItem = ({ id, icon: Icon, label, color, activeTab, setActiveTab }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, x: 5 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all relative group w-full text-left ${
      activeTab === id 
        ? `bg-white/5 border border-white/10 text-white shadow-[0_0_20px_rgba(0,243,255,0.05)]` 
        : "text-white/40 hover:text-white/60 hover:bg-white/5"
    }`}
  >
    {activeTab === id && (
      <motion.div 
        layoutId="nav-glow"
        className={`absolute inset-0 bg-white/5 blur-xl -z-10`}
      />
    )}
    <Icon className={`w-5 h-5 ${activeTab === id ? "text-neon-blue animate-pulse" : ""}`} />
    <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">{label}</span>
    
    {/* Indicator Dot */}
    <div className={`absolute right-4 h-1 w-1 rounded-full transition-all ${
      activeTab === id ? `bg-neon-blue scale-150 shadow-[0_0_5px_#00f3ff]` : "bg-white/10"
    }`} />
  </motion.button>
);

// [Sovereign Core] - Main Application Shell
export default function App() {
  const activeTab = useSovereignStore((state) => state.activeTab);
  const setActiveTab = useSovereignStore((state) => state.setActiveTab);
  const setVmcData = useSovereignStore((state) => state.setVmcData);
  const setTelemetry = useSovereignStore((state) => state.setTelemetry);
  const isLive = useSovereignStore((state) => state.isLive);

  const [isBooting, setIsBooting] = React.useState(true);

  // [WebSocket Bridge] - VMC Proxy & Telemetry
  useEffect(() => {
    // Simulate Booting Sequence
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    socket.onopen = () => {
      console.log("[Sovereign Core] WebSocket Bridge Established");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "vmc") {
          setVmcData(data.payload);
        } else if (data.type === "telemetry") {
          setTelemetry(data.payload);
        }
      } catch (e) {
        console.error("[Sovereign Core] WS Parse Error:", e);
      }
    };

    socket.onclose = () => {
      console.warn("[Sovereign Core] WebSocket Bridge Terminated.");
    };

    return () => {
      socket.close();
      clearTimeout(bootTimer);
    };
  }, [setVmcData, setTelemetry]);

  if (isBooting) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 text-center"
        >
          <div className="h-20 w-20 rounded-2xl bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center mx-auto relative">
            <Zap className="w-10 h-10 text-neon-blue animate-pulse" />
            <div className="absolute inset-0 bg-neon-blue/20 blur-xl" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-[0.5em] text-neon-blue neon-text">VAELINDRA</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Inicializando Monólito Soberano v5.0.2</p>
          </div>
          <div className="w-64 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
            <motion.div 
              className="h-full bg-neon-blue"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
          <div className="text-[8px] text-white/20 uppercase tracking-widest space-y-1">
            <p>Kernel: Fedora Rawhide (Canary)</p>
            <p>Ollama: Conectando...</p>
            <p>Link Neural Local: Ativo</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden flex font-sans selection:bg-neon-blue/30 relative">
      {/* [Cyber-Fofo Scanlines Overlay] */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* [Sidebar Navigation] */}
      <aside className="w-80 h-full glass border-r border-white/5 p-8 flex flex-col justify-between z-20">
        <div className="space-y-12">
          {/* Logo Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center relative group">
                <Zap className="w-6 h-6 text-neon-blue animate-pulse" />
                <div className="absolute inset-0 bg-neon-blue/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h1 className="text-xl font-mono font-black tracking-tighter neon-text text-neon-blue">VAELINDRA</h1>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Núcleo Soberano v5.0</p>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-neon-blue/50 to-transparent" />
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-2">
            <NavItem id="home" icon={Monitor} label="Visualizador" color="neon-blue" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="telemetry" icon={Activity} label="Telemetria" color="neon-blue" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="settings" icon={SettingsIcon} label="Soberano" color="white/40" activeTab={activeTab} setActiveTab={setActiveTab} />
          </nav>
        </div>

        {/* System Health Footer */}
        <div className="space-y-6">
          <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Link Neural</span>
              <span className="text-[10px] font-mono text-neon-blue uppercase font-bold">Estável</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-blue"
                animate={{ width: ["80%", "95%", "85%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Latência Local</span>
              <span className="text-[10px] font-mono text-neon-pink uppercase font-bold">0.82ms</span>
            </div>
          </div>

          <button 
            onClick={() => window.close()}
            className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-red-500/20 transition-all flex items-center justify-center gap-3 group"
          >
            <Power className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Desligamento de Emergência
          </button>
        </div>
      </aside>

      {/* [Main Content Area] */}
      <main className="flex-1 relative flex flex-col p-8 gap-8 overflow-hidden bg-[#0a0a0f]">
        {/* Top Bar HUD */}
        <header className="flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Protocolo Ativo</span>
              <span className="text-xs font-mono text-neon-blue uppercase font-bold tracking-widest">Canary Elite v5.0.2</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Alocação de VRAM</span>
              <span className="text-xs font-mono text-neon-pink uppercase font-bold tracking-widest">8.2GB / 12GB</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg glass border flex items-center gap-3 ${isLive ? "border-neon-pink/50 bg-neon-pink/10" : "border-white/10"}`}>
              <div className={`h-2 w-2 rounded-full ${isLive ? "bg-neon-pink animate-pulse shadow-[0_0_10px_#ff007f]" : "bg-white/20"}`} />
              <span className={`text-[10px] font-mono uppercase tracking-widest ${isLive ? "text-neon-pink" : "text-white/40"}`}>
                {isLive ? "Soberano Online" : "Modo de Espera"}
              </span>
            </div>
          </div>
        </header>

        {/* [Dynamic Content Switcher] */}
        <div className="flex-1 relative min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex gap-8"
            >
              {activeTab === "home" && (
                <>
                  <div className="flex-[2] glass rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl">
                    <Viewport />
                  </div>
                  <div className="flex-1 glass rounded-3xl border border-white/5 p-8 flex flex-col shadow-2xl">
                    <Chat />
                  </div>
                </>
              )}

              {activeTab === "telemetry" && (
                <div className="w-full h-full">
                  <Telemetry />
                </div>
              )}

              {activeTab === "settings" && (
                <div className="w-full h-full">
                  <SettingsPanel />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* [Cyber-Fofo Background Elements] */}
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-neon-pink/10 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
