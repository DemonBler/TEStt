import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  Settings as SettingsIcon,
  Zap,
  Activity,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { useSovereignStore } from "./store";
import { kernel } from "./lib/Kernel"; 
import { Viewport } from "./components/Viewport";
import { Chat } from "./components/Chat";
import { SettingsPanel } from "./components/SettingsPanel";
import { VRMAnatomyInspector } from "./components/VRMAnatomyInspector";

// Helper components
const StatusBadge = ({ label, status }: { label: string, status: 'offline' | 'loading' | 'active' | 'error' }) => (
  <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
    status === 'active' ? 'text-green-500 border-green-500/50 bg-green-500/10' : 'text-red-500 border-red-500/50 bg-red-500/10'
  }`}>
    <div className="w-1.5 h-1.5 rounded-full bg-current" />
    <span className="text-[9px] font-mono font-bold uppercase">{label}</span>
  </div>
);

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-4 px-5 py-3.5 rounded-xl w-full ${activeTab === id ? "bg-white/10" : "hover:bg-white/5"}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-mono uppercase font-bold">{label}</span>
  </button>
);

export default function App() {
  const activeTab = useSovereignStore((state) => state.activeTab);
  const setActiveTab = useSovereignStore((state) => state.setActiveTab);
  
  useEffect(() => {
    const handleSovereignEvent = (e: any) => {
      const { event, data } = e.detail;
      if (['stt', 'tts', 'llm'].includes(data.module)) {
          useSovereignStore.getState().setSystemStatus(data.module.toUpperCase(), data.status);
      }
    };
    window.addEventListener('sovereign_event', handleSovereignEvent);
    return () => window.removeEventListener('sovereign_event', handleSovereignEvent);
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden">
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-black mb-8 text-neon-blue">SOVEREIGN</h1>
        <NavItem id="home" icon={Monitor} label="Main Controller" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="settings" icon={SettingsIcon} label="Kernel" activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>
      
      <main className="flex-1 p-8">
        {activeTab === 'home' ? (
          <div className="flex gap-8 h-full">
            <div className="flex-1 glass border border-white/10 rounded-3xl p-4">
              <Viewport />
            </div>
            <div className="w-96 glass border border-white/10 rounded-3xl p-6">
              <Chat />
            </div>
          </div>
        ) : (
          <SettingsPanel />
        )}
      </main>
    </div>
  );
}
