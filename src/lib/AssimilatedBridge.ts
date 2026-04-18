import { useSovereignStore } from "../store";
import { generateLocalResponse } from "./localAIService";
import { generateLocalTTS, playAudioBuffer } from "./localTTSService";
import { saveMemory } from "./memoryService";

/**
 * ASSIMILATION BRIDGE: LocalAIVtuber
 * Repositório original: 0Xiaohei0/LocalAIVtuber (Clonado em /src/assimilated_modules/LocalAIVtuber)
 * 
 * Este módulo entrelaça a lógica do Python "global_state", "EventManager" e as queues
 * do LocalAIVtuber no núcleo TypeScript React da Vaelindra.
 */

// Simulando a estrutura do globals.py do LocalAIVtuber
export enum GlobalKeys {
    IS_IDLE = "IS_IDLE",
    CURRENT_MOOD = "CURRENT_MOOD",
    AUDIO_QUEUE_SIZE = "AUDIO_QUEUE_SIZE"
}

export class GlobalState {
    private listeners: Record<string, Function[]> = {};

    public setValue(key: GlobalKeys, value: any) {
        if (key === GlobalKeys.IS_IDLE) {
            useSovereignStore.getState().setIsProcessing(!value);
        }
        
        if (this.listeners[key]) {
            this.listeners[key].forEach(cb => cb(value));
        }
    }

    public addListener(key: GlobalKeys, cb: Function) {
        if (!this.listeners[key]) this.listeners[key] = [];
        this.listeners[key].push(cb);
    }
}

export const assimilatedGlobalState = new GlobalState();

// Simulando o PluginLoader.py e Nodes do LocalAIVtuber (Input, LLM, TTS, VTuber)
export class AssimilatedNode {
    protected outputListeners: Function[] = [];
    
    public addOutputEventListener(cb: Function) {
        this.outputListeners.push(cb);
    }

    protected triggerOutput(data: any) {
        this.outputListeners.forEach(cb => cb(data));
    }
}

export class AssimilatedInputNode extends AssimilatedNode {
    public receiveInput(text: string) {
        this.triggerOutput(text);
    }
}

export class AssimilatedLLMNode extends AssimilatedNode {
    public async receiveInput(text: string) {
        console.log(`[LocalAI-LLM Node] Ativando Llama-3 Assimilado para: ${text}`);
        try {
            const card = useSovereignStore.getState().activeCharacterCard;
            const history = useSovereignStore.getState().chatMessages;
            const response = await generateLocalResponse(text, history, "", card?.systemPrompt || "");
            
            await saveMemory('ai', response);
            this.triggerOutput(response);
        } catch (e) {
            console.error("[LocalAI-LLM Node] Erro de Processamento:", e);
        }
    }
}

export class AssimilatedTTSNode extends AssimilatedNode {
    public async receiveInput(text: string) {
        console.log(`[LocalAI-TTS Node] Sinkronizando audio via motor MMS/SoVITS para: ${text}`);
        try {
            const audioPayload = await generateLocalTTS(text);
            playAudioBuffer(audioPayload);
            this.triggerOutput(text);
        } catch (e) {
            console.error("[LocalAI-TTS Node] Erro de TTS:", e);
        }
    }
}

export class AssimilatedVTuberNode extends AssimilatedNode {
    public receiveInput(audioData: any) {
        console.log(`[LocalAI-VTuber Node] Movendo lábios (LipSync)...`);
    }
}

export class AssimilatedRikoNode extends AssimilatedNode {
    public async receiveInput(text: string) {
        console.log(`[Riko-Project Node] Processando pipeline Riko para: ${text}`);
        this.triggerOutput(text);
    }
}

// Inicia Pipeline da Quimera (LocalAIVtuber + Riko Project)
export const initLocalAIVtuberBridge = () => {
    // Nodes LocalAI
    const input = new AssimilatedInputNode();
    const llm = new AssimilatedLLMNode();
    const tts = new AssimilatedTTSNode();
    const vtuber = new AssimilatedVTuberNode();

    // Node Riko
    const rikoNode = new AssimilatedRikoNode();

    // Entrelaçando Eventos (Fusão de Repositórios)
    input.addOutputEventListener((data: any) => {
        llm.receiveInput(data);
        rikoNode.receiveInput(data); // Riko e LocalAI agora escutam o mesmo Input simultaneamente
    });
    
    llm.addOutputEventListener((data: any) => tts.receiveInput(data));
    tts.addOutputEventListener((data: any) => vtuber.receiveInput(data));

    console.log("[Assimilated Bridge] LocalAIVtuber e Riko Project interlaçados à Soberania Neural.");
    
    // Devolve o Input para podermos chamar de fora
    return input;
};
