/**
 * INFRAESTRUTURA DE PERSISTÊNCIA EM NUVEM - FIREBASE SERVICE (BACKEND)
 * Este módulo gerencia a conexão da Vaelindra com os serviços de banco de dados e autenticação da Google.
 * Ele provê uma camada de abstração para armazenamento persistente de configurações e memórias neurais.
 * As principais funcionalidades centralizadas nesta infraestrutura são:
 * 1. Inicialização do Firebase App utilizando a configuração soberana definida no projeto.
 * 2. Gerenciamento de Autenticação via Google Auth, permitindo que usuários sincronizem sua IA entre dispositivos.
 * 3. Acesso ao Firestore Database para armazenamento NoSQL de alta performance e baixa latência.
 * 4. Implementação de Teste de Conexão (Sanity Check) para garantir que o backend esteja acessível no boot.
 * 5. Sistema Rigoroso de Tratamento de Erros: Converte falhas de permissão em objetos JSON detalhados para depuração.
 * 6. Exportação de Primitivas do Firestore: Facilita a execução de queries, snapshots e atualizações de documentos.
 * 7. Suporte a Multi-Instância: Utiliza o databaseId dinâmico para isolamento de ambientes de desenvolvimento e produção.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { signInWithPopup, signOut, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where };
