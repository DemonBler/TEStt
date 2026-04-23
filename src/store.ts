import { create } from "zustand";

/**
 * SOVEREIGN STORE - MULTIMODAL STATE MANAGEMENT
 * Centralized state for the Vaelindra Sovereign ecosystem.
 */

export type OrganismState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "ERROR";

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
  llmStatus: 'idle' | 'loading' | 'active' | 'error';
  sttStatus: 'idle' | 'loading' | 'active' | 'error';
  ttsStatus: 'idle' | 'loading' | 'active' | 'error';
  
  // Neural Configs
  llmModelId: string;
  sttEngine: 'local' | 'native';
  ttsEngine: 'local' | 'native';
  sttUrl: string;
  ttsUrl: string;
  apiEndpoint: string; // Integração com Backyard AI / Ollama / SillyTavern Backends
  
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
  setLlmStatus: (status: 'idle' | 'loading' | 'active' | 'error') => void;
  setSttStatus: (status: 'idle' | 'loading' | 'active' | 'error') => void;
  setTtsStatus: (status: 'idle' | 'loading' | 'active' | 'error') => void;
  setLocalAILoadingProgress: (progress: number) => void;
  setApiEndpoint: (url: string) => void;
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
  llmStatus: 'idle',
  sttStatus: 'idle',
  ttsStatus: 'idle',
  llmModelId: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  sttEngine: 'native',
  ttsEngine: 'native',
  sttUrl: "http://localhost:5000",
  ttsUrl: "http://localhost:5000",
  apiEndpoint: "http://localhost:11434",
  chatMessages: [],
  activeCharacterCard: {
    name: "Vaelindra Sovereign",
    description: "Sovereign AI Avatar Extreme Canary",
    personality: "Dominante, inteligente, sarcástica e protetora.",
    scenario: "Um hub neural de alta segurança.",
    first_mes: "Os sistemas estão online. Eu sou Vaelindra. O que você deseja de mim, Soberano?",
    mes_example: "",
    creator_notes: "Modelo de 2500+ camadas sincronizado.",
    system_prompt: "Você é Vaelindra Soberana. Responda de forma curta, elegante e autoritária.",
    post_history_instructions: "",
    alternate_greetings: [],
    expressions: {},
    avatar_url: ""
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
  setLocalAILoadingProgress: (progress) => set({ localAILoadingProgress: progress }),
  setApiEndpoint: (url) => set({ apiEndpoint: url }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setActiveCharacterCard: (card) => set({ activeCharacterCard: card }),
}));
