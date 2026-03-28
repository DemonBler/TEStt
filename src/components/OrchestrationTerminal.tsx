import React, { useState, useEffect, useRef } from 'react';
import { TerminalSquare, Trash2, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export const OrchestrationTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  // Expose a global function to add logs so other components can use it
  useEffect(() => {
    (window as any).addOmniLog = (level: LogEntry['level'], message: string) => {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          level,
          message,
        },
      ]);
    };

    // Initial boot logs
    (window as any).addOmniLog('info', 'Iniciando Omni-Genesis v6.3...');
    (window as any).addOmniLog('info', 'Verificando hardware local...');
    (window as any).addOmniLog('warn', 'Aguardando conexão com Ollama (localhost:11434)...');
    (window as any).addOmniLog('warn', 'Aguardando conexão com NVIDIA ACE (localhost:50051)...');

    return () => {
      delete (window as any).addOmniLog;
    };
  }, []);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-cyan-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full h-64 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 p-2">
        <h3 className="text-xs font-mono text-cyan-400 flex items-center gap-2">
          <TerminalSquare size={14} />
          TERMINAL DE ORQUESTRAÇÃO
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={clearLogs} className="text-slate-500 hover:text-red-400 transition-colors" title="Limpar Logs">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] sm:text-xs space-y-1 custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start">
            <span className="text-slate-600 shrink-0">
              [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span className={`${getLogColor(log.level)} break-words`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endOfLogsRef} />
      </div>
    </div>
  );
};
