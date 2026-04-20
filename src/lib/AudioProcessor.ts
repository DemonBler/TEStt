/**
 * PROCESSADOR DE ÁUDIO ANALÍTICO - AUDIO PROCESSOR (SIGNAL ANALYSIS)
 * Este módulo provê a infraestrutura básica para o processamento de sinais de áudio em tempo real na Vaelindra.
 * Ele atua como o componente de extração de amplitude indispensável para o sistema de sincronia labial (Lip-Sync).
 * As principais responsabilidades deste processador são:
 * 1. Inicializar e manter o AudioContext, a fundação de todo o processamento de áudio digital no navegador.
 * 2. Criar e configurar o AnalyserNode, definindo parâmetros como fftSize para otimizar a resolução da análise.
 * 3. Oferecer métodos para conectar fontes de áudio variadas, como MediaStream de microfone ou AudioBuffers de TTS.
 * 4. Implementar o algoritmo de cálculo de amplitude (VU Meter), convertendo frequências brutas em níveis de volume.
 * 5. Normalizar os dados de áudio em uma escala de 0 a 1, facilitando o mapeamento direto nos blendshapes do avatar VRM.
 * 6. Garantir que a análise ocorra sem latência percebível, permitindo que a boca se mova em perfeita harmonia com o som.
 * 7. Servir de utilitário para qualquer módulo que necessite de telemetria sonora (VAD, VU-VRM, Monitoramento Visual).
 */
export class AudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }

  // Se tivermos acesso ao stream de áudio, conectamos aqui
  public connectSource(source: MediaStreamAudioSourceNode | AudioBufferSourceNode) {
    source.connect(this.analyser);
  }

  public getAmplitude(): number {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length / 255;
  }
}
