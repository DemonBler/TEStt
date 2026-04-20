/**
 * SISTEMA DE GERENCIAMENTO DE ESTADO - SOVEREIGN CORE (useSovereignStore)
 * Este módulo é o sistema nervoso central da Vaelindra, responsável por sincronizar todos os estados entre a UI e o Kernel.
 * Ele utiliza a biblioteca Zustand para criar um store reativo que mantém o controle de processos críticos como:
 * 1. Status de conexão dos motores neurais (LLM, STT, TTS) e progresso de carregamento de pesos.
 * 2. Estado orgânico do avatar (Idling, Listening, Thinking, Speaking) para sincronia de animações VRM.
 * 3. Configurações de hardware auto-detectadas (Ollama, LM Studio) para facilitar a troca de modelos sem links.
 * 4. Histórico de chat e logs do sistema, garantindo que a memória de curto prazo seja acessível por todos os módulos.
 * 5. Parâmetros de visão (Webcam/Screen) e integração com plataformas externas como Twitch e OBS Studio.
 * 6. Controles de sensibilidade de microfone, intensidade emocional e níveis de abertura de boca para lip-sync.
 */
import { create } from "zustand";

interface SovereignState {
  // --- Estados de Conexão e Status ---
  isLocalAIReady: boolean;
  sttStatus: 'offline' | 'loading' | 'active' | 'error';
  ttsStatus: 'offline' | 'loading' | 'active' | 'error';
  llmStatus: 'offline' | 'loading' | 'active' | 'error';
  isProcessing: boolean;
  isProcessingFile: boolean;
  
  // --- Dados de Interação ---
  chatMessages: any[];
  activeCharacterCard: any | null;
  
  // --- Estado Orgânico e Visual ---
  activeTab: string;
  organismState: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  isPlaying: boolean;
  isListening: boolean;
  isLive: boolean;
  transparentBackground: boolean;
  vrmInspectorEnabled: boolean;
  vrmObject: any | null;
  mouthLevel: number;
  emotionIntensity: number;
  
  // --- Configurações de Percepção (Visão/Mic) ---
  visionEnabled: boolean;
  visionSource: 'webcam' | 'screen';
  micSensitivity: number;
  
  // --- Integração Externa (Twitch/OBS) ---
  twitchChannel: string;
  isTwitchConnected: boolean;
  obsUrl: string;
  obsPassword: string;
  isObsConnected: boolean;
  
  // --- Configurações de Motores (Kernel) ---
  llmModelId: string;
  sttEngine: 'native' | 'local';
  sttUrl: string;
  ttsEngine: 'native' | 'gemini' | 'local';
  ttsUrl: string;
  useGptSovits: boolean;
  gptSovitsUrl: string;
  gptSovitsRefAudio: string;
  gptSovitsPromptText: string;
  gptSovitsLang: string;

  // --- Auto-Detecção de Hardware ---
  detectedModels: string[];
  detectedSttEngines: string[];
  detectedTtsEngines: string[];
  localAILoadingProgress: number;

  // --- Licenciamento e Segurança ---
  isLicensed: boolean;
  licenseKey: string;
  mouseTrackingEnabled: boolean;

  // --- Ações do Sistema ---
  addChatMessage: (msg: any) => void;
  setSystemStatus: (module: 'STT' | 'TTS' | 'LLM', status: 'offline' | 'loading' | 'active' | 'error') => void;
  setProcessing: (isProcessing: boolean) => void;
  setLocalAIReady: (ready: boolean) => void;
  setSttStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setTtsStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setLlmStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setIsLocalAIReady: (ready: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setActiveTab: (tab: string) => void;
  setOrganismState: (state: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING') => void;
  setIsPlaying: (val: boolean) => void;
  setIsListening: (val: boolean) => void;
  toggleLive: () => void;
  setVisionEnabled: (enabled: boolean) => void;
  setVisionSource: (source: 'webcam' | 'screen') => void;
  setTwitchChannel: (channel: string) => void;
  setIsTwitchConnected: (connected: boolean) => void;
  setActiveCharacterCard: (card: any | null) => void;
  setTransparentBackground: (enabled: boolean) => void;
  setUseGptSovits: (val: boolean) => void;
  setGptSovitsConfig: (config: any) => void;
  setVrmInspectorEnabled: (enabled: boolean) => void;
  setVrmObject: (vrm: any) => void;
  setObsConfig: (config: any) => void;
  setLocalAILoadingProgress: (progress: number) => void;
  setIsLicensed: (val: boolean) => void;
  setLicenseKey: (key: string) => void;
  setMicSensitivity: (val: number) => void;
  setEmotionIntensity: (val: number) => void;
  setMouthLevel: (val: number) => void;
  setLlmModelId: (id: string) => void;
  setSttConfig: (engine: 'native' | 'local', url?: string) => void;
  setTtsConfig: (engine: 'native' | 'gemini' | 'local', url?: string) => void;
  setDetectedModels: (models: string[]) => void;
  setDetectedSttEngines: (engines: string[]) => void;
  setDetectedTtsEngines: (engines: string[]) => void;
}

export const useSovereignStore = create<SovereignState>((set) => ({
  // --- Inicialização de Estados ---
  isLocalAIReady: false,
  sttStatus: 'loading',
  ttsStatus: 'loading',
  llmStatus: 'loading',
  chatMessages: [{ id: 1, user: "System", text: "Vaelindra Core v2.0 Initiated. Establishing Neural Link...", type: "system", color: "#00f3ff" }],
  isProcessing: false,
  isProcessingFile: false,
  activeTab: "home",
  organismState: 'IDLE',
  isPlaying: false,
  isListening: false,
  isLive: true,
  visionEnabled: false,
  visionSource: 'webcam',
  twitchChannel: "",
  isTwitchConnected: false,
  activeCharacterCard: null,
  transparentBackground: false,
  useGptSovits: false,
  gptSovitsUrl: "http://127.0.0.1:9880",
  gptSovitsRefAudio: "",
  gptSovitsPromptText: "",
  gptSovitsLang: "pt",
  vrmInspectorEnabled: false,
  vrmObject: null,
  obsUrl: "ws://localhost:4455",
  obsPassword: "",
  isObsConnected: false,
  mouseTrackingEnabled: true,
  isLicensed: false,
  licenseKey: "",
  micSensitivity: 0.5,
  emotionIntensity: 0.8,
  localAILoadingProgress: 0,
  mouthLevel: 0,
  llmModelId: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  sttEngine: 'native',
  sttUrl: "http://localhost:8000",
  ttsEngine: 'gemini',
  ttsUrl: "http://localhost:9880",
  detectedModels: [],
  detectedSttEngines: ['native'],
  detectedTtsEngines: ['native', 'gemini'],
  
  // --- Implementação de Setters ---
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setSystemStatus: (module, status) => set({ [`${module.toLowerCase()}Status`]: status }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setLocalAIReady: (ready) => set({ isLocalAIReady: ready }),
  setSttStatus: (status) => set({ sttStatus: status }),
  setTtsStatus: (status) => set({ ttsStatus: status }),
  setLlmStatus: (status) => set({ llmStatus: status }),
  setIsLocalAIReady: (ready) => set({ isLocalAIReady: ready }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOrganismState: (state) => set({ organismState: state }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setIsListening: (val) => set({ isListening: val }),
  toggleLive: () => set((state) => ({ isLive: !state.isLive })),
  setVisionEnabled: (val) => set({ visionEnabled: val }),
  setVisionSource: (val) => set({ visionSource: val }),
  setTwitchChannel: (val) => set({ twitchChannel: val }),
  setIsTwitchConnected: (val) => set({ isTwitchConnected: val }),
  setActiveCharacterCard: (val) => set({ activeCharacterCard: val }),
  setTransparentBackground: (val) => set({ transparentBackground: val }),
  setUseGptSovits: (val) => set({ useGptSovits: val }),
  setGptSovitsConfig: (config) => set((state) => ({ ...state, ...config })),
  setVrmInspectorEnabled: (val) => set({ vrmInspectorEnabled: val }),
  setVrmObject: (val) => set({ vrmObject: val }),
  setObsConfig: (config) => set((state) => ({ ...state, ...config })),
  setLocalAILoadingProgress: (progress) => set({ localAILoadingProgress: progress }),
  setIsLicensed: (val) => set({ isLicensed: val }),
  setLicenseKey: (val) => set({ licenseKey: val }),
  setMicSensitivity: (val) => set({ micSensitivity: val }),
  setEmotionIntensity: (val) => set({ emotionIntensity: val }),
  setMouthLevel: (val) => set({ mouthLevel: val }),
  setLlmModelId: (id) => set({ llmModelId: id }),
  setSttConfig: (engine, url) => set({ sttEngine: engine, sttUrl: url || "http://localhost:8000" }),
  setTtsConfig: (engine, url) => set({ ttsEngine: engine, ttsUrl: url || "http://localhost:9880" }),
  setDetectedModels: (models) => set({ detectedModels: models }),
  setDetectedSttEngines: (engines) => set({ detectedSttEngines: engines }),
  setDetectedTtsEngines: (engines) => set({ detectedTtsEngines: engines }),
}));
