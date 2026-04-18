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
