import { create } from "zustand";

interface SovereignState {
  vmcData: any;
  telemetry: any;
  activeTab: string;
  isLive: boolean;
  chatMessages: any[];
  aiMode: "local";
  thinkingMode: boolean;
  lowLatencyMode: boolean;
  localAILoadingProgress: number;
  isLocalAIReady: boolean;
  isListening: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  user: any | null;
  transparentBackground: boolean;
  mouseTrackingEnabled: boolean;
  activeCharacterCard: any | null;
  gptSovitsUrl: string;
  gptSovitsRefAudio: string;
  gptSovitsPromptText: string;
  gptSovitsLang: string;
  useGptSovits: boolean;
  visionEnabled: boolean;
  visionSource: 'webcam' | 'screen';
  twitchChannel: string;
  isTwitchConnected: boolean;
  obsUrl: string;
  obsPassword: string;
  isObsConnected: boolean;
  vrmInspectorEnabled: boolean;
  vrmObject: any | null;
  organismState: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  
  // Professional / Commercial fields
  sttStatus: 'offline' | 'loading' | 'active' | 'error';
  ttsStatus: 'offline' | 'loading' | 'active' | 'error';
  llmStatus: 'offline' | 'loading' | 'active' | 'error';
  isLicensed: boolean;
  licenseKey: string;
  micSensitivity: number;
  emotionIntensity: number;
  
  setSttStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setTtsStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setLlmStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setIsLicensed: (val: boolean) => void;
  setLicenseKey: (key: string) => void;
  setMicSensitivity: (val: number) => void;
  setEmotionIntensity: (val: number) => void;
  
  setOrganismState: (state: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING') => void;
  setIsListening: (val: boolean) => void;
  setIsPlaying: (val: boolean) => void;
  setIsProcessing: (val: boolean) => void;
  setVmcData: (data: any) => void;
  setTelemetry: (data: any) => void;
  setActiveTab: (tab: string) => void;
  toggleLive: () => void;
  addChatMessage: (msg: any) => void;
  setThinkingMode: (enabled: boolean) => void;
  setLowLatencyMode: (enabled: boolean) => void;
  setLocalAILoadingProgress: (progress: number) => void;
  setIsLocalAIReady: (ready: boolean) => void;
  setUser: (user: any | null) => void;
  setTransparentBackground: (enabled: boolean) => void;
  setMouseTrackingEnabled: (enabled: boolean) => void;
  setActiveCharacterCard: (card: any | null) => void;
  setUseGptSovits: (val: boolean) => void;
  setGptSovitsConfig: (config: any) => void;
  setVisionEnabled: (enabled: boolean) => void;
  setVisionSource: (source: 'webcam' | 'screen') => void;
  setTwitchChannel: (channel: string) => void;
  setIsTwitchConnected: (connected: boolean) => void;
  setObsConfig: (config: { obsUrl?: string, obsPassword?: string, isObsConnected?: boolean }) => void;
  setVrmInspectorEnabled: (enabled: boolean) => void;
  setVrmObject: (vrm: any) => void;
}

export const useSovereignStore = create<SovereignState>((set) => ({
  vmcData: null,
  telemetry: null,
  activeTab: "home",
  isLive: true,
  chatMessages: [
    { id: 1, user: "System", text: "Núcleo Monólito Vaelindra v5.0.2 [Canary Extremo] - Kernel Carregado.", type: "system", color: "#00f3ff" },
    { id: 2, user: "Vaelindra", text: "Sistemas nominais, Drevlan. O kernel Fedora está estável, por enquanto. O que vamos quebrar hoje?", type: "ai", color: "#ff007f" },
  ],
  aiMode: "local",
  thinkingMode: false,
  lowLatencyMode: true,
  localAILoadingProgress: 0,
  isLocalAIReady: false,
  isListening: false,
  isPlaying: false,
  isProcessing: false,
  user: null,
  transparentBackground: false,
  mouseTrackingEnabled: true,
  activeCharacterCard: null,
  gptSovitsUrl: "http://127.0.0.1:9880",
  gptSovitsRefAudio: "",
  gptSovitsPromptText: "",
  gptSovitsLang: "pt",
  useGptSovits: false,
  visionEnabled: false,
  visionSource: 'webcam',
  twitchChannel: "",
  isTwitchConnected: false,
  obsUrl: "ws://localhost:4455",
  obsPassword: "",
  isObsConnected: false,
  vrmInspectorEnabled: false,
  vrmObject: null,
  organismState: 'IDLE',
  
  sttStatus: 'loading',
  ttsStatus: 'loading',
  llmStatus: 'loading',
  isLicensed: false,
  licenseKey: "",
  micSensitivity: 0.5,
  emotionIntensity: 0.8,
  
  setSttStatus: (val) => set({ sttStatus: val }),
  setTtsStatus: (val) => set({ ttsStatus: val }),
  setLlmStatus: (val) => set({ llmStatus: val }),
  setIsLicensed: (val) => set({ isLicensed: val }),
  setLicenseKey: (val) => set({ licenseKey: val }),
  setMicSensitivity: (val) => set({ micSensitivity: val }),
  setEmotionIntensity: (val) => set({ emotionIntensity: val }),
  
  setOrganismState: (val) => set({ organismState: val }),
  setIsListening: (val) => set({ isListening: val }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setIsProcessing: (val) => set({ isProcessing: val }),
  setVmcData: (data) => set({ vmcData: data }),
  setTelemetry: (data) => set({ telemetry: data }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleLive: () => set((state) => ({ isLive: !state.isLive })),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg].slice(-20) })),
  setThinkingMode: (enabled) => set({ thinkingMode: enabled }),
  setLowLatencyMode: (enabled) => set({ lowLatencyMode: enabled }),
  setLocalAILoadingProgress: (progress) => set({ localAILoadingProgress: progress }),
  setIsLocalAIReady: (ready) => set({ isLocalAIReady: ready }),
  setUser: (user) => set({ user }),
  setTransparentBackground: (enabled) => set({ transparentBackground: enabled }),
  setMouseTrackingEnabled: (enabled) => set({ mouseTrackingEnabled: enabled }),
  setActiveCharacterCard: (card) => set({ activeCharacterCard: card }),
  setUseGptSovits: (val) => set({ useGptSovits: val }),
  setGptSovitsConfig: (config) => set((state) => ({ ...state, ...config })),
  setVisionEnabled: (enabled) => set({ visionEnabled: enabled }),
  setVisionSource: (source) => set({ visionSource: source }),
  setTwitchChannel: (channel) => set({ twitchChannel: channel }),
  setIsTwitchConnected: (connected) => set({ isTwitchConnected: connected }),
  setObsConfig: (config) => set((state) => ({ ...state, ...config })),
  setVrmInspectorEnabled: (enabled) => set({ vrmInspectorEnabled: enabled }),
  setVrmObject: (vrm) => set({ vrmObject: vrm }),
}));
