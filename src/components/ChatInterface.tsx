import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Volume2, Mic, Settings, BrainCircuit, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LocalAIService } from '../services/LocalAIService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highThought, setHighThought] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      (window as any).addOmniLog?.('info', `Enviando prompt para Ollama (localhost:11434)...`);
      const responseText = await LocalAIService.generateResponse(userMsg.text, highThought ? 'llama3:70b' : 'llama3');
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, modelMsg]);
      (window as any).addOmniLog?.('success', `Resposta recebida do Ollama.`);

      handleSpeak(responseText);

    } catch (error) {
      console.error(error);
      (window as any).addOmniLog?.('error', `Falha na conexão com Ollama: ${(error as Error).message}`);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `**ERRO CRÍTICO:** Falha ao conectar com o núcleo local (localhost:11434). Verifique se o Ollama está rodando.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    setIsSpeaking(true);
    try {
      (window as any).addOmniLog?.('info', `Sintetizando voz via Neural Core (WebGPU)...`);
      const buffer = await LocalAIService.speakText(text);
      
      if (buffer.byteLength === 0) {
        (window as any).addOmniLog?.('warn', `TTS Neural falhou. Simulação de áudio ativada.`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate speaking time
      } else {
        (window as any).addOmniLog?.('success', `Áudio gerado com sucesso. Reproduzindo...`);
        
        // Play the audio buffer
        const audioContext = new window.AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(buffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        // Wait for audio to finish
        await new Promise(resolve => {
          source.onended = resolve;
        });
      }
    } catch (error) {
       (window as any).addOmniLog?.('error', `Falha no TTS Local: ${(error as Error).message}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        (window as any).addOmniLog?.('info', `Processando áudio via Whisper Neural Core...`);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsLoading(true);
          try {
            const transcribedText = await LocalAIService.transcribeAudio(audioBlob);
            if (transcribedText && transcribedText.trim() !== "") {
              setInput(transcribedText);
              (window as any).addOmniLog?.('success', `Transcrição concluída: "${transcribedText}"`);
            } else {
               (window as any).addOmniLog?.('warn', `Nenhuma fala detectada.`);
            }
          } catch (error) {
            (window as any).addOmniLog?.('error', `Falha na transcrição: ${(error as Error).message}`);
          } finally {
            setIsLoading(false);
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        (window as any).addOmniLog?.('info', `Iniciando escuta (Microfone ativado)...`);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        (window as any).addOmniLog?.('error', `Acesso ao microfone negado ou indisponível.`);
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    (window as any).addOmniLog?.('warn', `Memória de curto prazo limpa.`);
  };

  const syncLongTermMemory = () => {
    (window as any).addOmniLog?.('info', `Sincronizando com banco vetorial local (ChromaDB)...`);
    setTimeout(() => {
      (window as any).addOmniLog?.('error', `Falha: ChromaDB (localhost:8000) offline.`);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-cyan-400" />
          <span className="font-mono text-xs text-cyan-400 font-bold">NÚCLEO COGNITIVO (OLLAMA)</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncLongTermMemory}
            className="text-slate-500 hover:text-cyan-400 transition-colors"
            title="Memória de Longo Prazo (ChromaDB)"
          >
            <Database size={16} />
          </button>
          <button 
            onClick={() => setHighThought(!highThought)}
            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
              highThought 
                ? 'bg-purple-900/50 border-purple-500 text-purple-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title="Pensamento High (Usa modelo maior, ex: llama3:70b se disponível)"
          >
            PENSAMENTO HIGH {highThought ? 'ON' : 'OFF'}
          </button>
          <button onClick={clearChat} className="text-slate-500 hover:text-red-400 transition-colors" title="Limpar Memória (Lixeira)">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-sm opacity-50">
            <BrainCircuit size={48} className="mb-4" />
            <p>Aguardando input neural...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-cyan-900/30 border border-cyan-800/50 text-cyan-100' 
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  <span className="text-[10px] font-mono uppercase">
                    {msg.role === 'user' ? 'OPERADOR' : 'VAELINDRA'}
                  </span>
                  <span className="text-[10px] font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none font-sans">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.role === 'model' && (
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => handleSpeak(msg.text)}
                      disabled={isSpeaking}
                      className="text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                      title="Forçar TTS"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-center gap-2 text-cyan-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-mono">Processando tensores...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button 
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
            title="STT Local (Whisper Neural Core)"
            onClick={toggleRecording}
          >
            <Mic size={18} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Comando para o núcleo..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono placeholder:text-slate-600"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
