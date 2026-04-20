/**
 * INTERCEPTOR DE CHAT SOCIAL - TWITCH LISTENER (SOCIAL CONNECT)
 * Este módulo provê o canal de entrada para interações vindas da plataforma Twitch.
 * Ele permite que a Vaelindra "escute" e responda à sua audiência de forma automatizada e inteligente.
 * As principais responsabilidades deste serviço de escuta são:
 * 1. Inicialização do cliente TMI.js para conexão estável via IRC com os servidores de chat da Twitch.
 * 2. Gerenciamento de múltiplos canais: Suporta a escuta de mensagens em canais específicos definidos pelo usuário.
 * 3. Filtragem de Mensagens: Identifica e ignora mensagens enviadas pela própria IA para evitar loops infinitos.
 * 4. Extração de Metadados: Captura o nome de exibição do usuário e o conteúdo da mensagem para processamento neural.
 * 5. Sistema de Callbacks Reativos: Encaminha as mensagens recebidas para a fila de processamento do QuimeraCore.
 * 6. Gerenciamento de Ciclo de Vida: Permite conectar e desconectar dinamicamente através do Kernel da aplicação.
 * 7. Sincronia de Status: Atualiza o estado global (Zustand) para informar à UI se a comunicação social está ativa.
 */
import tmi from 'tmi.js';
import { useSovereignStore } from '../store';

let twitchClient: tmi.Client | null = null;
let twitchListenerCallback: ((user: string, message: string) => void) | null = null;

export const connectTwitch = async (channel: string, onMessage: (user: string, message: string) => void) => {
  if (twitchClient) {
    await twitchClient.disconnect();
  }

  twitchListenerCallback = onMessage;

  twitchClient = new tmi.Client({
    channels: [channel]
  });

  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (twitchListenerCallback) {
       twitchListenerCallback(tags['display-name'] || 'Usuario', message);
    }
  });

  try {
    await twitchClient.connect();
    useSovereignStore.getState().setIsTwitchConnected(true);
    console.log(`[Neural] Sincronizado ao chat da Twitch: ${channel}`);
  } catch (err) {
    console.error("Twitch Connection Error:", err);
    useSovereignStore.getState().setIsTwitchConnected(false);
  }
};

export const disconnectTwitch = async () => {
  if (twitchClient) {
    await twitchClient.disconnect();
    twitchClient = null;
    useSovereignStore.getState().setIsTwitchConnected(false);
    console.log(`[Neural] Desconectado da Twitch.`);
  }
};
