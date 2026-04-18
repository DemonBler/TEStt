import OBSWebSocket from 'obs-websocket-js';
import { useSovereignStore } from '../store';

const obs = new OBSWebSocket();

export const connectOBS = async (url: string = 'ws://127.0.0.1:4455', password?: string) => {
  try {
    const {
      obsWebSocketVersion,
      negotiatedRpcVersion
    } = await obs.connect(url, password, {
      rpcVersion: 1
    });
    console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`);
    useSovereignStore.getState().setObsConfig({ isObsConnected: true });
  } catch (error) {
    console.error('Failed to connect', error);
    useSovereignStore.getState().setObsConfig({ isObsConnected: false });
  }
};

export const disconnectOBS = async () => {
    try {
        await obs.disconnect();
        useSovereignStore.getState().setObsConfig({ isObsConnected: false });
    } catch(e) {
        console.error("OBS Disconnect Error:", e);
    }
}

export const changeOBSScene = async (sceneName: string) => {
    try {
        console.log(`[Neural] Mudando cena do OBS para: ${sceneName}`);
        await obs.call('SetCurrentProgramScene', { sceneName });
    } catch (e) {
        console.error("Failed to change scene", e);
    }
};

export const toggleOBSItem = async (sceneName: string, sourceName: string, enabled: boolean) => {
    try {
        const { sceneItemId } = await obs.call('GetSceneItemId', { sceneName, sourceName });
        await obs.call('SetSceneItemEnabled', {
            sceneName,
            sceneItemId,
            sceneItemEnabled: enabled
        });
    } catch(e) {
        console.error("Failed to toggle OBS Item", e);
    }
}
