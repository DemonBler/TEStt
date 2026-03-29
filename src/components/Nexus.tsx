import React from "react";
import { motion } from "motion/react";
import { Share2, Radio, Twitch, Youtube, Monitor, ShieldCheck, Zap, Settings } from "lucide-react";
import { useSovereignStore } from "../store";

export const Nexus = () => {
  const isLive = useSovereignStore((state) => state.isLive);
  const toggleLive = useSovereignStore((state) => state.toggleLive);

  const ConnectionCard = ({ icon: Icon, label, status, color }: any) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border`} style={{ backgroundColor: `${color}20`, borderColor: `${color}50` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          <span className={`text-[10px] font-mono uppercase tracking-widest ${status === "connected" ? "text-green-400" : "text-red-400"}`}>
            {status}
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-mono text-white uppercase tracking-widest">{label}</h3>
        <p className="text-[10px] text-white/40 font-mono uppercase mt-1">Sovereign Link Active</p>
      </div>
      <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 uppercase hover:bg-white/10 hover:text-white transition-all">
        Configure Node
      </button>
    </motion.div>
  );

  return (
    <div className="h-full w-full flex flex-col gap-8 overflow-y-auto pr-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-neon-pink/20 flex items-center justify-center border border-neon-pink/50">
            <Share2 className="w-5 h-5 text-neon-pink" />
          </div>
          <div>
            <h2 className="text-lg font-mono text-neon-pink uppercase tracking-widest neon-text">Sovereign Nexus</h2>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">Connectivity & Broadcast Control</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLive}
          className={`px-8 py-3 rounded-xl font-mono text-xs uppercase tracking-[0.2em] border transition-all flex items-center gap-3 ${
            isLive 
              ? "bg-neon-pink/20 border-neon-pink text-neon-pink shadow-[0_0_20px_rgba(255,0,127,0.3)]" 
              : "bg-white/5 border-white/20 text-white/40"
          }`}
        >
          <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? "End Broadcast" : "Go Sovereign Live"}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConnectionCard icon={Twitch} label="Twitch Integration" status="connected" color="#9146FF" />
        <ConnectionCard icon={Youtube} label="YouTube Stream" status="disconnected" color="#FF0000" />
        <ConnectionCard icon={Monitor} label="OBS WebSocket" status="connected" color="#00f3ff" />
        <ConnectionCard icon={ShieldCheck} label="NVIDIA NIM Auth" status="connected" color="#76B900" />
        <ConnectionCard icon={Zap} label="VMC Proxy UDP" status="connected" color="#ff007f" />
        <ConnectionCard icon={Settings} label="Discord RPC" status="disconnected" color="#5865F2" />
      </div>

      {/* Elite Alertas Section */}
      <div className="glass p-8 rounded-2xl border border-white/5">
        <h3 className="text-[10px] font-mono text-neon-blue uppercase tracking-widest mb-6 flex items-center gap-2">
          <Zap className="w-3 h-3" /> Elite Alertas (Real-time)
        </h3>
        <div className="space-y-4">
          {[
            { user: "Kaelith", action: "Subscribed (Tier 3)", time: "2m ago", color: "neon-pink" },
            { user: "Zhyra", action: "Donated 500 Bits", time: "5m ago", color: "neon-blue" },
            { user: "VoidWalker", action: "Followed", time: "12m ago", color: "white/40" },
          ].map((alert, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`h-8 w-8 rounded-lg bg-${alert.color}/20 border border-${alert.color}/50 flex items-center justify-center`}>
                  <Zap className={`w-4 h-4 text-${alert.color}`} />
                </div>
                <div>
                  <p className="text-xs font-mono text-white uppercase tracking-widest group-hover:text-neon-blue transition-colors">{alert.user}</p>
                  <p className="text-[10px] font-mono text-white/40 uppercase">{alert.action}</p>
                </div>
              </div>
              <span className="text-[8px] font-mono text-white/20 uppercase">{alert.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
