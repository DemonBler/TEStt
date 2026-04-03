import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Cpu, 
  Database, 
  Settings as SettingsIcon, 
  Zap, 
  Activity, 
  Eye, 
  HardDrive,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Search,
  Download
} from "lucide-react";
import { useSovereignStore } from "../store";

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="h-10 w-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
      <Icon className="w-5 h-5 text-neon-blue" />
    </div>
    <div>
      <h3 className="text-lg font-mono font-bold text-white uppercase tracking-widest">{title}</h3>
      <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">{subtitle}</p>
    </div>
  </div>
);

const SettingToggle = ({ label, description, active, onClick }: any) => (
  <div 
    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
      active ? "bg-neon-blue/10 border-neon-blue/50" : "glass border-white/5 hover:border-white/20"
    }`}
    onClick={onClick}
  >
    <div className="space-y-1">
      <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">{label}</div>
      <div className="text-[10px] font-mono text-white/40 uppercase">{description}</div>
    </div>
    <div className={`h-4 w-8 rounded-full p-0.5 transition-colors ${active ? "bg-neon-blue" : "bg-white/10"}`}>
      <motion.div 
        className="h-3 w-3 rounded-full bg-white"
        animate={{ x: active ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  </div>
);

const SettingSlider = ({ label, value, min, max, unit, onChange }: any) => (
  <div className="p-4 rounded-xl glass border border-white/5 space-y-4">
    <div className="flex justify-between items-center">
      <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">{label}</div>
      <div className="text-xs font-mono text-neon-pink font-bold">{value}{unit}</div>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
    />
  </div>
);

export function SettingsPanel() {
  const [models, setModels] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState(localStorage.getItem('vaelindra_model') || "qwen2.5:0.5b");
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [aiSwitchNotification, setAiSwitchNotification] = useState<string | null>(null);

  const [hfSearchQuery, setHfSearchQuery] = useState("");
  const [hfResults, setHfResults] = useState<any[]>([]);
  const [isSearchingHf, setIsSearchingHf] = useState(false);
  
  const [vramLimit, setVramLimit] = useState(parseFloat(localStorage.getItem('vaelindra_vram_limit') || '8.5'));
  const [latencyTarget, setLatencyTarget] = useState(parseInt(localStorage.getItem('vaelindra_latency_target') || '20'));
  const [skinFlush, setSkinFlush] = useState(localStorage.getItem('vaelindra_skin_flush') !== 'false');
  const [microExpressions, setMicroExpressions] = useState(localStorage.getItem('vaelindra_micro_expressions') !== 'false');
  const [memoryPinning, setMemoryPinning] = useState(localStorage.getItem('vaelindra_memory_pinning') !== 'false');
  const [verboseLogs, setVerboseLogs] = useState(localStorage.getItem('vaelindra_verbose_logs') === 'true');
  const [networkIsolation, setNetworkIsolation] = useState(localStorage.getItem('vaelindra_network_isolation') !== 'false');
  const [gpuOverdrive, setGpuOverdrive] = useState(localStorage.getItem('vaelindra_gpu_overdrive') === 'true');

  useEffect(() => {
    localStorage.setItem('vaelindra_vram_limit', vramLimit.toString());
    localStorage.setItem('vaelindra_latency_target', latencyTarget.toString());
    localStorage.setItem('vaelindra_skin_flush', skinFlush.toString());
    localStorage.setItem('vaelindra_micro_expressions', microExpressions.toString());
    localStorage.setItem('vaelindra_memory_pinning', memoryPinning.toString());
    localStorage.setItem('vaelindra_verbose_logs', verboseLogs.toString());
    localStorage.setItem('vaelindra_network_isolation', networkIsolation.toString());
    localStorage.setItem('vaelindra_gpu_overdrive', gpuOverdrive.toString());
  }, [vramLimit, latencyTarget, skinFlush, microExpressions, memoryPinning, verboseLogs, networkIsolation, gpuOverdrive]);

  const [vtubePort, setVtubePort] = useState(localStorage.getItem('vaelindra_vtube_port') || '8001');
  const [vtubeStatus, setVtubeStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vrmPath, setVrmPath] = useState(localStorage.getItem('vaelindra_vrm_path') || "local://models/avatars/vaelindra_v5.vrm");

  const fetchModels = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('/api/ollama/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        setOllamaStatus('connected');
      } else {
        setOllamaStatus('error');
      }
    } catch (e) {
      setOllamaStatus('error');
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleModelChange = (modelName: string) => {
    setActiveModel(modelName);
    localStorage.setItem('vaelindra_model', modelName);
    setAiSwitchNotification(`IA trocada para: ${modelName}`);
    setTimeout(() => setAiSwitchNotification(null), 3000);
  };

  const cycleAIModel = () => {
    if (models.length <= 1) {
      setAiSwitchNotification("Nenhuma outra IA disponível para trocar.");
      setTimeout(() => setAiSwitchNotification(null), 3000);
      return;
    }
    const currentIndex = models.findIndex(m => m.name === activeModel);
    const nextIndex = (currentIndex + 1) % models.length;
    handleModelChange(models[nextIndex].name);
  };

  const searchHuggingFace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hfSearchQuery.trim()) return;
    
    setIsSearchingHf(true);
    try {
      const res = await fetch(`/api/huggingface/search?q=${encodeURIComponent(hfSearchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setHfResults(data.models || []);
      }
    } catch (error) {
      console.error("Falha ao buscar no Hugging Face");
    } finally {
      setIsSearchingHf(false);
    }
  };

  const testVTubeConnection = () => {
    setVtubeStatus('connecting');
    localStorage.setItem('vaelindra_vtube_port', vtubePort);
    
    try {
      const ws = new WebSocket(`ws://localhost:${vtubePort}`);
      
      ws.onopen = () => {
        setVtubeStatus('connected');
        ws.close();
      };
      
      ws.onerror = () => {
        setVtubeStatus('disconnected');
      };
    } catch (e) {
      setVtubeStatus('disconnected');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVrmPath(file.name);
      localStorage.setItem('vaelindra_vrm_url', url);
      localStorage.setItem('vaelindra_vrm_path', file.name);
      // Trigger a custom event so the Viewer knows to reload
      window.dispatchEvent(new Event('vrm_changed'));
    }
  };

  return (
    <div className="w-full h-full flex gap-8 overflow-hidden">
      {/* Left Column: Hardware & Models */}
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
        
        {/* Model Orchestration */}
        <div className="glass rounded-3xl border border-white/5 p-8 relative">
          {aiSwitchNotification && (
            <div className="absolute top-4 right-4 bg-neon-blue/20 border border-neon-blue/50 text-neon-blue px-4 py-2 rounded-lg text-xs font-mono animate-pulse z-10">
              {aiSwitchNotification}
            </div>
          )}
          <div className="flex justify-between items-start">
            <SectionHeader icon={Database} title="Orquestração Neural" subtitle="Gerenciamento de Modelos Locais" />
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {ollamaStatus === 'checking' && <RefreshCw className="w-4 h-4 text-white/50 animate-spin" />}
                {ollamaStatus === 'connected' && <CheckCircle2 className="w-4 h-4 text-[#76B900]" />}
                {ollamaStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-xs font-mono text-white/50 uppercase">
                  {ollamaStatus === 'connected' ? 'Ollama Online' : ollamaStatus === 'error' ? 'Ollama Offline' : 'Verificando...'}
                </span>
              </div>
              <button 
                onClick={cycleAIModel}
                className="px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[10px] font-mono uppercase tracking-widest hover:bg-neon-blue/20 transition-all"
              >
                Trocar IA Ativa
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {models.length > 0 ? models.map((model) => (
              <div 
                key={model.name}
                onClick={() => handleModelChange(model.name)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  activeModel === model.name 
                    ? "bg-neon-blue/5 border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                    : "glass border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${activeModel === model.name ? "bg-neon-blue animate-pulse" : "bg-white/20"}`} />
                  <div>
                    <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">{model.name}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Tamanho: {(model.size / 1e9).toFixed(2)} GB</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${
                    activeModel === model.name ? "text-neon-blue" : "text-white/20"
                  }`}>
                    {activeModel === model.name ? "Ativo" : "Disponível"}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                Nenhum modelo detectado. Certifique-se de que o Ollama está rodando na porta 11434.
              </div>
            )}
            <button 
              onClick={fetchModels}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar Lista de Modelos
            </button>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 flex items-start gap-4">
            <Terminal className="w-5 h-5 text-neon-pink shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="text-xs font-mono text-neon-pink uppercase tracking-widest font-bold">Substituição via CLI</div>
              <div className="text-[10px] font-mono text-white/60">
                Para injetar manualmente um modelo .gguf ou .safetensors bruto, coloque o arquivo no diretório <span className="text-white bg-white/10 px-1 rounded">/models</span> e reinicie o serviço Núcleo Soberano.
              </div>
            </div>
          </div>
        </div>

        {/* Hugging Face Hub Integration */}
        <div className="glass rounded-3xl border border-white/5 p-8">
          <SectionHeader icon={Download} title="Hugging Face Hub" subtitle="Mineração de Modelos Físicos (.GGUF)" />
          
          <form onSubmit={searchHuggingFace} className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-white/40" />
              </div>
              <input 
                type="text" 
                value={hfSearchQuery}
                onChange={(e) => setHfSearchQuery(e.target.value)}
                placeholder="Ex: uncensored, roleplay, mistral..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearchingHf}
              className="px-6 rounded-xl bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-mono uppercase hover:bg-neon-blue/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearchingHf ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Buscar"}
            </button>
          </form>

          <div className="space-y-3">
            {hfResults.length > 0 ? hfResults.map((model) => (
              <div key={model.id} className="p-4 rounded-xl glass border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono font-bold text-white">{model.id}</div>
                    <div className="text-[10px] font-mono text-white/40 mt-1">Downloads: {model.downloads.toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-white/5 text-[8px] font-mono text-white/60 uppercase">
                    GGUF
                  </span>
                </div>
                <button 
                  onClick={() => alert(`Para instalar este modelo, abra o terminal e digite:\n\nollama run hf.co/${model.id}`)}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Obter Comando de Instalação
                </button>
              </div>
            )) : (
              <div className="text-center p-6 border border-dashed border-white/10 rounded-xl">
                <p className="text-[10px] font-mono text-white/40 uppercase">Pesquise repositórios brutos no Hugging Face.</p>
                <p className="text-[8px] font-mono text-white/20 mt-2">Apenas modelos quantizados (.gguf) suportados nativamente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Hardware Constraints */}
        <div className="glass rounded-3xl border border-white/5 p-8">
          <SectionHeader icon={Cpu} title="Restrições de Hardware" subtitle="RTX 4060 / Limites do Sistema" />
          <div className="space-y-6">
            <SettingSlider 
              label="Limite de Alocação de VRAM" 
              value={vramLimit} 
              min={2} max={12} unit="GB" 
              onChange={setVramLimit} 
            />
            <SettingSlider 
              label="Latência Alvo de Inferência" 
              value={latencyTarget} 
              min={5} max={100} unit="ms" 
              onChange={setLatencyTarget} 
            />
            <div className="grid grid-cols-2 gap-4">
              <SettingToggle 
                label="Fixação de Memória" 
                description="Travar tensores na VRAM" 
                active={memoryPinning} 
                onClick={() => setMemoryPinning(!memoryPinning)} 
              />
              <SettingToggle 
                label="Overdrive da GPU" 
                description="Ignorar limites térmicos" 
                active={gpuOverdrive} 
                onClick={() => setGpuOverdrive(!gpuOverdrive)} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: VTube & Engine */}
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
        
        {/* VTube Integration */}
        <div className="glass rounded-3xl border border-white/5 p-8">
          <SectionHeader icon={Eye} title="Integração VTube Studio" subtitle="Conexão WebSocket Local" />
          <div className="space-y-4">
            <div className="p-4 rounded-xl glass border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Porta WebSocket</div>
                <div className="flex items-center gap-2">
                  {vtubeStatus === 'connected' && <CheckCircle2 className="w-4 h-4 text-[#76B900]" />}
                  {vtubeStatus === 'disconnected' && <XCircle className="w-4 h-4 text-red-500" />}
                  {vtubeStatus === 'connecting' && <RefreshCw className="w-4 h-4 text-white/50 animate-spin" />}
                  <span className="text-[10px] font-mono text-white/50 uppercase">
                    {vtubeStatus === 'connected' ? 'Conectado' : vtubeStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={vtubePort}
                  onChange={(e) => setVtubePort(e.target.value)}
                  className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f3ff]"
                  placeholder="8001"
                />
                <button 
                  onClick={testVTubeConnection}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] text-xs font-mono uppercase hover:bg-[#00f3ff]/20 transition-colors flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Testar Conexão
                </button>
              </div>
            </div>

            <SettingToggle 
              label="Microexpressões" 
              description="Espasmos faciais involuntários sub-20ms" 
              active={microExpressions} 
              onClick={() => setMicroExpressions(!microExpressions)} 
            />
            <SettingToggle 
              label="Shader de Rubor da Pele" 
              description="Simulação dinâmica de fluxo sanguíneo" 
              active={skinFlush} 
              onClick={() => setSkinFlush(!skinFlush)} 
            />
            <div className="p-4 rounded-xl glass border border-white/5 space-y-3">
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Origem do Avatar (VRM)</div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={vrmPath} 
                  readOnly
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/60 focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap"
                />
                <input 
                  type="file" 
                  accept=".vrm" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-mono uppercase hover:bg-neon-blue/20 transition-colors"
                >
                  Procurar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry & Logging */}
        <div className="glass rounded-3xl border border-white/5 p-8">
          <SectionHeader icon={Activity} title="Motor de Telemetria" subtitle="Configuração do Fluxo de Dados" />
          <div className="space-y-4">
            <SettingToggle 
              label="Logs Detalhados" 
              description="Registrar todas as operações de tensores" 
              active={verboseLogs} 
              onClick={() => setVerboseLogs(!verboseLogs)} 
            />
            <SettingToggle 
              label="Isolamento de Rede" 
              description="Bloquear todas as chamadas de API externas" 
              active={networkIsolation} 
              onClick={() => setNetworkIsolation(!networkIsolation)} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
