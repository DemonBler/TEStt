import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Bot, Terminal, Shield } from "lucide-react";
import { useSovereignStore } from "../store";

export const Chat = () => {
  const [input, setInput] = useState("");
  const chatMessages = useSovereignStore((state) => state.chatMessages);
  const addChatMessage = useSovereignStore((state) => state.addChatMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addChatMessage({
      id: Date.now(),
      user: "Drevlan",
      text: input,
      type: "user",
      color: "#00f3ff",
    });

    // Simulate AI Response (Cyber-Fofo)
    setTimeout(() => {
      addChatMessage({
        id: Date.now() + 1,
        user: "Vaelindra",
        text: "Comando recebido. Processando via NVIDIA ACE...",
        type: "ai",
        color: "#ff007f",
      });
    }, 1000);

    setInput("");
  };

  return (
    <div className="h-full w-full flex flex-col gap-6 relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-neon-pink/20 flex items-center justify-center border border-neon-pink/50">
            <Bot className="w-5 h-5 text-neon-pink" />
          </div>
          <div>
            <h2 className="text-lg font-mono text-neon-pink uppercase tracking-widest neon-text">Neural Chat</h2>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">Ollama / ACE Integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">AI Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-thin scrollbar-thumb-neon-pink/20"
      >
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`flex flex-col gap-2 ${msg.type === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 px-2">
                {msg.type === "ai" ? (
                  <Bot className="w-3 h-3 text-neon-pink" />
                ) : msg.type === "system" ? (
                  <Terminal className="w-3 h-3 text-neon-blue" />
                ) : (
                  <User className="w-3 h-3 text-neon-blue" />
                )}
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-60" style={{ color: msg.color }}>
                  {msg.user}
                </span>
                <span className="text-[8px] font-mono text-white/20 uppercase">12:04:22</span>
              </div>
              <div 
                className={`max-w-[80%] p-4 rounded-2xl glass border border-white/5 relative group ${
                  msg.type === "user" ? "rounded-tr-none border-neon-blue/20" : "rounded-tl-none border-neon-pink/20"
                }`}
              >
                <p className="text-sm font-mono text-white/90 leading-relaxed">{msg.text}</p>
                
                {/* Message HUD Decor */}
                <div className={`absolute top-0 ${msg.type === "user" ? "right-0" : "left-0"} p-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <Shield className="w-2 h-2 text-white/20" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="relative group">
        <div className="absolute inset-0 bg-neon-pink/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative glass rounded-2xl border border-white/10 p-2 flex items-center gap-4 focus-within:border-neon-pink/50 transition-all">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Terminal className="w-4 h-4 text-white/40" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Injetar comando neural..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-white/20 uppercase tracking-widest"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            className="h-10 w-10 rounded-xl bg-neon-pink/20 flex items-center justify-center border border-neon-pink/50 text-neon-pink hover:bg-neon-pink/40 transition-all"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>

      {/* Bottom HUD Decor */}
      <div className="flex justify-between items-center px-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-neon-pink/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-neon-pink" animate={{ width: ["20%", "80%", "40%"] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Buffer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-neon-blue/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-neon-blue" animate={{ width: ["10%", "90%", "30%"] }} transition={{ duration: 3, repeat: Infinity }} />
            </div>
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Entropy</span>
          </div>
        </div>
        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Vaelindra Sovereign Core v5.0</span>
      </div>
    </div>
  );
};
