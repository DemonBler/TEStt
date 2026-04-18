/**
 * Processador de Áudio Leve para extração de amplitude (VU-VRM logic)
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
