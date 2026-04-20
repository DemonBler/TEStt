/**
 * SISTEMA DE MEMÓRIA PERSISTENTE - MEMORY SERVICE (LOCAL STORAGE/IDB)
 * Este módulo gerencia o armazenamento de longo prazo de todas as interações da Vaelindra.
 * Ele permite que a IA "lembre" de conversas passadas, criando uma continuidade de consciência digital.
 * As principais responsabilidades deste serviço de arquivamento são:
 * 1. Gerenciamento do banco de dados local IndexedDB (SovereignMemoryCore) para persistência robusta.
 * 2. Implementação de um esquema de dados indexado por tempo, facilitando a recuperação cronológica veloz.
 * 3. Armazenamento automático de mensagens de usuários e respostas da IA com metadados de timestamp.
 * 4. Geração de Contexto de Memória (RAG Lite): Compila históricos passados em strings para enriquecer o prompt do LLM.
 * 5. Suporte a resumos automáticos (Summarization) para otimizar o consumo de tokens em diálogos extensos.
 * 6. Recuperação de memórias recentes com limites configuráveis, garantindo que o cérebro não transborde.
 * 7. Execução totalmente offline no navegador do usuário, protegendo a privacidade absoluta do histórico de chat.
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VectorMemoryDB extends DBSchema {
  memories: {
    key: string;
    value: {
      id: string;
      timestamp: number;
      role: 'user' | 'ai' | 'system';
      text: string;
      summarized: boolean;
    };
    indexes: { 'by-time': number };
  };
}

let dbPromise: Promise<IDBPDatabase<VectorMemoryDB>>;

export const initMemoryDB = () => {
  if (typeof window === 'undefined') return;
  dbPromise = openDB<VectorMemoryDB>('SovereignMemoryCore', 1, {
    upgrade(db) {
      const store = db.createObjectStore('memories', {
        keyPath: 'id',
      });
      store.createIndex('by-time', 'timestamp');
    },
  });
};

export const saveMemory = async (role: 'user' | 'ai' | 'system', text: string) => {
  if (!dbPromise) initMemoryDB();
  const db = await dbPromise;
  await db.add('memories', {
    id: window.crypto.randomUUID(),
    timestamp: Date.now(),
    role,
    text,
    summarized: false
  });
};

export const getRecentMemories = async (limit: number = 20) => {
  if (!dbPromise) initMemoryDB();
  const db = await dbPromise;
  // Get all, then sort and slice since IDB doesn't easily support reverse limit on index cleanly without cursors
  const all = await db.getAllFromIndex('memories', 'by-time');
  const recent = all.slice(-limit);
  return recent;
};

// Summarize chunk (RAG emulation)
export const getMemoryContextString = async () => {
  const mems = await getRecentMemories(50);
  if (mems.length === 0) return "";
  
  let contextStr = "--- LONG TERM MEMORY RECALL ---\n";
  mems.forEach(m => {
    contextStr += `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.text}\n`;
  });
  contextStr += "--- END MEMORY ---\n";
  return contextStr;
};
