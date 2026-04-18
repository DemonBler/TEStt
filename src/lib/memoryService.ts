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
