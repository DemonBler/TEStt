import React, { useEffect, useState } from "react";
import { useSovereignStore } from "../store";
import { motion } from "motion/react";
import { Cpu, Zap, Activity, Monitor, Thermometer, HardDrive } from "lucide-react";

export const Telemetry = () => {
  const telemetry = useSovereignStore((state) => state.telemetry);
  const [sysInfo, setSysInfo] = useState<any>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch("/api/telemetry");
        const data = await response.json();
        setSysInfo(data);
      } catch (error) {
        console.error("[Telemetry] Fetch Error:", error);
      }
    };

    const interval = setInterval(fetchTelemetry, 2000);
    fetchTelemetry();
    return () => clearInterval(interval);
  }, []);

  const CircularRing = ({ value, max, label, color, icon: Icon }: any) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return (
      <div className="flex flex-col items-center gap-4 group">
        <div className="relative h-32 w-32 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="8"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="w-5 h-5 mb-1 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color }} />
            <span className="text-xs font-mono font-bold" style={{ color }}>{Math.round((value / max) * 100)}%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</p>
          <p className="text-[8px] font-mono text-white/20 uppercase">{Math.round(value / (1024 * 1024 * 1024))}GB / {Math.round(max / (1024 * 1024 * 1024))}GB</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col gap-8 overflow-y-auto pr-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/50">
            <Activity className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-lg font-mono text-neon-blue uppercase tracking-widest neon-text">Hardware Telemetry</h2>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">Extreme Canary / Kernal Level Audit</p>
          </div>
        </div>
        <div className="glass px-4 py-2 rounded-lg border border-white/5">
          <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">System Status: </span>
          <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Sovereign / Stable</span>
        </div>
      </div>

      {/* Main Rings Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-6">
          <h3 className="text-[10px] font-mono text-neon-blue uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-3 h-3" /> Processor Load
          </h3>
          <CircularRing 
            value={sysInfo?.cpu?.load || 0} 
            max={100} 
            label="Ryzen 5 5600X" 
            color="#00f3ff" 
            icon={Cpu} 
          />
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/40 uppercase">
              <span>Core Temp</span>
              <span className="text-neon-blue">{sysInfo?.cpu?.temp || 0}°C</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-blue"
                animate={{ width: `${sysInfo?.cpu?.temp || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-6">
          <h3 className="text-[10px] font-mono text-neon-pink uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> Memory Matrix
          </h3>
          <CircularRing 
            value={sysInfo?.mem?.active || 0} 
            max={sysInfo?.mem?.total || 40 * 1024 * 1024 * 1024} 
            label="40GB RAM Pool" 
            color="#ff007f" 
            icon={Zap} 
          />
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/40 uppercase">
              <span>Swap Usage</span>
              <span className="text-neon-pink">{Math.round((sysInfo?.mem?.swapused || 0) / (1024 * 1024 * 1024))}GB</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-pink"
                animate={{ width: `${((sysInfo?.mem?.swapused || 0) / (sysInfo?.mem?.swaptotal || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-6">
          <h3 className="text-[10px] font-mono text-neon-purple uppercase tracking-widest flex items-center gap-2">
            <Monitor className="w-3 h-3" /> GPU Tensor Core
          </h3>
          <CircularRing 
            value={sysInfo?.gpu?.[0]?.utilization || 0} 
            max={100} 
            label="RTX 4060 Ada" 
            color="#9d00ff" 
            icon={Monitor} 
          />
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/40 uppercase">
              <span>VRAM Used</span>
              <span className="text-neon-purple">{sysInfo?.gpu?.[0]?.vram || 0}MB</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-purple"
                animate={{ width: `${((sysInfo?.gpu?.[0]?.vram || 0) / 12288) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="glass p-6 rounded-2xl border border-white/5">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Monitor className="w-3 h-3" /> Neural Reaction Time (ECG)
        </h3>
        <div className="h-32 w-full relative overflow-hidden flex items-end gap-1">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-neon-blue/20 rounded-t-sm"
              animate={{ height: [10, Math.random() * 80 + 20, 10] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-neon-blue neon-text">0.82ms</p>
              <p className="text-[8px] font-mono text-white/40 uppercase">Average Latency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Blueprint (Simulated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-24 h-24" />
          </div>
          <h4 className="text-[10px] font-mono text-neon-blue uppercase tracking-widest mb-4">CPU Architecture</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">Model</span>
              <span className="text-[10px] font-mono text-white uppercase">{sysInfo?.cpu?.brand || "AMD Ryzen 5 5600X"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">Cores / Threads</span>
              <span className="text-[10px] font-mono text-white uppercase">6 / 12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">L3 Cache</span>
              <span className="text-[10px] font-mono text-white uppercase">32MB</span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Monitor className="w-24 h-24" />
          </div>
          <h4 className="text-[10px] font-mono text-neon-purple uppercase tracking-widest mb-4">GPU Architecture</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">Model</span>
              <span className="text-[10px] font-mono text-white uppercase">{sysInfo?.gpu?.[0]?.model || "NVIDIA RTX 4060"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">Tensor Cores</span>
              <span className="text-[10px] font-mono text-white uppercase">96 (Ada Lovelace)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60 uppercase">Driver Build</span>
              <span className="text-[10px] font-mono text-white uppercase">551.23 (Canary)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
