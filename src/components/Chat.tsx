import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Mic, Headphones, MicOff, Play, List, Cpu, Zap, Image as ImageIcon, Music, Paperclip, Eye } from "lucide-react";
import { useSovereignStore } from "../store";
import { EXPRESSION_DICTIONARY } from "../lib/ExpressionDictionary";
import { generateLocalResponse, getLocalAI } from "../lib/localAIService";
import { loadSTT } from "../lib/localSTTService";
import { loadTTS } from "../lib/localTTSService";
import { quimeraCore } from "../lib/QuimeraCore";
import { connectTwitch, disconnectTwitch } from "../lib/twitchListener";
import { NeuralFlowMonitor } from "./NeuralFlowMonitor";

const ChatMessage = ({ msg }: { msg: any }) => (
  <motion.div
    initial={{ opacity: 0, x: msg.type === "user" ? 20 : -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex flex-col gap-1.5 ${msg.type === "user" ? "items-end text-right" : "items-start text-left"}`}
  >
    <div className="flex items-center gap-2 px-1">
      <span className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-40" style={{ color: msg.color }}>
        {msg.user}
      </span>
      <div className="w-[1px] h-2 bg-white/10" />
      <span className="text-[7px] font-mono text-white/20 uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div className={`group relative max-w-[95%] p-4 rounded-2xl border transition-all ${
        msg.type === "user" 
          ? "bg-white/5 border-white/10 rounded-tr-none hover:border-neon-blue/40" 
          : "bg-white/5 border-white/10 rounded-tl-none hover:border-neon-pink/40"
      }`}>
      <p className="text-xs font-mono text-white/80 leading-relaxed whitespace-pre-wrap selection:bg-neon-blue/30 selection:text-white">
        {msg.text}
      </p>
      <div className={`absolute top-0 h-full w-[2px] opacity-0 group-hover:opacity-100 transition-opacity ${
        msg.type === "user" ? "right-0 bg-neon-blue" : "left-0 bg-neon-pink"
      }`} />
    </div>
  </motion.div>
);

export const Chat = () => {
  const [input, setInput] = useState("");
  const isListening = useSovereignStore((state) => state.isListening);
  const isPlaying = useSovereignStore((state) => state.isPlaying);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const isProcessingFile = useSovereignStore((state) => state.isProcessing);
  const [isSTTLoading, setIsSTTLoading] = useState(false);
  const [sttProgress, setSTTProgress] = useState(0);
  const chatMessages = useSovereignStore((state) => state.chatMessages);
  const addChatMessage = useSovereignStore((state) => state.addChatMessage);
  const isLive = useSovereignStore((state) => state.isLive);
  const toggleLive = useSovereignStore((state) => state.toggleLive);
  const visionEnabled = useSovereignStore(state => state.visionEnabled);
  const visionSource = useSovereignStore(state => state.visionSource);
  const setVisionSource = useSovereignStore(state => state.setVisionSource);
  const twitchChannel = useSovereignStore(state => state.twitchChannel);
  const organismState = useSovereignStore(state => state.organismState);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Twitch Listener Queue
  const chatQueueRef = useRef<{user: string, message: string}[]>([]);
  
  useEffect(() => {
    if (videoRef.current) {
        quimeraCore.registerVisionSource(videoRef.current);
    }

    if (visionEnabled) {
      const getStream = visionSource === 'screen' 
        ? navigator.mediaDevices.getDisplayMedia({ video: true })
        : navigator.mediaDevices.getUserMedia({ video: true });

      getStream.then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(err => console.error(`${visionSource} Init Failed:`, err));
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
    }
  }, [visionEnabled, visionSource]);

  const [showDictionary, setShowDictionary] = useState(false);
  const loadingProgress = useSovereignStore(state => state.localAILoadingProgress);
  const setProgress = useSovereignStore(state => state.setLocalAILoadingProgress);
  const isLocalReady = useSovereignStore(state => state.isLocalAIReady);
  const setIsLocalReady = useSovereignStore(state => state.setIsLocalAIReady);

  useEffect(() => {
    if (!isLocalReady) {
       getLocalAI(setProgress).then(() => {
         setIsLocalReady(true);
       }).catch(e => {
         console.error("Critical Local AI Error:", e);
       });
    }
  }, [isLocalReady]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // Neural STT/TTS Initialization
    setIsSTTLoading(true);
    Promise.all([
      loadSTT((p) => setSTTProgress(p)),
      loadTTS() // Adicionando inicialização do TTS
    ]).then(() => {
      setIsSTTLoading(false);
    }).catch(e => {
       console.error("Local Pipeline Load Failure:", e);
       setIsSTTLoading(false);
    });

    if (isLive) {
      quimeraCore.wakeup();
    }

    const onIgnite = () => {
      quimeraCore.wakeup();
      startTwitchLoop();
    };
    window.addEventListener('neural_ignite', onIgnite);

    return () => {
      window.removeEventListener('neural_ignite', onIgnite);
      quimeraCore.stop();
    };
  }, [isLive]);

  const queueLoopRef = useRef<any>(null);
  const startTwitchLoop = () => {
    const processQueue = async () => {
       if (useSovereignStore.getState().isLive && useSovereignStore.getState().isPlaying === false && useSovereignStore.getState().isProcessing === false) {
           if (chatQueueRef.current.length > 0) {
               const nextMsg = chatQueueRef.current.shift();
               if (nextMsg) {
                  await handleSendDirect(`[Twitch Chat - ${nextMsg.user} disse]: ${nextMsg.message}`);
               }
           }
       }
       queueLoopRef.current = setTimeout(processQueue, 2000);
    };
    processQueue();
  };

  useEffect(() => {
    if (twitchChannel.length > 2 && isLive) {
       connectTwitch(twitchChannel, (user, msg) => {
         chatQueueRef.current.push({ user, message: msg });
       });
    } else {
       disconnectTwitch();
    }
  }, [twitchChannel, isLive]);

  const runTests = async () => {
    // Legacy tests preserved for kernel stability
  };

  const handleLiveToggle = () => {
    toggleLive();
    if (!isLive) {
       quimeraCore.wakeup();
    } else {
       quimeraCore.stop();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Legacy file support
  };

  const handleOfflineFeature = () => {
    // Legacy offline logic
  };

  const toggleAudioPlay = () => {
    if (!currentAudioRef.current) return;
    if (isAudioPaused) {
      currentAudioRef.current.play();
      setIsAudioPaused(false);
    } else {
      currentAudioRef.current.pause();
      setIsAudioPaused(true);
    }
  };

  const toggleMicMute = () => {
    setIsMicMuted(!isMicMuted);
  };

  const handleSendDirect = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    console.log("[Chat] Sending message:", textToSend);
    setInput("");
    quimeraCore.processText(textToSend);
    console.log("[Chat] Message sent to QuimeraCore");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSendDirect(input);
  };

  return (
    <div className="h-full w-full flex flex-col gap-6 relative">
      {/* Hidden Webcam Node for Vision Processor */}
      <video ref={videoRef} autoPlay playsInline muted className="webcam-hidden-capture" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/50">
            <Cpu className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-lg font-mono text-neon-blue uppercase tracking-widest neon-text">Núcleo Soberano</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">
                {isLocalReady ? 'Kernel Neural Uncensored (WebGPU)' : 'Sincronizando Pesos Locais...'}
              </p>
              <div className={`w-1.5 h-1.5 rounded-full ${isLocalReady ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSTTLoading && (
            <div className="flex items-center gap-2 bg-neon-blue/5 border border-neon-blue/20 px-3 py-1.5 rounded-lg">
               <Mic className="w-3 h-3 text-neon-blue animate-pulse" />
               <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-neon-blue transition-all" style={{ width: `${sttProgress}%` }} />
               </div>
               <span className="text-[8px] font-mono text-neon-blue">STT: {sttProgress}%</span>
            </div>
          )}
          {visionEnabled && (
            <button 
              onClick={() => setVisionSource(visionSource === 'webcam' ? 'screen' : 'webcam')}
              className="flex items-center gap-2 bg-neon-pink/10 border border-neon-pink/30 px-3 py-1.5 rounded-lg hover:bg-neon-pink/20 transition-all group"
            >
               <Eye className={`w-3 h-3 ${visionSource === 'webcam' ? 'text-neon-pink' : 'text-neon-blue'}`} />
               <span className="text-[8px] font-mono text-white/60 group-hover:text-white uppercase">
                 {visionSource === 'webcam' ? 'Webcam' : 'Compartilhar Tela'}
               </span>
            </button>
          )}
          {!isLocalReady && (
            <div className="flex items-center gap-3 bg-neon-pink/5 border border-neon-pink/20 px-3 py-1.5 rounded-lg">
               <Zap className="w-3 h-3 text-neon-pink animate-pulse" />
               <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-neon-pink transition-all" style={{ width: `${loadingProgress}%` }} />
               </div>
               <span className="text-[8px] font-mono text-neon-pink">{loadingProgress}%</span>
            </div>
          )}
          <button 
            type="button"
            onClick={() => setShowDictionary(!showDictionary)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase hover:bg-white/10 transition-colors"
          >
            <List className="w-3 h-3" />
            Livraria F.A.C.S
          </button>
          <button 
            type="button"
            onClick={runTests}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[10px] font-mono uppercase hover:bg-neon-blue/20 transition-colors"
          >
            <Play className="w-3 h-3" />
            Amostra Scriptada
          </button>
        </div>
      </div>

      {showDictionary && (
         <div className="absolute top-16 left-0 right-0 bottom-20 z-50 bg-black/90 backdrop-blur-md rounded-2xl border border-neon-pink/30 p-4 flex flex-col gap-4">
             <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <h3 className="text-sm font-mono text-neon-pink uppercase">Dicionário de Expressões Brutas ({EXPRESSION_DICTIONARY ? Object.keys(EXPRESSION_DICTIONARY).length : 0} Registros)</h3>
                 <button onClick={() => setShowDictionary(false)} className="text-white/50 hover:text-white text-xs font-mono">Fechar (X)</button>
             </div>
             <p className="text-[10px] text-white/50 font-mono">Clique em qualquer chave abaixo para injetar o sinal diretamente no VRM ExpressionManager em tempo real. Algumas chaves dependem da estrutura nativa do VRM (ARKit compatible).</p>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-2 pb-10">
                 {EXPRESSION_DICTIONARY && Object.keys(EXPRESSION_DICTIONARY).map((exprKey) => (
                    <button
                        key={exprKey}
                        className="text-left px-2 py-1.5 rounded bg-white/5 border border-white/5 hover:bg-neon-pink/20 hover:border-neon-pink/50 text-[10px] font-mono text-white/80 truncate transition-colors"
                        onClick={() => window.dispatchEvent(new CustomEvent('neural_action', { detail: { action: exprKey } }))}
                        title={exprKey}
                    >
                        {exprKey}
                    </button>
                 ))}
             </div>
         </div>
      )}
      
      <NeuralFlowMonitor />

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-hide">
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5">
          <div className={`h-9 px-3 rounded-lg flex items-center gap-2 transition-colors bg-purple-500/20 text-purple-400 border border-purple-500/30`}>
             <Cpu className={`w-3 h-3 animate-pulse`} />
             <span className="text-[8px] font-mono">COGNITIVO</span>
          </div>
          <div className={`h-9 px-3 rounded-lg flex items-center gap-2 transition-colors bg-neon-pink/20 text-neon-pink border border-neon-pink/30`}>
             <Bot className={`w-3 h-3 animate-pulse`} />
             <span className="text-[8px] font-mono">LÍMBICO</span>
          </div>
        </div>
        
        {isPlaying && (
          <button 
             type="button"
             onClick={toggleAudioPlay}
             className="h-10 w-10 rounded-xl border border-neon-pink/30 bg-neon-pink/5 text-neon-pink flex items-center justify-center hover:bg-neon-pink/20 transition-all shadow-[0_0_10px_rgba(255,0,127,0.2)]">
            {isAudioPaused ? <Play className="w-4 h-4" /> : <div className="flex gap-1"><div className="w-1 h-3 bg-neon-pink rounded-full"/><div className="w-1 h-3 bg-neon-pink rounded-full"/></div>}
          </button>
        )}
        
        <button 
           type="button"
           onClick={handleLiveToggle}
           className={`h-10 px-4 rounded-xl border flex items-center gap-2 transition-colors ${
             isLive
             ? 'bg-neon-pink/30 border-neon-pink text-white hover:bg-neon-pink/40 shadow-[0_0_15px_#ff007f]'
             : 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20'
           }`}>
          <Headphones className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-mono uppercase">{isLive ? "Disconnect" : "Live Feed"}</span>
        </button>
        <button 
           type="button"
           onClick={handleOfflineFeature}
           className="h-10 px-4 rounded-xl border border-neon-blue/30 bg-neon-blue/5 text-neon-blue font-mono text-[10px] uppercase flex items-center gap-2"
        >
          <Music className="w-4 h-4" /> Music
        </button>
        <div className="flex-1" />
        <label className={`h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-white/40 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all ${isProcessingFile ? 'animate-pulse' : ''}`}>
           <Paperclip className="w-4 h-4" />
           <span className="text-[10px] font-mono uppercase">{isProcessingFile ? 'Processando' : 'Multimodal'}</span>
           <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*" />
        </label>
      </div>

      <form onSubmit={handleSend} className="relative group">
        <div className="relative glass rounded-2xl border border-white/10 p-2 flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isLocalReady}
            placeholder={isLocalReady ? "Injetar comando neural..." : "Carregando núcleos neurais..."}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-white/20 uppercase tracking-widest disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            className="h-10 w-10 rounded-xl bg-neon-pink/20 flex items-center justify-center border border-neon-pink/50 text-neon-pink"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};
