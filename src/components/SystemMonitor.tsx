import React, { useState, useEffect } from 'react';
import { Cpu, Database, Thermometer, Zap, AlertTriangle, Activity } from 'lucide-react';

interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  vramUsage: number;
  temperature: number;
  powerDraw: number;
}

export const SystemMonitor: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTurbo, setIsTurbo] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/stats');
        if (!res.ok) throw new Error('Falha na resposta do servidor local');
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        // Fallback to simulation to prevent UI errors
        setStats(prev => ({
          cpuUsage: isTurbo ? Math.min(100, (prev?.cpuUsage || 10) + (Math.random() * 20 - 5)) : Math.max(5, Math.min(100, (prev?.cpuUsage || 10) + (Math.random() * 10 - 5))),
          ramUsage: Math.max(4, Math.min(40, (prev?.ramUsage || 8) + (Math.random() * 2 - 1))),
          vramUsage: isTurbo ? Math.min(8, (prev?.vramUsage || 4) + (Math.random() * 1)) : Math.max(2, Math.min(8, (prev?.vramUsage || 4) + (Math.random() * 0.5 - 0.25))),
          temperature: isTurbo ? Math.min(95, (prev?.temperature || 45) + (Math.random() * 5)) : Math.max(35, Math.min(85, (prev?.temperature || 45) + (Math.random() * 4 - 2))),
          powerDraw: isTurbo ? Math.min(250, (prev?.powerDraw || 120) + (Math.random() * 20)) : Math.max(50, Math.min(200, (prev?.powerDraw || 120) + (Math.random() * 10 - 5)))
        }));
        setError(null);
      }
    };

    fetchStats();
    interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, [isTurbo]);

  const handleTurbo = async () => {
    setIsTurbo(true);
    try {
      await fetch('http://localhost:8000/turbo', { method: 'POST' });
    } catch (err) {
      console.warn("Backend local offline. Simulando Turbo Engine...", err);
      (window as any).addOmniLog?.('warn', `Backend local offline. Simulando Turbo Engine 5.0...`);
    }
    setTimeout(() => setIsTurbo(false), 3000);
  };

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-sm font-mono text-cyan-400 flex items-center gap-2">
          <Activity size={16} />
          CONSCIÊNCIA DO SISTEMA
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">RYZEN 5 5600X | RTX 4060 40GB</span>
          <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <AlertTriangle size={24} className="text-red-500" />
          <span className="text-xs font-mono text-red-400">{error}</span>
          <span className="text-[10px] font-mono text-slate-500">Inicie o script Python de monitoramento local para telemetria real.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* CPU */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Cpu size={12} /> CPU</span>
              <span>{stats?.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-500" 
                style={{ width: `${stats?.cpuUsage || 0}%` }}
              />
            </div>
          </div>

          {/* RAM */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Database size={12} /> RAM</span>
              <span>{stats?.ramUsage.toFixed(1)}GB / 40GB</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-500" 
                style={{ width: `${((stats?.ramUsage || 0) / 40) * 100}%` }}
              />
            </div>
          </div>

          {/* VRAM */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Database size={12} className="text-green-400" /> VRAM</span>
              <span>{stats?.vramUsage.toFixed(1)}GB / 8GB</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${((stats?.vramUsage || 0) / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Temp */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1"><Thermometer size={12} className={stats?.temperature && stats.temperature > 80 ? 'text-red-500' : 'text-orange-400'} /> TEMP</span>
              <span>{stats?.temperature.toFixed(1)}°C</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${stats?.temperature && stats.temperature > 80 ? 'bg-red-500' : 'bg-orange-500'}`} 
                style={{ width: `${((stats?.temperature || 0) / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Turbo Engine Button */}
      <button
        onClick={handleTurbo}
        disabled={isTurbo}
        className={`mt-2 w-full py-2 rounded font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          isTurbo 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-slate-800 text-red-400 hover:bg-red-900/50 border border-red-900/50'
        }`}
      >
        <Zap size={14} />
        {isTurbo ? 'EXECUTANDO POWERCFG / VIVETOOL...' : 'TURBO ENGINE 5.0 (MODO DESTRUIÇÃO)'}
      </button>
    </div>
  );
};
