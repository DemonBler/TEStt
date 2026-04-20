/**
 * NÚCLEO DE ROTEAMENTO NEURAL - KERNEL (SYSTEM BUS)
 * Este módulo atua como o backbone de eventos e o sistema de barramento da Vaelindra.
 * Sua função primordial é o gerenciamento de sinais e o roteamento de mensagens entre módulos heterogêneos.
 * As principais características deste núcleo operacional são:
 * 1. Implementação do Padrão Singleton: Garante que exista apenas uma instância do Kernel em toda a aplicação.
 * 2. Registro Dinâmico de Plugins: Permite que novos módulos de funcionalidade se acoplem ao sistema em tempo de execução.
 * 3. Barramento de Eventos (Event Bus): Centraliza a emissão de sinais neurais (wakeup, message, thought, etc.).
 * 4. Desacoplamento Lógico: Remove a dependência direta entre a UI, o Cérebro e os Atuadores, facilitando a escalabilidade.
 * 5. Monitoramento de Sinais: Provê um ponto central para logging e depuração de todo o tráfego de dados do sistema.
 * 6. Integração com Eventos Globais: Traduz sinais do Kernel para eventos do DOM (CustomEvents) para consumo pela camada React.
 * 7. Arquitetura de Missão Crítica: Projetado para estabilidade máxima, servindo de fundação para a "Soberania Neural".
 */
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
