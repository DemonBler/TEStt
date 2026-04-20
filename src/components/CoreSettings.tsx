/**
 * COMPONENTE DE CONFIGURAÇÃO DO KERNEL - CORE SETTINGS (AUTO-SYNC UI)
 * Este componente é a interface de controle mestre para a sincronização de hardware e motores de IA da Vaelindra.
 * Ele foi projetado para oferecer "Facilidade Total", eliminando a necessidade de configuração manual de links e portas.
 * As principais responsabilidades deste módulo incluem:
 * 1. Realizar varreduras automáticas (Auto-Scan) em portas comuns de serviços de IA como Ollama, LM Studio e Whisper.
 * 2. Mapear dinamicamente os modelos encontrados no computador do usuário e apresentá-los como cards selecionáveis.
 * 3. Gerenciar o estado de visualização da varredura, fornecendo feedback de status em tempo real durante a busca por hardware.
 * 4. Facilitar a troca de motores de áudio (STT e TTS) entre opções nativas de navegador e instâncias locais privadas.
 * 5. Orquestrar o reset e hot-reload dos motores neurais sem a necessidade de reiniciar a aplicação ou atualizar a página.
 * 6. Apresentar uma interface visual limpa, utilizando ícones da biblioteca Lucide e animações reativas para melhor experiência.
 */
import React, { useState, useEffect } from "react";
import { Cpu, Mic, Volume2, Globe, RefreshCw, CheckCircle2, Box, Radio } from "lucide-react";
import { useSovereignStore } from "../store";
import { resetEngine, getLocalAI } from "../lib/localAIService";

export const CoreSettings = () => {
    const store = useSovereignStore();
    const [scanning, setScanning] = useState(false);
    const [status, setStatus] = useState<string>("");

    useEffect(() => {
        scanEverywhere();
    }, []);

    const scanEverywhere = async () => {
        setScanning(true);
        setStatus("Sincronizando com o Hardware...");
        const foundModels: string[] = [];
        const sttEngines: string[] = ['native'];
        const ttsEngines: string[] = ['native', 'gemini'];

        try {
            // 1. Check for Ollama (11434)
            try {
                const res = await fetch("http://localhost:11434/api/tags");
                const data = await res.json();
                if (data.models) {
                    data.models.forEach((m: any) => foundModels.push(`Ollama: ${m.name}`));
                }
            } catch(e) {}

            // 2. Check for LM Studio / OpenAI Compat (1234)
            try {
                const res = await fetch("http://localhost:1234/v1/models");
                const data = await res.json();
                if (data.data) {
                    data.data.forEach((m: any) => foundModels.push(`LM Studio: ${m.id}`));
                }
            } catch(e) {}

            // 3. Check for Whisper / local STT (8000)
            try {
                const res = await fetch("http://localhost:8000/");
                if (res.ok) sttEngines.push('local');
            } catch(e) {}

            // 4. Check for GPT-SoVITS / local TTS (9880)
            try {
                const res = await fetch("http://localhost:9880/");
                if (res.ok) ttsEngines.push('local');
            } catch(e) {}

            // Fallback: Web-LLM (The ones we already support internally)
            foundModels.push("Web-LLM: Qwen2-0.5B", "Web-LLM: SmolLM-135M");

            store.setDetectedModels(foundModels);
            store.setDetectedSttEngines(sttEngines);
            store.setDetectedTtsEngines(ttsEngines);
            
            setStatus(`Sincronizado! ${foundModels.length} sistemas localizados.`);
        } catch(e) {
            setStatus("Erro na Varredura. Verifique se os apps de IA estão abertos.");
        } finally {
            setScanning(false);
        }
    };

    const selectModel = async (modelName: string) => {
        let realId = modelName;
        if (modelName.includes("Web-LLM: Qwen2")) realId = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
        if (modelName.includes("Web-LLM: SmolLM")) realId = "SmolLM-135M-Instruct-v0.2-q4f16_1-MLC";
        
        store.setLlmModelId(realId);
        setStatus(`Mudando para ${modelName}...`);
        
        try {
            await resetEngine();
            await getLocalAI((p) => store.setLocalAILoadingProgress(p));
            setStatus(`${modelName} está ONLINE.`);
        } catch(e) {
            setStatus("Falha ao carregar modelo.");
        }
    };

    return (
        <div className="flex flex-col gap-8 p-1">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                        <Globe className="w-6 h-6 text-neon-blue" /> Matriz de Sincronia Local
                    </h2>
                    <p className="text-[10px] text-white/30 uppercase mt-1 font-mono">Reconhecimento automático de hardware e modelos instalados no PC.</p>
                </div>
                <button 
                    onClick={scanEverywhere}
                    disabled={scanning}
                    className={`px-6 py-3 rounded-2xl flex items-center gap-3 transition-all ${scanning ? 'bg-white/5 text-white/20' : 'bg-neon-blue text-black font-black hover:scale-105 active:scale-95'}`}
                >
                    <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] uppercase tracking-widest">{scanning ? "Escaneando PC..." : "Sincronizar Hardware"}</span>
                </button>
            </div>

            {status && (
                <div className="px-5 py-3 rounded-xl bg-neon-blue/5 border border-neon-blue/20 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-neon-blue" />
                    <span className="text-[10px] font-mono font-bold text-neon-blue uppercase">{status}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna LLM */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Cpu className="w-4 h-4 text-white/40" />
                        <h3 className="text-[10px] font-black uppercase text-white/60 tracking-widest">Cérebro (LLM)</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2 h-48 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                        {store.detectedModels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-20 gap-2">
                                <Box className="w-8 h-8" />
                                <span className="text-[8px] uppercase font-black text-center">Nenhum modelo localizado.<br/>Clique em Sincronizar.</span>
                            </div>
                        ) : (
                            store.detectedModels.map(m => (
                                <button 
                                    key={m}
                                    onClick={() => selectModel(m)}
                                    className={`w-full p-3 rounded-xl text-left border transition-all ${store.llmModelId.includes(m.split(': ')[1] || m) ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20'}`}
                                >
                                    <div className="text-[9px] font-black uppercase leading-tight">{m}</div>
                                    <div className="text-[7px] opacity-50 font-mono">SISTEMA ATIVO</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Coluna STT */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Mic className="w-4 h-4 text-white/40" />
                        <h3 className="text-[10px] font-black uppercase text-white/60 tracking-widest">Audição (STT)</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {store.detectedSttEngines.map(engine => (
                            <button 
                                key={engine}
                                onClick={() => store.setSttConfig(engine as any)}
                                className={`w-full p-5 rounded-3xl text-left border flex items-center justify-between transition-all ${store.sttEngine === engine ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                            >
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest">{engine === 'native' ? 'Nativo (Chrome)' : 'Soberano Local'}</div>
                                    <div className="text-[8px] opacity-60 font-mono">{engine === 'native' ? 'Latência Zero' : 'Privacidade Total (Whisper)'}</div>
                                </div>
                                <Radio className={`w-4 h-4 ${store.sttEngine === engine ? 'fill-green-500' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coluna TTS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Volume2 className="w-4 h-4 text-white/40" />
                        <h3 className="text-[10px] font-black uppercase text-white/60 tracking-widest">Enunciação (TTS)</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {store.detectedTtsEngines.map(engine => (
                            <button 
                                key={engine}
                                onClick={() => store.setTtsConfig(engine as any)}
                                className={`w-full p-5 rounded-3xl text-left border flex items-center justify-between transition-all ${store.ttsEngine === engine ? 'bg-pink-500/10 border-pink-500/50 text-pink-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                            >
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest">{engine.toUpperCase()}</div>
                                    <div className="text-[8px] opacity-60 font-mono">
                                        {engine === 'native' ? 'Voz de Sistema' : engine === 'gemini' ? 'Voz Neural IA' : 'Voz Local (GPT-SoVITS)'}
                                    </div>
                                </div>
                                <Radio className={`w-4 h-4 ${store.ttsEngine === engine ? 'fill-pink-500' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
