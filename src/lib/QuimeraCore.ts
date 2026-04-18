import { useSovereignStore } from "../store";
import { transcribeLocally } from "./localSTTService";
import { generateLocalResponse, analyzeEmotionLimbic } from "./localAIService";
import { generateLocalTTS, playAudioBuffer } from "./localTTSService";
import { saveMemory, getMemoryContextString } from "./memoryService";
import { buildSystemPromptFromCard } from "./characterCardParser";
import { initLocalAIVtuberBridge } from "./AssimilatedBridge";
import { captionImageLocally } from "./localVisionService";

/**
 * QUIMERA CORE: Orquestrador Central Soberano
 * 
 * Este é o coração do sistema, responsável pela fusão total e funcional dos repositórios:
 * - LocalAIVtuber (Pipeline de Workers e Nodes)
 * - Riko Project (Identidade, ASR/TTS Pipeline)
 * - VTS Actions (Gatilhos de Expressão e OBS)
 * - Amica (Visão Multimodal Local)
 * 
 * O QuimeraCore mantém o organismo digital vivo, ouvindo e reagindo em loop contínuo.
 */
class QuimeraCore {
  private static instance: QuimeraCore;
  private vadLoopId: number | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private localAIBridge: any = null;
  private isProcessing: boolean = false;
  private videoRef: HTMLVideoElement | null = null;

  private constructor() {
    // Inicializa a ponte de assimilação dos repositórios fundidos ao carregar o núcleo
    this.localAIBridge = initLocalAIVtuberBridge();
  }

  public static getInstance(): QuimeraCore {
    if (!QuimeraCore.instance) {
      QuimeraCore.instance = new QuimeraCore();
    }
    return QuimeraCore.instance;
  }

  /**
   * Vincula o elemento de vídeo (Webcam ou Screen) para percepção visual
   */
  public registerVisionSource(video: HTMLVideoElement) {
    this.videoRef = video;
    console.log("[QuimeraCore] Retina Neural Vinculada.");
  }

  /**
   * Ativa o organismo digital e inicia a escuta contínua (VAD)
   */
  public async wakeup() {
    const state = useSovereignStore.getState();
    if (state.organismState !== 'IDLE' || !state.isLive) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(this.mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = Date.now();
      let isUserSpeaking = false;
      const THRESHOLD = 12; 
      const SILENCE_DURATION = 1500; 
      
      state.setOrganismState("LISTENING");
      state.setIsListening(true);
      window.dispatchEvent(new CustomEvent('neural_action', { detail: { action: 'neutral' } }));

      console.log("[QuimeraCore] Organismo despertado. Escuta contínua ativada.");

      const checkAudio = async () => {
        const currentState = useSovereignStore.getState();
        if (!currentState.isLive) {
            this.stop();
            return;
        }

        // Se a IA estiver falando ou o kernel processando, pausamos o VAD para evitar loop infinito
        if (currentState.isPlaying || this.isProcessing) {
          this.vadLoopId = requestAnimationFrame(checkAudio);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0; 
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        let avg = sum / dataArray.length;

        if (avg > THRESHOLD) {
          silenceStart = Date.now();
          if (!isUserSpeaking) {
            isUserSpeaking = true;
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.mediaStream!);
            this.mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) this.audioChunks.push(e.data);
            };
            this.mediaRecorder.start();
          }
        } else {
          if (isUserSpeaking && (Date.now() - silenceStart > SILENCE_DURATION)) {
            isUserSpeaking = false;
            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
              this.mediaRecorder.stop();
              this.mediaRecorder.onstop = () => this.processCycle();
            }
          }
        }
        this.vadLoopId = requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
    } catch (e) {
      console.error("[QuimeraCore] Falha crítica de ativação neural:", e);
      state.setOrganismState("IDLE");
    }
  }

  /**
   * Coloca o organismo em hibernação
   */
  public stop() {
    if (this.vadLoopId) cancelAnimationFrame(this.vadLoopId);
    if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
    const state = useSovereignStore.getState();
    state.setOrganismState("IDLE");
    state.setIsListening(false);
    console.log("[QuimeraCore] Hibernação ativada.");
  }

  /**
   * Processa manualmente uma entrada de texto (pulando o VAD/STT)
   */
  public async processText(text: string) {
    console.log("[QuimeraCore] processText received:", text, "isProcessing:", this.isProcessing);
    if (this.isProcessing) {
        console.warn("[QuimeraCore] Core busy, ignoring message.");
        return;
    }
    return this.processCycle(text);
  }

  /**
   * CICLO NEURAL INTEGRADO (A FUSÃO TOTAL)
   */
  private async processCycle(manualText?: string) {
    console.log("[QuimeraCore] processCycle starting");
    if (this.isProcessing && !manualText) {
        console.log("[QuimeraCore] processCycle already busy");
        return;
    }
    this.isProcessing = true;
    
    const state = useSovereignStore.getState();
    state.setOrganismState("THINKING");
    window.dispatchEvent(new CustomEvent('neural_action', { detail: { action: 'relaxed' } }));

    try {
      let transcript = manualText;
      let visualContext = "";

      const sttTask = !transcript ? transcribeLocally(new Blob(this.audioChunks, { type: 'audio/wav' })) : Promise.resolve(transcript);
      const visionTask = (state.visionEnabled && this.videoRef) ? (async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 224; canvas.height = 224;
        const ctx = canvas.getContext('2d');
        if (ctx && this.videoRef) {
          ctx.drawImage(this.videoRef, 0, 0, 224, 224);
          const caption = await captionImageLocally(canvas.toDataURL('image/jpeg'));
          return caption ? `\n[Contexto Visual: ${caption}]` : "";
        }
        return "";
      })() : Promise.resolve("");

      const [sttRes, visRes] = await Promise.all([sttTask, visionTask]);
      transcript = sttRes;
      visualContext = visRes;
      
      const hasTranscript = transcript && transcript.trim().length > 2;
      
      if (hasTranscript) {
        transcript = transcript!; 
        const finalPrompt = transcript + visualContext;
        state.addChatMessage({ id: Date.now(), user: "Drevlan", text: transcript, type: "user", color: "#00f3ff" });
        await saveMemory('user', finalPrompt);

        // 3. ACIONAMENTO DOS NÓS ASSIMILADOS (LocalAIVtuber & Riko Fusion)
        if (this.localAIBridge) {
            this.localAIBridge.receiveInput(transcript);
        }

        // 4. PROCESSAMENTO COGNITIVO (LLM + MEMÓRIA RAG)
        const memoryContext = await getMemoryContextString();
        const activeCard = state.activeCharacterCard;
        const systemPrompt = activeCard ? buildSystemPromptFromCard(activeCard) : null;
        
        const responseText = await generateLocalResponse(
            finalPrompt, 
            state.chatMessages.slice(-10), 
            memoryContext, 
            systemPrompt
        );
        
        if (!responseText) {
           throw new Error("Falha ao gerar resposta no núcleo local.");
        }
        
        // 5. ANÁLISE EMOCIONAL PARALELA (CÉREBRO LÍMBICO)
        const emotionPromise = analyzeEmotionLimbic(responseText).catch(() => "neutral").then(emotion => {
            window.dispatchEvent(new CustomEvent('neural_action', { detail: { action: emotion } }));
        });

        state.addChatMessage({ 
            id: Date.now()+1, 
            user: activeCard?.name || "Vaelindra", 
            text: responseText, 
            type: "ai", 
            color: "#ff007f" 
        });
        await saveMemory('ai', responseText);

        // 6. SÍNTESE DE VOZ E LIP SYNC (MMS / GPT-SoVITS)
        const ttsPayload = await generateLocalTTS(responseText);
        const samplingRate = (ttsPayload.type === 'float32' && ttsPayload.data.sampling_rate) ? ttsPayload.data.sampling_rate : 16000;
        
        state.setOrganismState("SPEAKING");
        state.setIsPlaying(true);
        (window as any).sovereignIsPlaying = true;
        
        const { source, analyser } = playAudioBuffer(ttsPayload, samplingRate);
        
        // Ativa o Lip Sync procedimental no Avatar
        this.runLipSync(analyser);

        await new Promise<void>((resolve) => {
          source.onended = () => {
            state.setIsPlaying(false);
            (window as any).sovereignIsPlaying = false;
            state.setOrganismState("LISTENING");
            resolve();
          };
        });
        
        await emotionPromise;
      } else {
        state.setOrganismState("LISTENING");
      }
    } catch (e) {
      console.error("[QuimeraCore] Falha crítica no ciclo de fusão:", e);
      state.setOrganismState("LISTENING");
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sistema de Lip Sync em tempo real para VRM 1.0 (Anatomia Virtual)
   */
  private runLipSync(analyser: AnalyserNode) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      if (!useSovereignStore.getState().isPlaying) {
        window.dispatchEvent(new CustomEvent('neural_viseme', { detail: { aa: 0, oh: 0, ih: 0, ee: 0, ou: 0 } }));
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      let low=0, mid=0, high=0;
      const len = dataArray.length;
      for(let i=0; i<len*0.1; i++) low += dataArray[i];
      for(let i=len*0.1; i<len*0.4; i++) mid += dataArray[i];
      for(let i=len*0.4; i<len; i++) high += dataArray[i];

      const lowAvg = (low / (len*0.1)) / 128.0;
      const midAvg = (mid / (len*0.3)) / 128.0;
      const highAvg = (high / (len*0.6)) / 128.0;

      window.dispatchEvent(new CustomEvent('neural_viseme', { 
        detail: {
          aa: Math.min(midAvg * 1.5, 1.0),
          ee: Math.min(highAvg * 1.5, 1.0),
          uu: Math.min(lowAvg * 1.5, 1.0),
          oo: Math.min((lowAvg + midAvg) * 0.8, 1.0),
          ih: Math.min((midAvg + highAvg) * 0.8, 1.0)
        } 
      }));
      requestAnimationFrame(update);
    };
    update();
  }
}

export const quimeraCore = QuimeraCore.getInstance();
