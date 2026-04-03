import { create } from "zustand";

interface SovereignState {
  vmcData: any;
  telemetry: any;
  activeTab: string;
  isLive: boolean;
  chatMessages: any[];
  setVmcData: (data: any) => void;
  setTelemetry: (data: any) => void;
  setActiveTab: (tab: string) => void;
  toggleLive: () => void;
  addChatMessage: (msg: any) => void;
}

export const useSovereignStore = create<SovereignState>((set) => ({
  vmcData: null,
  telemetry: null,
  activeTab: "home",
  isLive: false,
  chatMessages: [
    { id: 1, user: "System", text: "Núcleo Monólito Vaelindra v5.0.2 [Canary Extremo] - Kernel Carregado.", type: "system", color: "#00f3ff" },
    { id: 2, user: "Vaelindra", text: "Sistemas nominais, Drevlan. O kernel Fedora está estável, por enquanto. O que vamos quebrar hoje?", type: "ai", color: "#ff007f" },
  ],
  setVmcData: (data) => set({ vmcData: data }),
  setTelemetry: (data) => set({ telemetry: data }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleLive: () => set((state) => ({ isLive: !state.isLive })),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg].slice(-20) })),
}));
