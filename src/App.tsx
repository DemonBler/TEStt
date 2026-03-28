import React, { useState, useEffect } from 'react';
import { VRMViewer } from './components/VRMViewer';
import { SystemMonitor } from './components/SystemMonitor';
import { OrchestrationTerminal } from './components/OrchestrationTerminal';
import { ChatInterface } from './components/ChatInterface';
import { Upload, BrainCircuit } from 'lucide-react';

function App() {
  const [vrmUrl, setVrmUrl] = useState<string | undefined>(undefined);
  const [ollamaStatus, setOllamaStatus] = useState<boolean>(false);

  useEffect(() => {
    // Check Ollama status periodically
    const checkOllama = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        setOllamaStatus(res.ok);
      } catch {
        setOllamaStatus(false);
      }
    };
    checkOllama();
    const interval = setInterval(checkOllama, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVrmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVrmUrl(url);
      (window as any).addOmniLog?.('info', `Carregando modelo VRM local: ${file.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              OMNI-GENESIS v6.3
            </h1>
            <p className="text-[10px] font-mono text-slate-500">TERMINAL DE COMANDO DE COMBATE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
            <div className={`w-2 h-2 rounded-full ${ollamaStatus ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-[10px] font-mono text-slate-400">OLLAMA (localhost:11434)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] font-mono text-slate-400">NEURAL KINEMATICS (WebGPU)</span>
          </div>
          <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-800/50 rounded text-xs font-mono text-cyan-400 transition-colors">
            <Upload size={14} />
            <span>CARREGAR VRM</span>
            <input type="file" accept=".vrm" className="hidden" onChange={handleVrmUpload} />
          </label>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left Panel: System & Orchestration */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <SystemMonitor />
          <div className="flex-1 min-h-0">
            <OrchestrationTerminal />
          </div>
        </div>

        {/* Center Panel: VRM Canvas */}
        <div className="lg:col-span-6 relative rounded-lg overflow-hidden border border-slate-800 bg-black shadow-2xl min-h-[400px]">
          <VRMViewer vrmUrl={vrmUrl} />
        </div>

        {/* Right Panel: Chat & Controls */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <ChatInterface />
        </div>

      </main>
    </div>
  );
}

export default App;
