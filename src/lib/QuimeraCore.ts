/**
 * ORQUESTRADOR CENTRAL - QUIMERA CORE
 * Integrated version for Sovereign VTuber.
 */
import { useSovereignStore } from "../store";
import { aiService } from "../services/localAIService";

class QuimeraCore {
  private static instance: QuimeraCore;
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): QuimeraCore {
    if (!QuimeraCore.instance) {
      QuimeraCore.instance = new QuimeraCore();
    }
    return QuimeraCore.instance;
  }

  public async wakeup() {
    const state = useSovereignStore.getState();
    state.setIsLive(true);
    state.setOrganismState("LISTENING");
    console.log("[QuimeraCore] Organismo despertado.");
    
    // Auto-init AI if needed
    await aiService.init();
  }

  public stop() {
    const state = useSovereignStore.getState();
    state.setIsLive(false);
    state.setOrganismState("IDLE");
  }

  public async processText(text: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const state = useSovereignStore.getState();
    state.setOrganismState("THINKING");
    state.addChatMessage({ id: Date.now(), user: "User", text, type: "user" });

    try {
      const response = await aiService.generate(text, state.activeCharacterCard?.systemPrompt || "");
      
      state.addChatMessage({ 
        id: Date.now() + 1, 
        user: state.activeCharacterCard?.name || "Vaelindra", 
        text: response, 
        type: "ai" 
      });

      state.setOrganismState("SPEAKING");
      // Placeholder for TTS / LipSync
      setTimeout(() => {
        state.setOrganismState("LISTENING");
        this.isProcessing = false;
      }, 2000);

    } catch (e) {
      console.error("[QuimeraCore] Error:", e);
      state.setOrganismState("LISTENING");
      this.isProcessing = false;
    }
  }
}

export const quimeraCore = QuimeraCore.getInstance();
