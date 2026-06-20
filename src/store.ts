import { create } from "zustand";

/**
 * SOVEREIGN STORE - MULTIMODAL STATE MANAGEMENT
 * Centralized state for the Vaelindra Sovereign ecosystem.
 */

export type OrganismState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "ERROR";

export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  type: "user" | "ai" | "system";
  color?: string;
}

export interface CharacterCard {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  expressions: Record<string, any>;
  avatar_url?: string;
}

interface SovereignState {
  // Core States
  organismState: OrganismState;
  isLive: boolean;
  isListening: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  visionEnabled: boolean;

  // Neural Status
  llmStatus: "idle" | "loading" | "active" | "error";
  sttStatus: "idle" | "loading" | "active" | "error";
  ttsStatus: "idle" | "loading" | "active" | "error";

  // Neural Configs
  llmModelId: string;
  sttEngine: "local" | "native";
  ttsEngine: "local" | "native";
  sttUrl: string;
  ttsUrl: string;
  apiEndpoint: string; // Integração com Backyard AI / Ollama / SillyTavern Backends
  vrmUrl: string; // URL do modelo 3D ativo

  // Open-LLM-VTuber Multi-Module Configurations
  llmProvider: "webgpu" | "ollama" | "llamacpp" | "openai";
  ttsProvider: "native" | "edge" | "xtts" | "gpt-sovits" | "rvc";
  sttProvider: "native" | "whisper";
  whisperUrl: string;
  edgeVoice: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  systemPromptPreset: string;

  // Audio Mixer
  bgmVolume: number;
  ttsVolume: number;
  micVolume: number;

  // Memories / RAG
  ragUrl: string;
  useRag: boolean;

  useVad: boolean;
  useVirtualAudioCable: boolean;

  // Streaming & Integration Configs
  twitchChannel: string;
  youtubeLiveId: string;
  bilibiliLiveId: string;
  vtsConnected: boolean;
  obsModeEnabled: boolean;
  discordWebhook: string;

  // Data
  chatMessages: ChatMessage[];
  activeCharacterCard: CharacterCard | null;
  mouthLevel: number;
  localAILoadingProgress: number;

  // Setters
  setOrganismState: (state: OrganismState) => void;
  setIsLive: (isLive: boolean) => void;
  setIsListening: (isListening: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setVisionEnabled: (enabled: boolean) => void;
  setMouthLevel: (level: number) => void;
  setLlmStatus: (status: "idle" | "loading" | "active" | "error") => void;
  setSttStatus: (status: "idle" | "loading" | "active" | "error") => void;
  setTtsStatus: (status: "idle" | "loading" | "active" | "error") => void;
  setLocalAILoadingProgress: (progress: number) => void;
  setApiEndpoint: (url: string) => void;
  setVrmUrl: (url: string) => void;
  setLlmModelId: (id: string) => void;
  setTtsUrl: (url: string) => void;
  setLlmProvider: (prov: "webgpu" | "ollama" | "llamacpp" | "openai") => void;
  setTtsProvider: (
    prov: "native" | "edge" | "xtts" | "gpt-sovits" | "rvc",
  ) => void;
  setSttProvider: (prov: "native" | "whisper") => void;
  setWhisperUrl: (url: string) => void;
  setEdgeVoice: (voice: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setTopP: (val: number) => void;
  setTopK: (val: number) => void;
  setSystemPromptPreset: (val: string) => void;

  setBgmVolume: (val: number) => void;
  setTtsVolume: (val: number) => void;
  setMicVolume: (val: number) => void;

  setRagUrl: (val: string) => void;
  setUseRag: (val: boolean) => void;

  setUseVad: (val: boolean) => void;
  setUseVirtualAudioCable: (val: boolean) => void;

  setTwitchChannel: (channel: string) => void;
  setYoutubeLiveId: (id: string) => void;
  setBilibiliLiveId: (id: string) => void;
  setVtsConnected: (connected: boolean) => void;
  setObsModeEnabled: (enabled: boolean) => void;
  setDiscordWebhook: (url: string) => void;

  addChatMessage: (msg: ChatMessage) => void;
  setActiveCharacterCard: (card: CharacterCard) => void;
}

export const useSovereignStore = create<SovereignState>((set) => ({
  organismState: "IDLE",
  isLive: false,
  isListening: false,
  isPlaying: false,
  isProcessing: false,
  visionEnabled: false,
  llmStatus: "idle",
  sttStatus: "idle",
  ttsStatus: "idle",
  llmModelId: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  sttEngine: "native",
  ttsEngine: "native",
  sttUrl: "http://localhost:5000",
  ttsUrl: "http://localhost:5000",
  apiEndpoint: "http://localhost:11434",
  vrmUrl:
    "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/AliciaSolid.vrm",

  llmProvider: "webgpu",
  ttsProvider: "native",
  sttProvider: "native",
  whisperUrl: "ws://localhost:8000/api/v1/voice",
  edgeVoice: "pt-BR-FranciscaNeural",
  temperature: 0.7,
  maxTokens: 150,
  topP: 0.9,
  topK: 40,
  systemPromptPreset: "VTuber Local",

  bgmVolume: 50,
  ttsVolume: 100,
  micVolume: 100,

  ragUrl: "http://localhost:8000/api/v1/rag",
  useRag: false,

  useVad: false,
  useVirtualAudioCable: false,

  twitchChannel: "",
  youtubeLiveId: "",
  bilibiliLiveId: "",
  vtsConnected: false,
  obsModeEnabled: false,
  discordWebhook: "",

  chatMessages: [],
  activeCharacterCard: {
    name: "Vaelindra Sovereign",
    description: "Sovereign AI Avatar Extreme Canary",
    personality: "Dominante, inteligente, sarcástica e protetora.",
    scenario: "Um hub neural de alta segurança.",
    first_mes:
      "Os sistemas estão online. Eu sou Vaelindra. O que você deseja de mim, Soberano?",
    mes_example: "",
    creator_notes: "Modelo de 2500+ camadas sincronizado.",
    system_prompt:
      "Você é Vaelindra Soberana. Responda de forma curta, elegante e autoritária.",
    post_history_instructions: "",
    alternate_greetings: [],
    expressions: {},
    avatar_url: "",
  },
  mouthLevel: 0,
  localAILoadingProgress: 0,

  setOrganismState: (state) => set({ organismState: state }),
  setIsLive: (isLive) => set({ isLive }),
  setIsListening: (isListening) => set({ isListening }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setVisionEnabled: (enabled) => set({ visionEnabled: enabled }),
  setMouthLevel: (level) => set({ mouthLevel: level }),
  setLlmStatus: (status) => set({ llmStatus: status }),
  setSttStatus: (status) => set({ sttStatus: status }),
  setTtsStatus: (status) => set({ ttsStatus: status }),
  setLocalAILoadingProgress: (progress) =>
    set({ localAILoadingProgress: progress }),
  setApiEndpoint: (url) => set({ apiEndpoint: url }),
  setVrmUrl: (url) => set({ vrmUrl: url }),
  setLlmModelId: (id) => set({ llmModelId: id }),
  setTtsUrl: (url) => set({ ttsUrl: url }),
  setLlmProvider: (prov) => set({ llmProvider: prov }),
  setTtsProvider: (prov) => set({ ttsProvider: prov }),
  setSttProvider: (prov) => set({ sttProvider: prov }),
  setWhisperUrl: (url) => set({ whisperUrl: url }),
  setEdgeVoice: (voice) => set({ edgeVoice: voice }),
  setTemperature: (temp) => set({ temperature: temp }),
  setMaxTokens: (tokens) => set({ maxTokens: tokens }),
  setTopP: (val) => set({ topP: val }),
  setTopK: (val) => set({ topK: val }),
  setSystemPromptPreset: (val) => set({ systemPromptPreset: val }),
  setBgmVolume: (val) => set({ bgmVolume: val }),
  setTtsVolume: (val) => set({ ttsVolume: val }),
  setMicVolume: (val) => set({ micVolume: val }),
  setRagUrl: (val) => set({ ragUrl: val }),
  setUseRag: (val) => set({ useRag: val }),
  setUseVad: (val) => set({ useVad: val }),
  setUseVirtualAudioCable: (val) => set({ useVirtualAudioCable: val }),
  setTwitchChannel: (channel) => set({ twitchChannel: channel }),
  setYoutubeLiveId: (id) => set({ youtubeLiveId: id }),
  setBilibiliLiveId: (id) => set({ bilibiliLiveId: id }),
  setVtsConnected: (connected) => set({ vtsConnected: connected }),
  setObsModeEnabled: (enabled) => set({ obsModeEnabled: enabled }),
  setDiscordWebhook: (url) => set({ discordWebhook: url }),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setActiveCharacterCard: (card) => set({ activeCharacterCard: card }),
}));
