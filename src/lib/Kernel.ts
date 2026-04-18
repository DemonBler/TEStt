// NEURAL KERNEL: O novo coração modular da Vaelindra.
// Baseado na arquitetura de plugins de sistemas de alta performance.
// Responsável pelo roteamento de eventos, não pela lógica de negócio.

type NeuralEvent = 'wakeup' | 'message_received' | 'thinking_started' | 'thought_generated' | 'speaking_started' | 'speaking_ended';

class NeuralKernel {
  private static instance: NeuralKernel;
  private plugins: Map<string, any> = new Map();

  private constructor() {
    console.log("[Kernel] Inicialização do Sistema Soberano iniciada.");
  }

  public static getInstance(): NeuralKernel {
    if (!NeuralKernel.instance) {
      NeuralKernel.instance = new NeuralKernel();
    }
    return NeuralKernel.instance;
  }

  public registerPlugin(name: string, plugin: any) {
    this.plugins.set(name, plugin);
    console.log(`[Kernel] Plugin Assimilado: ${name}`);
  }

  public emit(event: NeuralEvent, data: any = {}) {
    console.log(`[Kernel] Emitindo sinal: ${event}`, data);
    // Roteador central de eventos - substitui as chamadas síncronas do QuimeraCore
    window.dispatchEvent(new CustomEvent('sovereign_event', { detail: { event, data } }));
  }
}

export const kernel = NeuralKernel.getInstance();
