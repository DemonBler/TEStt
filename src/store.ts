import { create } from "zustand";

interface SovereignState {
  isLocalAIReady: boolean;
  sttStatus: 'offline' | 'loading' | 'active' | 'error';
  ttsStatus: 'offline' | 'loading' | 'active' | 'error';
  llmStatus: 'offline' | 'loading' | 'active' | 'error';
  chatMessages: any[];
  isProcessing: boolean;
  
  // Restored necessary fields
  activeTab: string;
  organismState: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  isPlaying: boolean;
  isListening: boolean;
  isLive: boolean;
  isProcessingFile: boolean;
  visionEnabled: boolean;
  visionSource: 'webcam' | 'screen';
  twitchChannel: string;
  isTwitchConnected: boolean;
  activeCharacterCard: any | null;
  transparentBackground: boolean;
  useGptSovits: boolean;
  gptSovitsUrl: string;
  gptSovitsRefAudio: string;
  gptSovitsPromptText: string;
  gptSovitsLang: string;
  vrmInspectorEnabled: boolean;
  vrmObject: any | null;
  obsUrl: string;
  obsPassword: string;
  isObsConnected: boolean;
  mouseTrackingEnabled: boolean;
  isLicensed: boolean;
  licenseKey: string;
  micSensitivity: number;
  emotionIntensity: number;
  localAILoadingProgress: number;
  mouthLevel: number;

  // Actions (New)
  addChatMessage: (msg: any) => void;
  setSystemStatus: (module: 'STT' | 'TTS' | 'LLM', status: 'offline' | 'loading' | 'active' | 'error') => void;
  setProcessing: (isProcessing: boolean) => void;
  setLocalAIReady: (ready: boolean) => void;
  
  // Aliases (Compatibility)
  setSttStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setTtsStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setLlmStatus: (status: 'offline' | 'loading' | 'active' | 'error') => void;
  setIsLocalAIReady: (ready: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  
  // Restored necessary setters
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
}

export const useSovereignStore = create<SovereignState>((set) => ({
  isLocalAIReady: false,
  sttStatus: 'loading',
  ttsStatus: 'loading',
  llmStatus: 'loading',
  chatMessages: [{ id: 1, user: "System", text: "Vaelindra Core v2.0 Initiated. Establishing Neural Link...", type: "system", color: "#00f3ff" }],
  isProcessing: false,
  activeTab: "home",
  organismState: 'IDLE',
  isPlaying: false,
  isListening: false,
  isLive: true,
  isProcessingFile: false,
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
  
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setSystemStatus: (module, status) => set({ [`${module.toLowerCase()}Status`]: status }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setLocalAIReady: (ready) => set({ isLocalAIReady: ready }),
  
  // Aliases Implementation
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
}));
