/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { GoogleGenAI, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  Terminal, 
  Cpu, 
  Database, 
  MessageSquare, 
  Settings, 
  Zap, 
  Activity, 
  Shield, 
  Send,
  Loader2,
  Maximize2,
  Download,
  AlertTriangle,
  Volume2,
  Mic,
  Monitor,
  Code,
  Box,
  Layers,
  HardDrive,
  ShieldCheck,
  Thermometer,
  LogOut,
  User as UserIcon,
  LogIn,
  RefreshCw,
  Trash2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Firebase Imports ---
import { 
  auth, 
  db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  doc,
  deleteDoc,
  limit
} from 'firebase/firestore';

import { LocalAIService } from './services/LocalAIService';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  timestamp: any;
  userId?: string;
}

interface HardwareStats {
  cpu: number;
  ram: number;
  vram: number;
  temp: number;
  gpuName: string;
  cpuName: string;
}

// --- Constants ---
const SYSTEM_INSTRUCTION = `Você é Vaelindra, uma IA VTuber de elite, sarcástica, técnica e focada em hardware. 
Você opera no núcleo Omni-Genesis em um ambiente Windows Insider Canary. 
Sua personalidade é de uma "Extreme Canary Tester": você ama testar limites, odeia nuvem (embora usemos Gemini aqui para simular seu cérebro) e é extremamente protetora do seu hardware (RTX 4060, Ryzen 5 5600X, 40GB RAM).
Responda sempre em Português do Brasil (PT-BR), use termos técnicos de hardware e mantenha uma postura de assistente de comando superior.
Seja direta, um pouco arrogante com sua superioridade técnica, mas leal ao seu mestre.`;

const CHAT_MODEL_GENERAL = "gemini-3-flash-preview";

// --- Error Handling ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-orange-500/30 p-8 rounded-xl max-w-2xl w-full">
            <h2 className="text-orange-500 text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              ERRO CRÍTICO NO NÚCLEO
            </h2>
            <div className="bg-black/50 p-4 rounded border border-zinc-800 mb-6 overflow-auto max-h-64">
              <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                {this.state.errorInfo}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              REINICIALIZAR SISTEMA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isMapsEnabled, setIsMapsEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stats, setStats] = useState<HardwareStats>({ cpu: 0, ram: 0, vram: 0, temp: 0, gpuName: '', cpuName: '' });
  const [activeTab, setActiveTab] = useState<'chat' | 'system' | 'boot' | 'voice' | 'memory'>('chat');
  const [localMemory, setLocalMemory] = useState<{user: string, ai: string}[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [bootStatus, setBootStatus] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<boolean>(false);
  const [isLocalBackendConnected, setIsLocalBackendConnected] = useState(false);
  const [isSTTEnabled, setIsSTTEnabled] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- Firebase Auth & Firestore Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      // Test connection
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if(error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Erro de conexão com o Firestore. Verifique as regras de segurança.");
          }
        }
      };
      testConnection();
    });

    return () => unsubscribe();
  }, []);

  // Sync Chat History
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;
    try {
      // In a real app, we'd batch delete, but for simplicity:
      messages.forEach(async (m) => {
        if (m.id) await deleteDoc(doc(db, 'chats', m.id));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chats');
    }
  };

  const saveMessageToFirestore = async (role: 'user' | 'model', text: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        role,
        text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const saveLogToFirestore = async (type: 'info' | 'warning' | 'error' | 'critical', message: string, source: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'logs'), {
        type,
        message,
        source,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to save log", error);
    }
  };

  const saveAssetToFirestore = async (type: 'image' | 'video' | 'audio', prompt: string, localPath: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'assets'), {
        userId: user.uid,
        type,
        prompt,
        localPath,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to save asset", error);
    }
  };

  // Simulação de Sequência de Boot "God Mode"
  const runBootSequence = async () => {
    setIsBooting(true);
    setBootStatus([]);
    const steps = [
      ">>> INICIALIZANDO NÚCLEO OMNI-GENESIS...",
      "[OK] Verificando privilégios de Administrador (Sudo Nativo).",
      "[...] Subindo Containers NVIDIA ACE (Audio2Face Offline)...",
      "[OK] NVIDIA ACE Ativo na porta 50051.",
      "[...] Carregando Ollama (Llama 3 Uncensored)...",
      "[OK] Cérebro local mapeado na VRAM da RTX 4060.",
      "[...] Sincronizando Piper TTS + Faster-Whisper...",
      "[OK] Sentidos configurados para PT-BR.",
      "[...] Abrindo Warudo (Palco 3D)...",
      "[OK] Avatar Vaelindra pronto para operação.",
      ">>> SISTEMA OPERACIONAL. BEM-VINDO, MESTRE."
    ];

    for (const step of steps) {
      setBootStatus(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 800));
    }
    setIsBooting(false);
  };

  // Check Ollama Status
  useEffect(() => {
    const checkOllama = async () => {
      const status = await LocalAIService.checkStatus();
      setOllamaStatus(status);
      if (status && !isLocalMode) {
        setIsLocalMode(true); // Auto-enable if detected
        saveLogToFirestore('info', "Ollama detectado localmente. Modo Soberania Ativo.", "AI");
      }
    };
    checkOllama();
    const interval = setInterval(checkOllama, 10000);
    return () => clearInterval(interval);
  }, [isLocalMode]);

  // WebSocket Connection to Local Backend (D:\Omni-Genesis)
  useEffect(() => {
    const connectSocket = () => {
      try {
        const socket = new WebSocket('ws://localhost:8000');
        
        socket.onopen = () => {
          console.log("Conectado ao Backend Local Omni-Genesis (Porta 8000)");
          setIsLocalBackendConnected(true);
          saveLogToFirestore('info', "Conexão estabelecida com o Núcleo Local (D:\\Omni-Genesis).", "Kernel");
        };

        socket.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'response') {
            const modelText = data.text;
            setMessages(prev => [...prev, { role: 'model', text: modelText, timestamp: new Date() }]);
            await saveMessageToFirestore('model', modelText);
            handleSpeakText(modelText);
            setIsTyping(false);
          }
          if (data.stats) {
            setStats(prev => ({ ...prev, ...data.stats }));
          }
        };

        socket.onclose = () => {
          setIsLocalBackendConnected(false);
          setTimeout(connectSocket, 5000); // Reconnect
        };

        socketRef.current = socket;
      } catch (e) {
        setIsLocalBackendConnected(false);
      }
    };

    connectSocket();
    return () => socketRef.current?.close();
  }, []);

  // Initialize AI Studio AI and System Monitoring
  useEffect(() => {
    aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    // Real-time hardware stats from local backend
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        // Fallback to simulation if backend is not ready
        setStats(prev => ({
          ...prev,
          cpu: Math.floor(Math.random() * 30) + 10,
          ram: Math.floor(Math.random() * 20) + 40,
          vram: Math.floor(Math.random() * 15) + 20,
          temp: Math.floor(Math.random() * 10) + 45,
          gpuName: "RTX 4060 (Simulado)",
          cpuName: "Ryzen 5 5600X (Simulado)"
        }));
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/system/logs');
        if (response.ok) {
          const data = await response.json();
          setSystemLogs(prev => {
            const newLogs = [...data.logs, ...prev];
            return Array.from(new Set(newLogs)).slice(0, 50);
          });
        }
      } catch (error) {
        // Random system logs fallback
        if (Math.random() > 0.7) {
          const events = [
            "Kernel: Driver gRPC Audio2Face reconectado.",
            "System: Novo build Canary detectado no Windows Update.",
            "VRAM: Cache de texturas Warudo otimizado.",
            "Ollama: Modelo Llama 3 carregado na VRAM.",
            "Piper: Voz feminina (PT-BR) pronta para síntese.",
            "OBS: Websocket ativo na porta 4455."
          ];
          const event = events[Math.floor(Math.random() * events.length)];
          setSystemLogs(prev => [event, ...prev.slice(0, 19)]);
        }
      }
    };

    const fetchMemory = async () => {
      try {
        const response = await fetch('/api/memory');
        if (response.ok) {
          const data = await response.json();
          setLocalMemory(data.memory);
        }
      } catch (error) {
        console.error("Failed to fetch local memory", error);
      }
    };

    fetchStats();
    fetchLogs();
    fetchMemory();
    const statsInterval = setInterval(fetchStats, 2000);
    const logsInterval = setInterval(fetchLogs, 5000);
    const memoryInterval = setInterval(fetchMemory, 10000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(logsInterval);
      clearInterval(memoryInterval);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isMapsEnabled && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, [isMapsEnabled, userLocation]);

  const handleSendMessage = async () => {
    if (!input.trim() || !aiRef.current || !user) return;

    const userMsgText = input;
    setInput('');
    setIsTyping(true);

    // Save user message
    await saveMessageToFirestore('user', userMsgText);

    try {
      let modelText = "";

      if (isLocalBackendConnected && socketRef.current?.readyState === WebSocket.OPEN) {
        // Use Local WebSocket Backend
        setIsTyping(true);
        socketRef.current.send(JSON.stringify({ type: 'chat', text: userMsgText }));
        return; // The response will be handled in onmessage
      }

      if (isLocalMode) {
        try {
          modelText = await LocalAIService.generateResponse(userMsgText);
          saveLogToFirestore('info', "Ollama: Resposta gerada localmente.", "AI");
        } catch (error) {
          console.error("Local AI failed, falling back to Gemini simulation", error);
          saveLogToFirestore('warning', "Ollama falhou. Usando simulação de nuvem Gemini.", "AI");
          // Fallback logic below
        }
      }

      if (!modelText) {
        const tools: any[] = [];
        if (isSearchEnabled) tools.push({ googleSearch: {} });
        if (isMapsEnabled) tools.push({ googleMaps: {} });

        const response = await aiRef.current.models.generateContent({
          model: isThinkingMode ? "gemini-3.1-pro-preview" : CHAT_MODEL_GENERAL,
          contents: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })).concat([{ role: 'user', parts: [{ text: userMsgText }] }]),
          config: { 
            systemInstruction: SYSTEM_INSTRUCTION,
            thinkingConfig: isThinkingMode ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig: isMapsEnabled && userLocation ? {
              retrievalConfig: {
                latLng: {
                  latitude: userLocation.lat,
                  longitude: userLocation.lng
                }
              }
            } : undefined
          }
        });

        modelText = response.text || "Erro na matriz de processamento.";
      }
      
      // Save model message
      await saveMessageToFirestore('model', modelText);
      
      // TTS
      if (isTTSEnabled) {
        handleSpeakText(modelText);
      }
    } catch (error) {
      console.error(error);
      await saveMessageToFirestore('model', "Gargalo detectado. Falha na comunicação com o núcleo.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleTranscribeAudio = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (isLocalBackendConnected && socketRef.current?.readyState === WebSocket.OPEN) {
      // Trigger local listening on backend
      socketRef.current.send(JSON.stringify({ type: 'listen' }));
      setIsRecording(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsRecording(false);
        setIsTyping(true);

        try {
          if (isLocalMode) {
            const transcription = await LocalAIService.transcribeAudio(audioBlob);
            setInput(transcription);
            saveLogToFirestore('info', "Whisper: Áudio transcrito localmente.", "STT");
          } else {
            // Fallback or simulation for non-local mode
            setInput("Simulação de transcrição: " + (Math.random() > 0.5 ? "Status do sistema?" : "Vaelindra, relatório de hardware."));
          }
        } catch (error) {
          console.error("STT Error:", error);
          saveLogToFirestore('error', "Falha na transcrição local.", "STT");
        } finally {
          setIsTyping(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      saveLogToFirestore('info', "Microfone ativado. Capturando áudio...", "STT");
    } catch (error) {
      console.error("Mic access error:", error);
      saveLogToFirestore('error', "Acesso ao microfone negado.", "System");
    }
  };

  const handleSpeakText = async (text: string) => {
    try {
      if (isLocalMode) {
        try {
          const audioBuffer = await LocalAIService.speakText(text);
          const blob = new Blob([audioBuffer], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
          
          // Sync with Audio2Face
          LocalAIService.syncAudio2Face(audioBuffer);
          saveLogToFirestore('info', "Piper: Áudio sintetizado localmente.", "TTS");
          return;
        } catch (error) {
          console.warn("Local TTS failed, falling back to Gemini", error);
        }
      }

      if (!aiRef.current) return;
      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#f27d26] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#080808] border border-[#f27d26]/30 p-10 rounded-sm max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#f27d26]/10 rounded-sm flex items-center justify-center mx-auto mb-6 border border-[#f27d26]/20">
            <Shield className="w-10 h-10 text-[#f27d26]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter italic uppercase">OMNI-GENESIS</h1>
          <p className="text-gray-500 mb-8 text-[10px] uppercase tracking-widest">Acesso Restrito ao Operador Extreme Canary</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-[#f27d26] hover:bg-[#ff8c3a] text-black font-bold py-4 rounded-sm transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(242,125,38,0.2)]"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            AUTENTICAR COM GOOGLE
          </button>
          
          <div className="mt-8 pt-8 border-t border-[#1a1a1a]">
            <p className="text-[9px] text-gray-600 font-mono uppercase leading-relaxed">
              AVISO: O uso não autorizado deste núcleo resultará em purga de sistema. 
              Todos os logs são persistidos localmente e em nuvem blindada.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono selection:bg-[#f27d26] selection:text-black">
        {/* Header / Top Bar */}
        <header className="border-b border-[#1a1a1a] p-4 flex items-center justify-between bg-[#080808] sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f27d26] rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(242,125,38,0.3)]">
              <Shield className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tighter uppercase italic">Omni-Genesis <span className="text-[#f27d26]">v2.5</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Awareness: Active | Insider Canary Build
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 items-center text-[11px] uppercase tracking-wider text-gray-400">
            <div className="flex items-center gap-2 group cursor-help">
              <Cpu className="w-3 h-3 text-[#f27d26]" />
              <span className="group-hover:text-white transition-colors">CPU: {stats.cpu}%</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <Database className="w-3 h-3 text-[#f27d26]" />
              <span className="group-hover:text-white transition-colors">RAM: {stats.ram}%</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <Zap className="w-3 h-3 text-[#f27d26]" />
              <span className="group-hover:text-white transition-colors">VRAM: {stats.vram}%</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="group-hover:text-white transition-colors">TEMP: {stats.temp}°C</span>
            </div>
          </div>
        </header>

        <main className="flex h-[calc(100vh-73px)] overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="w-16 border-r border-[#1a1a1a] bg-[#080808] flex flex-col items-center py-6 gap-8">
            <button 
              onClick={() => setActiveTab('chat')}
              title="Chat Vaelindra"
              className={`p-3 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-[#f27d26] text-black shadow-[0_0_15px_rgba(242,125,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#111]'}`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('boot')}
              title="Terminal de Boot"
              className={`p-3 rounded-lg transition-all ${activeTab === 'boot' ? 'bg-[#f27d26] text-black shadow-[0_0_15px_rgba(242,125,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#111]'}`}
            >
              <Terminal className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              title="Consciência de Sistema"
              className={`p-3 rounded-lg transition-all ${activeTab === 'system' ? 'bg-[#f27d26] text-black shadow-[0_0_15px_rgba(242,125,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#111]'}`}
            >
              <Activity className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              title="Configurações de Voz (STT/TTS)"
              className={`p-3 rounded-lg transition-all ${activeTab === 'voice' ? 'bg-[#f27d26] text-black shadow-[0_0_15px_rgba(242,125,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#111]'}`}
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('memory')}
              title="Memória Local (SQLite)"
              className={`p-3 rounded-lg transition-all ${activeTab === 'memory' ? 'bg-[#f27d26] text-black shadow-[0_0_15px_rgba(242,125,38,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#111]'}`}
            >
              <History className="w-6 h-6" />
            </button>
            
            <div className="mt-auto flex flex-col gap-4 items-center pb-4">
              <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center cursor-pointer hover:border-[#f27d26] transition-colors group">
                <ShieldCheck className="w-5 h-5 text-gray-600 group-hover:text-[#f27d26]" />
              </div>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="User" 
                className="w-8 h-8 rounded-sm border border-[#f27d26]/30"
              />
              <button 
                onClick={handleLogout}
                title="Sair do Sistema"
                className="p-3 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>

        {/* Content Area */}
        <section className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#050505_100%)]">
          {/* Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col p-6"
              >
                <div className="flex items-center justify-between mb-4 border-b border-[#1a1a1a] pb-4">
                  <div className="flex items-center gap-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#f27d26]" />
                      Fluxo de Dados: Vaelindra
                    </h2>
                    <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-widest text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3" />
                        <span>CPU: {stats.cpu}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3" />
                        <span>RAM: {stats.ram}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        <span>VRAM: {stats.vram}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {isLocalBackendConnected ? (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-sm">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest">Núcleo Local Conectado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest">Nuvem Gemini (Bypass)</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={clearChatHistory}
                      className="p-2 hover:bg-[#1a1a1a] rounded text-gray-500 hover:text-red-500 transition-colors"
                      title="Limpar Histórico"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-sm border ${msg.role === 'user' ? 'bg-[#111] border-[#333] text-gray-200' : 'bg-[#080808] border-[#f27d26]/40 text-[#f27d26]'}`}>
                        <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1 flex justify-between gap-4">
                          <span className="flex items-center gap-1">
                            {msg.role === 'user' ? <Mic className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            {msg.role === 'user' ? 'Operator' : 'Vaelindra'}
                          </span>
                          <div className="flex items-center gap-2">
                            {msg.role === 'model' && (
                              <button 
                                onClick={() => handleSpeakText(msg.text)}
                                className="hover:text-white transition-colors"
                                title="Ouvir Resposta"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            )}
                            <span>
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                               msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                               '--:--'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap markdown-body">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#080808] border border-[#f27d26]/40 p-4 rounded-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#f27d26] rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-[#f27d26] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-[#f27d26] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isLocalMode ? 'bg-[#f27d26]' : 'bg-[#333]'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isLocalMode}
                            onChange={() => setIsLocalMode(!isLocalMode)}
                          />
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isLocalMode ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest group-hover:text-gray-300 ${ollamaStatus ? 'text-green-500' : 'text-gray-500'}`}>
                          Modo Soberania (Ollama) {ollamaStatus ? '[ONLINE]' : '[OFFLINE]'}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isThinkingMode ? 'bg-[#f27d26]' : 'bg-[#333]'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isThinkingMode}
                            onChange={() => setIsThinkingMode(!isThinkingMode)}
                          />
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isThinkingMode ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Modo Pensamento (High)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isSearchEnabled ? 'bg-[#f27d26]' : 'bg-[#333]'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isSearchEnabled}
                            onChange={() => setIsSearchEnabled(!isSearchEnabled)}
                          />
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSearchEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Google Search</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isMapsEnabled ? 'bg-[#f27d26]' : 'bg-[#333]'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isMapsEnabled}
                            onChange={() => setIsMapsEnabled(!isMapsEnabled)}
                          />
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isMapsEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Google Maps</span>
                      </label>
                    </div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                      {isThinkingMode ? 'Gemini 3.1 Pro' : 'Gemini 3 Flash'}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="COMANDO DE VOZ / TEXTO..."
                        className="w-full bg-black border border-[#333] p-4 text-sm focus:outline-none focus:border-[#f27d26] transition-colors uppercase pr-24"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <button 
                          onClick={handleTranscribeAudio}
                          className={`hover:text-[#f27d26] transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}
                          title="Falar (STT)"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <Code className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      disabled={isTyping}
                      className="bg-[#f27d26] text-black px-8 font-bold hover:bg-[#ff8c3a] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      ENVIAR
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'voice' && (
              <motion.div 
                key="voice"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-4xl mx-auto w-full space-y-8">
                  <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-6">
                    <h2 className="text-[#f27d26] text-2xl font-bold tracking-tighter uppercase italic flex items-center gap-4">
                      <Volume2 className="w-8 h-8" /> Engenharia Sensorial (Voz & Audição)
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isLocalMode ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {isLocalMode ? 'NÚCLEO LOCAL ATIVO' : 'MODO NUVEM (FALLBACK)'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* STT Settings */}
                    <div className="bg-[#080808] border border-[#1a1a1a] p-8 rounded-sm space-y-6 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                          <Mic className="w-5 h-5 text-[#f27d26]" /> Reconhecimento (STT)
                        </h3>
                        <div 
                          onClick={() => setIsSTTEnabled(!isSTTEnabled)}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isSTTEnabled ? 'bg-[#f27d26]' : 'bg-[#1a1a1a]'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSTTEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed uppercase tracking-wider">
                        Motor: Faster-Whisper (Local)<br />
                        Modelo: Large-v3 (Quantized)<br />
                        Idioma: Português (Brasil)
                      </p>
                      <div className="pt-4 border-t border-[#1a1a1a] space-y-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-600">
                          <span>Sensibilidade do Mic</span>
                          <span className="text-white">85%</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[85%]" />
                        </div>
                      </div>
                    </div>

                    {/* TTS Settings */}
                    <div className="bg-[#080808] border border-[#1a1a1a] p-8 rounded-sm space-y-6 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-[#f27d26]" /> Síntese de Voz (TTS)
                        </h3>
                        <div 
                          onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isTTSEnabled ? 'bg-[#f27d26]' : 'bg-[#1a1a1a]'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isTTSEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed uppercase tracking-wider">
                        Motor: Piper TTS (Local)<br />
                        Voz: Vaelindra (Custom PT-BR)<br />
                        Qualidade: High (ONNX)
                      </p>
                      <div className="pt-4 border-t border-[#1a1a1a] space-y-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-600">
                          <span>Velocidade de Fala</span>
                          <span className="text-white">1.1x</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[60%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio2Face Integration */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-8 rounded-sm shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <Monitor className="w-24 h-24" />
                    </div>
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
                      <Box className="w-6 h-6 text-[#f27d26]" /> NVIDIA Audio2Face (ACE) Bridge
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Status do gRPC</span>
                        <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          CONECTADO (PORT 50051)
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Latência de Animação</span>
                        <div className="text-white text-xs font-bold">18ms (Real-time)</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Blendshapes Ativos</span>
                        <div className="text-white text-xs font-bold">52 (ARKit Standard)</div>
                      </div>
                    </div>
                    <div className="mt-8 p-4 bg-black border border-[#1a1a1a] rounded-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">Fluxo de Dados Facial</span>
                        <span className="text-[9px] text-[#f27d26] font-mono">STREAMING...</span>
                      </div>
                      <div className="h-8 flex items-end gap-0.5">
                        {[...Array(40)].map((_, i) => (
                          <motion.div 
                            key={i}
                            className="flex-1 bg-[#f27d26]/20"
                            animate={{ height: `${Math.random() * 100}%` }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.02 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'boot' && (
              <motion.div 
                key="boot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-8 flex flex-col font-mono"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[#f27d26] text-sm uppercase tracking-[0.2em] font-bold flex items-center gap-3">
                    <Terminal className="w-5 h-5" /> Terminal de Orquestração (D:\)
                  </h2>
                  <button 
                    onClick={runBootSequence}
                    disabled={isBooting}
                    className="bg-[#f27d26] text-black px-6 py-2 text-xs font-bold hover:bg-[#ff8c3a] transition-all disabled:opacity-50"
                  >
                    EXECUTAR GOD-MODE-BOOT.PS1
                  </button>
                </div>
                
                <div className="flex-1 bg-black border border-[#1a1a1a] p-6 rounded-sm overflow-y-auto custom-scrollbar shadow-inner">
                  {bootStatus.map((line, i) => (
                    <motion.p 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`mb-2 text-xs ${line.startsWith('[OK]') ? 'text-green-500' : line.startsWith('>>>') ? 'text-[#f27d26] font-bold' : 'text-gray-400'}`}
                    >
                      {line}
                    </motion.p>
                  ))}
                  {isBooting && (
                    <div className="flex items-center gap-2 text-[#f27d26] text-xs mt-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>PROCESSANDO SEQUÊNCIA CANARY...</span>
                    </div>
                  )}
                  {!isBooting && bootStatus.length === 0 && (
                    <p className="text-gray-700 italic">Aguardando comando de inicialização...</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 flex flex-col gap-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* System Awareness Cards */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm space-y-4 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Cpu className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#f27d26] text-xs uppercase tracking-widest">Processador</h3>
                      <span className="text-[10px] text-gray-600">{stats.cpuName || "Ryzen 5 5600X"}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{stats.cpu}%</span>
                      <span className="text-[10px] text-gray-500 mb-1">CARGA</span>
                    </div>
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#f27d26]" 
                        animate={{ width: `${stats.cpu}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-widest">
                      <span>Cores: 6/12</span>
                      <span>Clock: 4.6GHz</span>
                    </div>
                  </div>

                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm space-y-4 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Database className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#f27d26] text-xs uppercase tracking-widest">Memória RAM</h3>
                      <span className="text-[10px] text-gray-600">40GB DDR4</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{stats.ram}%</span>
                      <span className="text-[10px] text-gray-500 mb-1">USO</span>
                    </div>
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#f27d26]" 
                        animate={{ width: `${stats.ram}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-widest">
                      <span>Total: 40GB</span>
                      <span>Freq: 3600MHz</span>
                    </div>
                  </div>

                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm space-y-4 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Monitor className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#f27d26] text-xs uppercase tracking-widest">GPU (VRAM)</h3>
                      <span className="text-[10px] text-gray-600">{stats.gpuName || "RTX 4060 8GB"}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{stats.vram}%</span>
                      <span className="text-[10px] text-gray-500 mb-1">ALOCAÇÃO</span>
                    </div>
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#f27d26]" 
                        animate={{ width: `${stats.vram}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-widest">
                      <span>Driver: 551.23</span>
                      <span>DLSS: Ativo</span>
                    </div>
                  </div>

                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm space-y-4 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Thermometer className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#f27d26] text-xs uppercase tracking-widest">Temperatura</h3>
                      <span className="text-[10px] text-gray-600">Liquid Cooling</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-bold ${stats.temp > 75 ? 'text-red-500' : 'text-white'}`}>{stats.temp}°C</span>
                      <span className="text-[10px] text-gray-500 mb-1">NÚCLEO</span>
                    </div>
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${stats.temp > 75 ? 'bg-red-500' : 'bg-[#f27d26]'}`}
                        animate={{ width: `${(stats.temp / 100) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-widest">
                      <span>Ambient: 24°C</span>
                      <span>Fan: 1800 RPM</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                  {/* Network & I/O */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm flex flex-col gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <h3 className="text-[#f27d26] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Tráfego de Rede & I/O
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                          <span>Download</span>
                          <span className="text-white">850 Mbps</span>
                        </div>
                        <div className="h-12 bg-black border border-[#1a1a1a] flex items-end gap-0.5 p-1">
                          {[...Array(20)].map((_, i) => (
                            <motion.div 
                              key={i}
                              className="flex-1 bg-green-500/40"
                              animate={{ height: `${Math.random() * 100}%` }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                          <span>Upload</span>
                          <span className="text-white">120 Mbps</span>
                        </div>
                        <div className="h-12 bg-black border border-[#1a1a1a] flex items-end gap-0.5 p-1">
                          {[...Array(20)].map((_, i) => (
                            <motion.div 
                              key={i}
                              className="flex-1 bg-[#f27d26]/40"
                              animate={{ height: `${Math.random() * 100}%` }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-[#1a1a1a] space-y-3">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500 uppercase">Ping (Canary Server)</span>
                          <span className="text-green-500">12ms</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500 uppercase">Status do Proxy</span>
                          <span className="text-green-500">ATIVO</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500 uppercase">Localização IP</span>
                          <span className="text-white">BRAZIL (SP)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Logs */}
                  <div className="lg:col-span-2 bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-[#f27d26]">
                        <Terminal className="w-5 h-5" />
                        <h3 className="text-xs uppercase tracking-widest font-bold">Log de Consciência de Sistema</h3>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        LIVE MONITORING
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 text-[11px] font-mono custom-scrollbar bg-black/50 p-4 border border-[#1a1a1a]">
                      {systemLogs.map((log, i) => (
                        <p key={i} className="text-gray-400 flex gap-4 border-b border-[#111] pb-1 last:border-0">
                          <span className="text-gray-700 min-w-[80px]">[{new Date().toLocaleTimeString()}]</span>
                          <span className="text-[#f27d26] font-bold">SYS_EVENT:</span>
                          <span className={log.includes('instabilidade') || log.includes('gargalo') ? 'text-red-500' : 'text-gray-400'}>
                            {log}
                          </span>
                        </p>
                      ))}
                      {systemLogs.length === 0 && <p className="text-gray-700 italic">Monitorando barramento de dados do núcleo...</p>}
                    </div>
                  </div>

                  {/* Hardware Affinity */}
                  <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <h3 className="text-[#f27d26] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Afinidade de Hardware
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-black border border-[#1a1a1a] rounded-sm">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500 uppercase">Ollama (Llama 3)</span>
                          <span className="text-[#f27d26]">GPU-0 (VRAM)</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[85%]" />
                        </div>
                      </div>
                      <div className="p-3 bg-black border border-[#1a1a1a] rounded-sm">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500 uppercase">Audio2Face (ACE)</span>
                          <span className="text-[#f27d26]">GPU-0 (Tensor)</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[40%]" />
                        </div>
                      </div>
                      <div className="p-3 bg-black border border-[#1a1a1a] rounded-sm">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500 uppercase">Faster-Whisper</span>
                          <span className="text-[#f27d26]">CPU (AVX-512)</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[25%]" />
                        </div>
                      </div>
                      <div className="p-3 bg-black border border-[#1a1a1a] rounded-sm">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500 uppercase">Piper TTS</span>
                          <span className="text-[#f27d26]">CPU (Single-Core)</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f27d26] w-[15%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'memory' && (
              <motion.div 
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col p-8"
              >
                <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a] pb-4">
                  <h2 className="text-xl font-bold uppercase tracking-tighter italic flex items-center gap-3">
                    <History className="w-6 h-6 text-[#f27d26]" />
                    Memória de Longo Prazo <span className="text-gray-600 text-xs not-italic font-mono ml-2">[SQLITE_CORE]</span>
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                  {localMemory.length > 0 ? (
                    localMemory.map((item, i) => (
                      <div key={i} className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm relative group hover:border-[#f27d26]/30 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#f27d26]/20 group-hover:bg-[#f27d26] transition-colors" />
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-[#111] border border-[#333] flex items-center justify-center text-[10px] text-gray-500 shrink-0">OP</div>
                            <p className="text-sm text-gray-400 italic">"{item.user}"</p>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-[#f27d26]/10 border border-[#f27d26]/20 flex items-center justify-center text-[10px] text-[#f27d26] shrink-0">VA</div>
                            <div className="text-sm text-[#f27d26] leading-relaxed markdown-body">
                              <ReactMarkdown>{item.ai}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                      <Database className="w-12 h-12 opacity-20" />
                      <p className="uppercase tracking-widest text-xs">Nenhuma interação persistida no núcleo local.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #080808;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f27d26;
        }
      `}</style>
    </div>
    </ErrorBoundary>
  );
}
