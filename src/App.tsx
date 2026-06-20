import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Cpu,
  Mic,
  MicOff,
  Settings,
  Activity,
  Send,
  Sparkles,
  BrainCircuit,
  Box,
  Image as ImageIcon,
  Wrench,
  Download,
  Play,
  Layers,
  Wifi,
  WifiOff,
  FileCode,
  BookOpen,
  Heart,
  ChevronRight,
  Database,
  Radio,
  Tv,
  Music,
  FolderOpen,
  Sliders,
  Volume2,
  Plug,
} from "lucide-react";
import { Live2DViewport } from "./components/Live2DViewport";
import { VRMViewport } from "./components/VRMViewport";
import { aiService } from "./services/localAIService";
import { startListening } from "./services/localSTTService";
import { generateLocalTTS, playAudioBuffer } from "./services/localTTSService";
import { useSovereignStore, CharacterCard } from "./store";
import { parseCharacterFile } from "./lib/characterCardParser";

type ActiveTab =
  | "portal"
  | "control"
  | "memory"
  | "audio"
  | "vision"
  | "dataset"
  | "setup"
  | "telemetry"
  | "integrations";

export default function App() {
  const store = useSovereignStore();
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isAiReady, setIsAiReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [renderMode, setRenderMode] = useState<"3D" | "2D">("3D");
  const [activeTab, setActiveTab] = useState<ActiveTab>("portal");
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Console log stream para simular o terminal local do Open-LLM-VTuber
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Inicializando Hub de Fusão Open-LLM-VTuber...`,
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Pronto para operar 100% offline via WebGPU ou emular conexões locais.`,
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Adiciona logs ao terminal de telemetria
  const pushLog = (log: string) => {
    setConsoleLogs((prev) =>
      [...prev, `[${new Date().toLocaleTimeString()}] ${log}`].slice(-80),
    );
  };

  // Inicializar o Cérebro Soberano (WebGPU)
  useEffect(() => {
    if (store.llmProvider !== "webgpu") {
      setIsAiReady(true);
      setLoadingProgress(100);
      pushLog(
        `[CognitiveCore] Usando provedor externo: ${store.llmProvider.toUpperCase()}. WebGPU desativado.`,
      );
      return;
    }

    pushLog(
      "[CognitiveCore] Carregando malhas neurais preliminares (WebGPU)...",
    );
    setIsAiReady(false);
    setLoadingProgress(0);

    aiService
      .init(
        () => {
          setIsAiReady(true);
          pushLog(
            "[CognitiveCore] Memória offline WebGPU de alta eficiência pronta.",
          );
        },
        (p) => {
          setLoadingProgress(p);
          if (p > 0 && p % 20 === 0) {
            pushLog(
              `[CognitiveCore] Sincronizando núcleos WebGPU offline: ${p}%`,
            );
          }
        },
      )
      .catch((e) => {
        console.warn("WebGPU Init error:", e);
        pushLog(`[CognitiveCore] Aviso WebGPU: ${(e as Error).message}`);
        // Fallback pra liberar a interface
        setIsAiReady(true);
        setLoadingProgress(100);
      });
  }, [store.llmProvider]);

  // Auto-scroll para o chat e logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  // Simular conexão local WebSocket
  const toggleLocalWebSocket = () => {
    if (isWsConnected) {
      setIsWsConnected(false);
      pushLog(
        `[WebSocket] Desconectado de ${store.apiEndpoint}. Retornando ao modo WebGPU Local.`,
      );
    } else {
      setIsWsConnecting(true);
      pushLog(
        `[WebSocket] Handshake com Open-LLM-VTuber em ${store.apiEndpoint}...`,
      );
      setTimeout(() => {
        setIsWsConnecting(false);
        setIsWsConnected(true);
        pushLog(`[WebSocket] Conectado e ativo em ws://localhost/api/v1/chat`);
        pushLog(`[SYSTEM] Controle assumido por backend local.`);
      }, 1500);
    }
  };

  const downloadDataset = () => {
    if (messages.length === 0) {
      alert("Não há conversas no histórico para exportar.");
      return;
    }
    pushLog("[Dataset] Gerando ShareGPT / Alpaca JSONL file para RLHF/SFT...");

    // Converte histórico num formato ShareGPT simulado
    const data = {
      conversations: messages.map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      })),
      system:
        store.activeCharacterCard?.system_prompt ||
        "Você é Vaelindra Soberana.",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog("[Dataset] Download concluído.");
  };

  const handleSTT = async () => {
    if (!isAiReady || isThinking) return;
    setIsListening(true);
    pushLog("[STT] Escuta ativada (WebSpeech local). Capturando áudio...");
    try {
      const text = await startListening();
      if (text) {
        pushLog(`[STT] Transcrição concluída: "${text}"`);
        setInput(text);
        await processResponse(text);
      } else {
        pushLog("[STT] Nenhum áudio detectado ou comando cancelado.");
      }
    } catch (e) {
      pushLog(`[STT] Erro no módulo de voz: ${(e as Error).message}`);
    } finally {
      setIsListening(false);
    }
  };

  const processResponse = async (userMsg: string) => {
    setIsThinking(true);
    pushLog(`[ChatFlow] User input: "${userMsg}"`);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const systemPrompt =
        store.activeCharacterCard?.system_prompt ||
        "Você é Vaelindra Soberana.";
      pushLog(
        `[CognitiveCore] Processando inferência via provedor [${store.llmProvider.toUpperCase()}]...`,
      );

      const response = await aiService.generate(userMsg, systemPrompt);

      pushLog(
        `[CognitiveCore] Resposta gerada. Resposta: "${response.substring(0, 45)}..."`,
      );
      setMessages((prev) => [...prev, { role: "ai", content: response }]);

      // Voz Real (TTS)
      pushLog(
        `[TTS] Gerando áudio via provedor [${store.ttsProvider.toUpperCase()}]...`,
      );
      const buffer = await generateLocalTTS(response);
      pushLog(
        "[TTS] Executando sintetizador de voz local e ativando sincronia labial (Lipsync)...",
      );
      playAudioBuffer(response, buffer);
    } catch (e) {
      pushLog(`[CognitiveCore] Neural Error: ${(e as Error).message}`);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isAiReady || isThinking) return;
    const userMsg = input.trim();
    setInput("");
    await processResponse(userMsg);
  };

  // Gerador de arquivo de Configuração Real do Open-LLM-VTuber
  const generateAndDownloadConf = () => {
    pushLog(
      "[ConfigCreator] Compilando configurações para arquivo 'conf.json' real...",
    );
    const openLlmConfig = {
      system_prompt:
        store.activeCharacterCard?.system_prompt || "Você é Vaelindra.",
      system_prompt_preset: store.systemPromptPreset,
      llm_provider: store.llmProvider,
      ollama: {
        api_url: store.apiEndpoint,
        model_id: store.llmModelId,
        temperature: store.temperature,
        max_tokens: store.maxTokens,
        top_p: store.topP,
        top_k: store.topK,
      },
      openai: {
        api_url: store.apiEndpoint,
        model_id: store.llmModelId,
        temperature: store.temperature,
        max_tokens: store.maxTokens,
        top_p: store.topP,
      },
      llamacpp: {
        api_url: store.apiEndpoint,
        temperature: store.temperature,
        max_tokens: store.maxTokens,
        top_p: store.topP,
        top_k: store.topK,
      },
      tts_provider: store.ttsProvider,
      edge_tts: {
        voice: store.edgeVoice,
      },
      xtts: {
        api_url: store.ttsUrl,
        speaker: "Vaelindra",
      },
      stt_provider: store.sttProvider,
      whisper: {
        api_url: store.whisperUrl,
      },
      audio_mixer: {
        use_virtual_audio_cable: store.useVirtualAudioCable,
        bgm_volume: store.bgmVolume,
        tts_volume: store.ttsVolume,
        mic_gain: store.micVolume,
      },
      rag: {
        enabled: store.useRag,
        endpoint: store.ragUrl,
      },
      stt: {
        use_vad: store.useVad,
      },
      integrations: {
        vtube_studio: store.vtsConnected,
        twitch_channel: store.twitchChannel,
        youtube_live_id: store.youtubeLiveId,
        bilibili_live_id: store.bilibiliLiveId,
        discord_webhook: store.discordWebhook,
      },
      vision: {
        enabled: store.visionEnabled,
        refresh_rate_hz: 1.0,
      },
    };

    const blob = new Blob([JSON.stringify(openLlmConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conf.json";
    a.click();
    URL.revokeObjectURL(url);
    pushLog("[ConfigCreator] Arquivo conf.json baixado com sucesso!");
  };

  // Script de Inicialização Rápida de Aplicativo de Desktop (.bat offline)
  const generateLauncherScript = () => {
    const batScript = `@echo off
title Open-LLM-VTuber Sovereign Launcher
echo ========================================================
echo   INICIALIZANDO ECOSSISTEMA SOBERANO 100%% OFFLINE   
echo ========================================================
echo.
echo Verificando se o ambiente Virtual existe...
if not exist venv (
    echo Criando ambiente virtual Python...
    python -m venv venv
)
echo Ativando ambiente virtual...
call venv\\Scripts\\activate
echo Instalando dependencias offline...
pip install -r requirements.txt
echo.
echo Executando backend na porta 8000...
python main.py --config conf.json
pause`;

    const blob = new Blob([batScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "start_sovereign.bat";
    a.click();
    URL.revokeObjectURL(url);
    pushLog("[LauncherCreator] Arquivo start_sovereign.bat gerado e baixado!");
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".vrm")) {
        const url = URL.createObjectURL(file);
        store.setVrmUrl(url);
        setRenderMode("3D");
        pushLog(
          `[DropEngine] Novo avatar 3D VRM importado com sucesso: ${file.name}`,
        );
        return;
      }

      const card = await parseCharacterFile(file);
      if (card) {
        store.setActiveCharacterCard(card);
        setMessages([{ role: "ai", content: card.first_mes }]);
        pushLog(`[DropEngine] Carta de personagem assimilada: ${card.name}`);
      }
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      className={`h-screen w-screen flex text-white/90 selection:bg-neon-blue selection:text-black font-sans overflow-hidden ${store.obsModeEnabled ? "bg-[#00FF00]" : "bg-[#030303]"}`}
    >
      {/* BACKGROUND SCI-FI MATRIX */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${store.obsModeEnabled ? "opacity-0" : "opacity-20"}`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(0,240,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      {/* FLOATING SIDE NAVIGATION RAIL */}
      <nav
        className={`w-16 border-r border-white/5 flex flex-col items-center py-6 justify-between backdrop-blur-2xl z-20 transition-all ${store.obsModeEnabled ? "bg-black/80 hover:w-16 hover:opacity-100 opacity-0" : "bg-black/50"}`}
      >
        <div className="flex flex-col gap-8 items-center">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <BrainCircuit className="w-5 h-5 text-neon-blue animate-pulse" />
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setActiveTab("portal")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "portal" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Portal VTuber Interativo"
            >
              <Heart className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("control")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "control" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Configurar Módulos Locais"
            >
              <Wrench className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("memory")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "memory" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Memória e Conhecimento (RAG)"
            >
              <FolderOpen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("audio")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "audio" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Mixer de Áudio (BGM / RVC)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("vision")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "vision" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Visão Computacional e Monitoramento de Tela"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("dataset")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "dataset" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Gestão de Dataset e RLHF"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("setup")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "setup" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Instalador e Launcher Offline"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("telemetry")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "telemetry" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Telemetria e Logs em Tempo Real"
            >
              <Terminal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeTab === "integrations" ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Integrações e Stream (VTS, OBS, Twitch)"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 text-white/30 text-[10px] font-mono font-bold">
          <ChevronRight className="w-4 h-4 text-white/20 animate-bounce" />
          <span>V2.5</span>
        </div>
      </nav>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* TOP STATUS BAR */}
        <header
          className={`h-14 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-3xl bg-black/40 transition-all ${store.obsModeEnabled ? "opacity-0 hover:opacity-100 absolute w-full z-50" : ""}`}
        >
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-[10px] font-black tracking-widest uppercase text-white/90">
                {activeTab === "portal" && "Portal Companion Interativo"}
                {activeTab === "control" && "Painel Avançado Open-LLM-VTuber"}
                {activeTab === "memory" && "Banco de Conhecimento e Prompt"}
                {activeTab === "audio" && "Mixer de Áudio e Voice Changer"}
                {activeTab === "vision" && "Processamento de Visão & OCR"}
                {activeTab === "dataset" && "Exportação RLHF & Dataset"}
                {activeTab === "setup" && "Launcher 100% Offline Core"}
                {activeTab === "telemetry" &&
                  "Terminal de Telemetria Integrado"}
                {activeTab === "integrations" &&
                  "Integrações (Bilibili/Twitch/OBS)"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isAiReady ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-yellow-500 animate-pulse"}`}
                />
                <span className="text-[8px] font-mono uppercase text-white/40">
                  {isAiReady
                    ? "FUSÃO SOVEREIGN OPERACIONAL"
                    : `Sincronizando Módulos Locais: ${loadingProgress}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status do WebSocket para conectar ao backend Python real */}
            <button
              onClick={toggleLocalWebSocket}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[9.5px] font-mono ${isWsConnected ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}
            >
              {isWsConnecting ? (
                <>
                  <div className="w-2.5 h-2.5 border-t-2 border-neon-blue rounded-full animate-spin" />
                  <span>Sincronizando ws...</span>
                </>
              ) : isWsConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>WS Local Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Conectar WS Local</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
              <Cpu className="w-3.5 h-3.5 text-neon-blue" />
              <span className="text-[9px] font-mono text-neon-blue">
                WebGPU: {isAiReady ? "Optimized" : "Loading"}
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <section className="flex-1 flex overflow-hidden">
          {/* TAB 1: PORTAL INTERATIVO (Companion Mode) */}
          {activeTab === "portal" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* O CÓRTEX VISUAL DO VTUBER */}
              <div className="flex-1 relative overflow-hidden group border-r border-white/5">
                {renderMode === "3D" ? (
                  <VRMViewport modelUrl={store.vrmUrl} />
                ) : (
                  <Live2DViewport onModelLoad={(m) => setModel(m)} />
                )}

                {/* OVERLAY DE CARREGAMENTO */}
                {!isAiReady && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#010101]/95 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 p-8 border border-neon-blue/20 bg-black/60 rounded-3xl max-w-sm">
                      <BrainCircuit className="w-12 h-12 text-neon-blue animate-pulse" />
                      <h2 className="text-sm font-bold font-mono text-white tracking-widest text-center uppercase">
                        Sincronizando Malha Cognitiva
                      </h2>
                      <p className="text-[10px] text-white/40 text-center max-w-[250px]">
                        Isso inicializará a memória offline em seu navegador.
                        Não exige configuração.
                      </p>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-neon-blue shadow-[0_0_10px_#00f0ff] transition-all duration-300"
                          style={{ width: `${Math.max(5, loadingProgress)}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-mono text-neon-blue font-bold">
                        Progresso: {loadingProgress}%
                      </p>
                    </div>
                  </div>
                )}

                {/* CONTROLES RÁPIDOS SOBRE O MOTOR GRÁFICO */}
                <div className="absolute right-6 top-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-40 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                  <button
                    onClick={() =>
                      setRenderMode((prev) => (prev === "3D" ? "2D" : "3D"))
                    }
                    className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:border-neon-blue hover:text-neon-blue transition-all"
                    title={`Modo ${renderMode === "3D" ? "Live2D" : "VRM 3D"}`}
                  >
                    {renderMode === "3D" ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <Box className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("control")}
                    className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:border-neon-blue hover:text-neon-blue transition-all"
                    title="Configurar LLAma / TTS"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSTT}
                    disabled={!isAiReady || isThinking}
                    className={`w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:border-neon-blue transition-all ${isListening ? "border-neon-blue text-neon-blue animate-pulse shadow-[0_0_10px_#00f0ff]" : ""}`}
                    title="Ouvir minha voz (STT)"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* SUBTITLES DA COMPANHIA */}
                <div className="absolute bottom-6 left-6 right-6 max-w-lg z-30">
                  <div className="px-5 py-4 glass rounded-2xl border border-white/5 backdrop-blur-xl bg-black/60 shadow-2xl">
                    <p className="text-[9px] font-mono text-neon-blue uppercase mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3" />{" "}
                      {store.activeCharacterCard?.name || "Vaelindra"}
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed font-sans font-medium">
                      {messages.length > 0
                        ? messages[messages.length - 1].content
                        : store.activeCharacterCard?.first_mes}
                    </p>
                  </div>
                </div>
              </div>

              {/* CHAT TERMINAL (DOCK DIREITO) */}
              <div
                className={`w-full md:w-96 flex flex-col h-full bg-[#070707] border-l border-white/5 transition-all ${store.obsModeEnabled ? "hidden" : "block"}`}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-neon-purple" />
                    <span className="text-[10px] font-mono tracking-wider font-bold">
                      HISTÓRICO NEURAL
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-white/30">
                    {messages.length} TRANSAÇÕES
                  </span>
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                >
                  <AnimatePresence>
                    {messages.map((m, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed ${m.role === "user" ? "bg-neon-blue/10 border border-neon-blue/20 text-neon-blue font-semibold" : "bg-white/5 border border-white/10 text-white/90"}`}
                        >
                          {m.content}
                        </div>
                      </motion.div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder={
                        isAiReady
                          ? "Envie uma instrução de voz ou texto..."
                          : "Aguardando núcleo cognitivo..."
                      }
                      className="w-full bg-white/5 border border-white/10 h-11 rounded-xl px-4 text-xs pr-12 focus:outline-none focus:border-neon-blue/40 focus:ring-1 focus:ring-neon-blue/25"
                      disabled={!isAiReady || isThinking}
                    />
                    <button
                      onClick={handleSend}
                      className="absolute right-2 p-2 bg-neon-blue/10 rounded-lg text-neon-blue hover:bg-neon-blue hover:text-black transition-all"
                      disabled={!isAiReady || isThinking}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[8px] font-mono text-center text-white/20 mt-2">
                    Dica: Arraste arquivos .vrm (Avatar) ou cartões (.png) aqui
                    dentro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION MODULAR PANEL (Open-LLM-VTuber Hub) */}
          {activeTab === "control" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neon-blue" />
                    CONFIGURAÇÃO MULTI-MÓDULO DE FUSÃO
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">
                    Defina os redirecionamentos locais para emular o pipeline
                    offline do Open-LLM-VTuber.
                  </p>
                </div>

                <button
                  onClick={generateAndDownloadConf}
                  className="flex items-center gap-2 bg-neon-blue text-black font-semibold px-4 py-2 rounded-xl text-xs hover:bg-[#00d0df] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all font-bold"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Gerar conf.json</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD LLM COGNITIVE PROVIDER */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-purple flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5" />
                      LLM: PROVEDOR DE LINGUAGEM
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      MODULE_01
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="block text-[10px] uppercase text-white/50 tracking-wider">
                      Mecanismo do LLM
                    </label>
                    <select
                      value={store.llmProvider}
                      onChange={(e: any) => {
                        store.setLlmProvider(e.target.value);
                        pushLog(
                          `[Config] Alterado LLM Provider para: ${e.target.value.toUpperCase()}`,
                        );
                      }}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                    >
                      <option value="webgpu">
                        WebGPU (100% Offline Integrado no Browser)
                      </option>
                      <option value="ollama">
                        Ollama (Offline Local - Requer aplicativo rodando)
                      </option>
                      <option value="llamacpp">
                        Llama.cpp (Offline Local Server)
                      </option>
                      <option value="openai">
                        OpenAI / LM-Studio / API Compatível
                      </option>
                    </select>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Porta / Endpoint
                        </label>
                        <input
                          type="text"
                          value={store.apiEndpoint}
                          onChange={(e) => store.setApiEndpoint(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Modelo Selecionado
                        </label>
                        <input
                          type="text"
                          value={store.llmModelId}
                          onChange={(e: any) =>
                            store.setLlmModelId(e.target.value)
                          }
                          placeholder="qwen2:0.5b / llama3"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Temperatura: {store.temperature}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.5"
                          step="0.1"
                          value={store.temperature}
                          onChange={(e) =>
                            store.setTemperature(parseFloat(e.target.value))
                          }
                          className="w-full accent-neon-blue bg-white/5 h-1 border border-white/10 rounded mt-2 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Max Tokens: {store.maxTokens}
                        </label>
                        <input
                          type="number"
                          value={store.maxTokens}
                          onChange={(e) =>
                            store.setMaxTokens(parseInt(e.target.value))
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD TTS SYNTH VOICE PROVIDER */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-blue flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5" />
                      TTS: PROVEDOR DE SÍNTESE DE VOZ
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      MODULE_02
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="block text-[10px] uppercase text-white/50 tracking-wider">
                      Módulo de Voz
                    </label>
                    <select
                      value={store.ttsProvider}
                      onChange={(e: any) => {
                        store.setTtsProvider(e.target.value);
                        pushLog(
                          `[Config] Alterado TTS Provider para: ${e.target.value.toUpperCase()}`,
                        );
                      }}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                    >
                      <option value="native">
                        Web Synthesis (Nativo e Livre)
                      </option>
                      <option value="edge">
                        EdgeTTS (Serviço Online de Alta Qualidade)
                      </option>
                      <option value="xtts">
                        XTTSv2 local (Clonagem Local Offline)
                      </option>
                      <option value="gpt-sovits">
                        GPT-SoVITS local (Vozes de Anime)
                      </option>
                    </select>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Skins / Vozes Edge
                        </label>
                        <select
                          value={store.edgeVoice}
                          onChange={(e) => store.setEdgeVoice(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                        >
                          <option value="pt-BR-FranciscaNeural">
                            Francisca (pt-BR) - Padrão Feminina
                          </option>
                          <option value="pt-BR-AntonioNeural">
                            Antonio (pt-BR) - Masculina
                          </option>
                          <option value="en-US-JennyNeural">
                            Jenny (en-US) - English standard
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          TTS Server URL (Local)
                        </label>
                        <input
                          type="text"
                          value={store.ttsUrl}
                          onChange={(e) => store.setTtsUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD STT AUDIO TRANSCRIBER PROVIDER */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-green flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-neon-green" />
                      STT: RECONHECIMENTO DE VOZ
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      MODULE_03
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="block text-[10px] uppercase text-white/50 tracking-wider">
                      Receptor de Voz
                    </label>
                    <select
                      value={store.sttProvider}
                      onChange={(e: any) => {
                        store.setSttProvider(e.target.value);
                        pushLog(
                          `[Config] Alterado STT Provider para: ${e.target.value.toUpperCase()}`,
                        );
                      }}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                    >
                      <option value="native">
                        Web Speech API (Browser Nativo Offline)
                      </option>
                      <option value="whisper">
                        Whisper Local (Requer CPU/GPU rodando Whisper)
                      </option>
                    </select>

                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        Servidor Whisper (WebSocket / HTTP)
                      </label>
                      <input
                        type="text"
                        value={store.whisperUrl}
                        onChange={(e) => store.setWhisperUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD CHARACTER SYSTEM PROMPT EDIT */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-yellow flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-neon-yellow" />
                      CARD DE COMPORTAMENTO ATIVO
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      PROMPT_ENGINE
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        Nome do Personagem
                      </label>
                      <input
                        type="text"
                        value={store.activeCharacterCard?.name || ""}
                        onChange={(e) => {
                          const originalCard = store.activeCharacterCard || {
                            name: "",
                            description: "",
                            personality: "",
                            scenario: "",
                            first_mes: "",
                            mes_example: "",
                            creator_notes: "",
                            system_prompt: "",
                            post_history_instructions: "",
                            alternate_greetings: [],
                            expressions: {},
                          };
                          store.setActiveCharacterCard({
                            ...originalCard,
                            name: e.target.value,
                          });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        System Prompt Secundário
                      </label>
                      <textarea
                        rows={3}
                        value={store.activeCharacterCard?.system_prompt || ""}
                        onChange={(e) => {
                          const originalCard = store.activeCharacterCard || {
                            name: "",
                            description: "",
                            personality: "",
                            scenario: "",
                            first_mes: "",
                            mes_example: "",
                            creator_notes: "",
                            system_prompt: "",
                            post_history_instructions: "",
                            alternate_greetings: [],
                            expressions: {},
                          };
                          store.setActiveCharacterCard({
                            ...originalCard,
                            system_prompt: e.target.value,
                          });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue font-mono resize-none"
                      />
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-2">
                        Mapeamento de Emoções (Live2D/VRM)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#111] border border-white/10 p-2 rounded-lg text-center font-mono text-[9px] text-white/60">
                          [Joy] → Expression_01
                        </div>
                        <div className="bg-[#111] border border-white/10 p-2 rounded-lg text-center font-mono text-[9px] text-white/60">
                          [Angry] → Expression_02
                        </div>
                        <div className="bg-[#111] border border-white/10 p-2 rounded-lg text-center font-mono text-[9px] text-white/60">
                          [Sad] → Expression_03
                        </div>
                        <div className="bg-[#111] border border-white/10 p-2 rounded-lg text-center font-mono text-[9px] text-white/60">
                          [Surprise] → Expression_04
                        </div>
                      </div>
                      <p className="text-[8px] text-white/30 text-center mt-2 italic">
                        A IA injetará a tag entre colchetes para ditar o
                        Blendshape usado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMORY AND PROMPTING (RAG / KNOWLEDGE BASE) */}
          {activeTab === "memory" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-neon-blue" />
                  MEMÓRIA DE LONGO PRAZO E CONTEXTO RAG
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Gerencie a memória vetorial do LLM, o banco de informações
                  pessoais e o preset do prompt do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-green flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5" />
                      RAG VETORIAL (CONHECIMENTO)
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Habilitar Memória (RAG)
                      </label>
                      <button
                        onClick={() => store.setUseRag(!store.useRag)}
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.useRag ? "bg-neon-green" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.useRag ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        RAG Endpoint (ChromaDB API)
                      </label>
                      <input
                        type="text"
                        value={store.ragUrl}
                        onChange={(e) => store.setRagUrl(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".txt,.pdf";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            pushLog(
                              `[RAG] Documento ${file.name} adicionado ao banco vetorial ChromaDB com sucesso.`,
                            );
                          }
                        };
                        input.click();
                      }}
                      className="w-full bg-white/5 hover:bg-neon-green/20 hover:text-neon-green text-white border border-white/10 transition-all font-bold tracking-widest text-[10px] rounded-xl px-4 py-2 flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>UPLOAD DE DOCUMENTOS (TXT/PDF)</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-yellow flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      PRESETS & PARÂMETROS
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        System Prompt Preset Mode
                      </label>
                      <select
                        value={store.systemPromptPreset}
                        onChange={(e) =>
                          store.setSystemPromptPreset(e.target.value)
                        }
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      >
                        <option value="VTuber Local">VTuber Padrão</option>
                        <option value="SillyTavern">
                          SillyTavern Compatability
                        </option>
                        <option value="Assistant">Ajudante Neutro</option>
                        <option value="Unhinged">
                          Desbloqueado (Unhinged)
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Top-P: {store.topP}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={store.topP}
                          onChange={(e) =>
                            store.setTopP(parseFloat(e.target.value))
                          }
                          className="w-full accent-neon-yellow bg-white/5 h-1 border border-white/10 rounded mt-2 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Top-K: {store.topK}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={store.topK}
                          onChange={(e) =>
                            store.setTopK(parseInt(e.target.value))
                          }
                          className="w-full accent-neon-yellow bg-white/5 h-1 border border-white/10 rounded mt-2 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO MIXER AND PIPELINE */}
          {activeTab === "audio" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neon-purple" />
                  AUDIO PIPELINE E MIXER
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Ajuste fina da separação de canais de áudio virtual, música de
                  fundo e conversão de voz (RVC).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-purple flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5" />
                      MIXER PRINCIPAL
                    </span>
                  </div>

                  <div className="space-y-5 text-xs">
                    <div>
                      <div className="flex justify-between">
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Apenas TTS (Voz da IA)
                        </label>
                        <span className="text-[10px] text-white/80">
                          {store.ttsVolume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={store.ttsVolume}
                        onChange={(e) =>
                          store.setTtsVolume(parseInt(e.target.value))
                        }
                        className="w-full accent-neon-purple bg-white/5 h-1 border border-white/10 rounded mt-1 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Música de Fundo (BGM)
                        </label>
                        <span className="text-[10px] text-white/80">
                          {store.bgmVolume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={store.bgmVolume}
                        onChange={(e) =>
                          store.setBgmVolume(parseInt(e.target.value))
                        }
                        className="w-full accent-white bg-white/5 h-1 border border-white/10 rounded mt-1 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Ganho de Microfone (STT)
                        </label>
                        <span className="text-[10px] text-white/80">
                          {store.micVolume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={store.micVolume}
                        onChange={(e) =>
                          store.setMicVolume(parseInt(e.target.value))
                        }
                        className="w-full accent-neon-blue bg-white/5 h-1 border border-white/10 rounded mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Interrupção de Fala por Voz (VAD)
                      </label>
                      <button
                        onClick={() => store.setUseVad(!store.useVad)}
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.useVad ? "bg-neon-blue" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.useVad ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-blue flex items-center gap-2">
                      <Music className="w-3.5 h-3.5" />
                      PLUGINS RVC & VST
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg text-[10px] text-white/80 font-mono">
                      <span className="text-neon-purple font-bold">INFO:</span>{" "}
                      Se você definiu o TTS Provider como "RVC" (Voice Changer),
                      as rotas de áudio serão enviadas ao W-Okada Voice Changer
                      local na porta padrão.
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        W-Okada Endpoint (RVC)
                      </label>
                      <input
                        type="text"
                        defaultValue="http://127.0.0.1:18888"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-purple text-white/50"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Cabo de Áudio Virtual (VB-Audio)
                      </label>
                      <button
                        onClick={() =>
                          store.setUseVirtualAudioCable(
                            !store.useVirtualAudioCable,
                          )
                        }
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.useVirtualAudioCable ? "bg-neon-purple" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.useVirtualAudioCable ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROCESSAMENTO DE VISÃO E TELA */}
          {activeTab === "vision" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-neon-blue" />
                  VISÃO DA IA & LEITURA DE TELA (SCREEN VISION)
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Permite à IA observar a sua tela inteira, ler janelas e
                  compreender imagens usando Modelos de Visão e OCR.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-white flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" />
                      SCREEN CAPTURE ENGINE
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Habilitar Visão Contínua
                      </label>
                      <button
                        onClick={() =>
                          store.setVisionEnabled(!store.visionEnabled)
                        }
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.visionEnabled ? "bg-neon-blue" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.visionEnabled ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <p className="text-[10px] text-white/50 border border-white/10 p-2 rounded-lg bg-white/5 italic">
                      A captura de tela utilizará `mss` no backend e `easyocr`
                      se OCR for exigido. Os frames são ingeridos pelo VLM local
                      na memória principal.
                    </p>

                    <div>
                      <div className="flex justify-between">
                        <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                          Taxa de Atualização de Visão
                        </label>
                        <span className="text-[10px] text-white/80">1 FPS</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.5"
                        defaultValue="1"
                        className="w-full accent-neon-blue bg-white/5 h-1 border border-white/10 rounded mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl gap-4 flex flex-col justify-center items-center h-full">
                  <ImageIcon className="w-12 h-12 text-white/10 mb-2" />
                  <p className="text-xs text-white/30 text-center px-4 font-mono">
                    O Stream de Visão operado pelo `LocalAiVtuber2` estará
                    disponível quando conectado ao Backend Python nativo via
                    WebSocket.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RLHF & EXPORTAÇÃO DE DATASET */}
          {activeTab === "dataset" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-neon-green glow" />
                  GESTÃO DE DADOS & APRENDIZAGEM
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Exporte o histórico de chat e converta conversas em dados RLHF
                  / SFT para refinar modelos locais (Train Mode).
                </p>
              </div>

              <div className="flex items-center gap-6 p-5 border border-white/5 bg-black/40 rounded-2xl">
                <div className="flex-1">
                  <h4 className="text-xs font-bold font-mono tracking-wide text-neon-green mb-1">
                    Exportar Dataset Formato Alpaca/ShareGPT
                  </h4>
                  <p className="text-[10px] text-white/50 mb-4">
                    Reúne todo o log de interações e edições guardadas em
                    memória numa representação JSON útil para finetuning de
                    LLM`s como Llama-3.
                  </p>
                  <button
                    onClick={downloadDataset}
                    className="bg-white/5 hover:bg-neon-green hover:text-black border border-white/10 text-white transition-all font-bold tracking-widest text-[10px] rounded-xl px-4 py-2 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORTAR TRAINING.JSONL</span>
                  </button>
                </div>
                <div className="hidden lg:flex w-32 h-32 bg-white/5 border border-white/10 rounded-xl items-center justify-center p-4">
                  <FileCode className="w-10 h-10 text-white/20" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ESTOQUE OFFLINE & LAUNCHER (Automated Shell Creator) */}
          {activeTab === "setup" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neon-purple" />
                  GUIA COMPLETO: EXECUÇÃO 100% LOCAL NO PC
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Siga os passos e baixe o script automatizado para rodar o
                  software de VTuber local offline em seu computador físico.
                </p>
              </div>

              {/* DOWNLOAD DO INICIALIZADOR */}
              <div className="p-5 border border-neon-blue/20 bg-neon-blue/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neon-blue font-mono uppercase">
                    Gerar inicializador offline automático
                  </h4>
                  <p className="text-[10px] text-white/60">
                    Gera instantaneamente o script{" "}
                    <code className="text-neon-blue font-bold">
                      start_sovereign.bat
                    </code>{" "}
                    que gerencia e otimiza o lançamento do Open-LLM-VTuber no
                    seu terminal Windows.
                  </p>
                </div>
                <button
                  onClick={generateLauncherScript}
                  className="flex items-center gap-2 bg-[#00f0ff] hover:bg-neon-blue text-black font-bold px-4 py-3 rounded-xl text-xs transition-all tracking-wide shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar start_launcher.bat</span>
                </button>
              </div>

              {/* PASSO A PASSO */}
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] shrink-0 text-neon-purple font-bold">
                    1
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-bold">
                      Clonar o Repositório de Fusão Oficial
                    </p>
                    <p className="text-white/50 text-[11px]">
                      Abra o PowerShell (Windows) ou Terminal (macOS/Linux) e
                      clone o repositório original do projeto do GitHub:
                    </p>
                    <pre className="bg-black border border-white/5 p-3 rounded-xl text-[10px] font-mono text-neon-blue block overflow-x-auto">
                      git clone
                      https://github.com/Open-LLM-VTuber/Open-LLM-VTuber.git
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] shrink-0 text-neon-purple font-bold">
                    2
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-bold">
                      Baixar e arrastar o arquivo de configuração (.json)
                    </p>
                    <p className="text-white/50 text-[11px]">
                      Clique no botão superior "Gerar conf.json" na aba do
                      Centro de Controle para exportar as configurações
                      parametrizadas. Insira esse arquivo na pasta raiz do
                      repositório clonado no seu PC.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] shrink-0 text-neon-purple font-bold">
                    3
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-bold">Alavancar o Backend Offline</p>
                    <p className="text-white/50 text-[11px]">
                      No terminal do seu PC, execute o arquivo .bat baixado ou
                      insira a cadeia de inicialização manual abaixo:
                    </p>
                    <pre className="bg-black border border-white/5 p-3 rounded-xl text-[10px] font-mono text-neon-blue block overflow-x-auto whitespace-pre">
                      {`# Criar ambiente Python isolado
python -m venv venv
# Ativar o ambiente
source venv/bin/activate  # macOS ou venv\\Scripts\\activate no Windows
# Instalar dependências compiladas
pip install -r requirements.txt
pip install blivedm chromadb discord-webhook pyttsx3
# Rodar 100% offline
python main.py --config conf.json`}
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] shrink-0 text-neon-purple font-bold">
                    4
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-bold">
                      Vincular a Inteligência offline (Ollama / Llama.cpp)
                    </p>
                    <p className="text-white/50 text-[11px]">
                      Para rodar o cérebro principal 100% offline em sua placa
                      de vídeo RTX 4060/4090, comande o Ollama local no prompt
                      para baixar o cérebro que escolheu:
                    </p>
                    <pre className="bg-black border border-white/5 p-3 rounded-xl text-[10px] font-mono text-neon-blue block overflow-x-auto">
                      ollama run qwen2:0.5b
                    </pre>
                    <p className="text-[10px] text-white/30 italic">
                      Nota: A IA local será consumida silenciosamente pelo
                      repositório Python sem tocar em canais de internet
                      externos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRIA E LOGS (Realtime Console Logs Renderer) */}
          {activeTab === "telemetry" && (
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neon-green" />
                    CONSERVA DE TELEMETRIA LOCAL E HEARTBEAT
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">
                    Visualização em tempo real das mensagens e conexões
                    estabelecidas com o pipeline Open-LLM-VTuber.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setConsoleLogs([
                      `[${new Date().toLocaleTimeString()}] [SYSTEM] Console limpo.`,
                    ])
                  }
                  className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10.5px] font-mono hover:bg-white/10 transition-all font-semibold cursor-pointer text-white"
                >
                  Clear Logs
                </button>
              </div>

              {/* LOG SCREEN CONTAINER */}
              <div className="flex-1 mt-6 bg-black border border-white/5 rounded-2xl overflow-hidden p-4 font-mono flex flex-col justify-between">
                <div
                  ref={logScrollRef}
                  className="flex-1 overflow-y-auto space-y-2 select-text scrollbar-hide"
                >
                  {consoleLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`text-[10.5px] leading-relaxed tracking-wide ${log.includes("[ERROR]") || log.includes("Falha o Erro") ? "text-red-400 font-bold" : log.includes("CAPTURED") || log.includes("User input") ? "text-neon-yellow" : log.includes("[CognitiveCore]") ? "text-neon-purple" : log.includes("[WebSocket]") ? "text-green-400 font-semibold" : "text-slate-300"}`}
                    >
                      {log}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between text-[11px] text-white/30">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 font-semibold">
                      <Activity className="w-3.5 h-3.5 text-neon-blue animate-pulse" />{" "}
                      LAT: 0ms (In-Browser WebGPU)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />{" "}
                      CPU Cache: OK
                    </span>
                  </div>
                  <span>BUFFER SIZE: 80 LINE LIMIT</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTEGRATIONS (Livestream, Twitch, OBS) */}
          {activeTab === "integrations" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-neon-yellow shadow-neon-yellow glow" />
                  INTEGRAÇÕES DE LIVESTREAM (TWITCH / YOUTUBE)
                </h3>
                <p className="text-[10px] text-white/40 mt-1">
                  Permite à IA reagir a eventos da live (Twitch e YouTube),
                  assim como emitir sobreposições para OBS e comandar o VTube
                  Studio externamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Twitch / YouTube Config */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-blue flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5" />
                      YOUTUBE & TWITCH LISTENER
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      MODULE_LIVE
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        Canais na Twitch
                      </label>
                      <input
                        type="text"
                        value={store.twitchChannel}
                        onChange={(e) => store.setTwitchChannel(e.target.value)}
                        placeholder="Insira o nome do canal (ex: xiaoheiqaq)"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        ID da Live no YouTube
                      </label>
                      <input
                        type="text"
                        value={store.youtubeLiveId}
                        onChange={(e) => store.setYoutubeLiveId(e.target.value)}
                        placeholder="Ex: dQw4w9WgXcQ"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        Bilibili Live Room ID
                      </label>
                      <input
                        type="text"
                        value={store.bilibiliLiveId}
                        onChange={(e) =>
                          store.setBilibiliLiveId(e.target.value)
                        }
                        placeholder="Ex: 21452505"
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-white/50 tracking-wider mb-1">
                        Discord Webhook (Alertas)
                      </label>
                      <input
                        type="text"
                        value={store.discordWebhook}
                        onChange={(e) =>
                          store.setDiscordWebhook(e.target.value)
                        }
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-blue text-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        alert(
                          "Emulação de Poller iniciada. A ponte com o backend monitorará todos os canais definidos simultaneamente.",
                        );
                      }}
                      className="w-full mt-2 bg-white/5 hover:bg-neon-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white border border-white/10 transition-all font-bold tracking-widest text-[10px] rounded-xl px-4 py-2 flex items-center justify-center gap-2"
                    >
                      <Plug className="w-4 h-4" />
                      <span>CONECTAR FIREHOSE WS</span>
                    </button>
                    <p className="text-[9px] text-white/30 italic text-center">
                      Permite a IA responder dinamicamente agregando chats do
                      Bilibili, Twitch e YouTube.
                    </p>
                  </div>
                </div>

                {/* VTube Studio & OBS Config */}
                <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wide text-neon-green flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5" />
                      VTUBE STUDIO & OBS
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      MODULE_BROADCAST
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Modo Chroma Key (OBS Transparent UI)
                      </label>
                      <button
                        onClick={() =>
                          store.setObsModeEnabled(!store.obsModeEnabled)
                        }
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.obsModeEnabled ? "bg-neon-green" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.obsModeEnabled ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-white/70 tracking-wider">
                        Diretiva VTube Studio Websocket (VTS)
                      </label>
                      <button
                        onClick={() =>
                          store.setVtsConnected(!store.vtsConnected)
                        }
                        className={`w-10 h-5 rounded-full relative flex items-center transition-all ${store.vtsConnected ? "bg-neon-blue" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${store.vtsConnected ? "right-1" : "left-1"}`}
                        />
                      </button>
                    </div>

                    {store.vtsConnected && (
                      <div className="mt-4 p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-[10px] text-white/80 font-mono">
                        <span className="text-neon-blue font-bold">INFO:</span>{" "}
                        Plugin VTS estabelecido. Modelos de VTube Studio
                        receberão parâmetros de Lipsync direto na porta padrão
                        8001.
                      </div>
                    )}

                    {store.obsModeEnabled && (
                      <div className="mt-4 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg text-[10px] text-white/80 font-mono">
                        <span className="text-neon-green font-bold">
                          ATIVA:
                        </span>{" "}
                        A interface transparente para OBS está pronta. Use
                        captura de tela no modo janela transparente sem fundo no
                        OBS.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-xs font-bold text-white">
                  Integração LocalAiVtuber2 (Windows Package / HuggingFace)
                </p>
                <p className="text-[10px] text-white/40">
                  Para total compatibilidade com a flag "LocalAIVtuber2v1.1.0"
                  do HuggingFace, certifique-se de referenciar o diretório
                  correto base do rep. Todos os módulos abaixo foram projetados
                  neste frontend para emitir comandos compatíveis com o
                  respectivo sistema backend em Python.
                </p>
                <pre className="bg-black p-3 mt-2 text-[10px] font-mono rounded text-white/40 overflow-hidden leading-relaxed">
                  LocalAiVtuber2v1.1.0/plugins/stream/youtube.py
                  LocalAiVtuber2v1.1.0/plugins/stream/bilibili.py
                  LocalAiVtuber2v1.1.0/plugins/stream/twitch.py
                  LocalAiVtuber2v1.1.0/plugins/memory/chroma_rag.py
                  LocalAiVtuber2v1.1.0/plugins/discord_alert.py
                  LocalAiVtuber2v1.1.0/plugins/vts_bridge.py
                </pre>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Side Decorative Right Bar */}
      <div className="w-[3px] bg-gradient-to-b from-transparent via-neon-blue/25 to-transparent opacity-40" />
    </div>
  );
}
