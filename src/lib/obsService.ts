/**
 * CONTROLADOR DE STREAMING - OBS SERVICE (REMOTE CONTROL)
 * Este módulo habilita a Vaelindra a interagir diretamente com o software de transmissão OBS Studio.
 * Ele transforma a IA em uma "Operadora de Transmissão" capaz de manipular a live através do protocolo WebSocket.
 * As principais funcionalidades de integração presentes neste serviço são:
 * 1. Inicialização de conexão segura com o plugin OBS-WebSocket v5.0+, suportando autenticação por senha.
 * 2. Gerenciamento de estado de conexão no Store, permitindo que a interface visualize o status do link.
 * 3. Troca Dinâmica de Cenas: Permite que a IA mude o layout da transmissão baseada no contexto do chat (ex: modo jogo).
 * 4. Manipulação de Visibilidade de Fontes: Ativa ou desativa elementos específicos (overlays, alertas, câmeras) via código.
 * 5. Automatização de Stream: Oferece as primitivas necessárias para que a IA possa "reagir" visualmente alterando o cenário.
 * 6. Tratamento de Erros de Rede: Garante que falhas de conexão com o OBS não causem instabilidade no cérebro da VTuber.
 * 7. Suporte a Scripts Neurais: Permite que comandos [ACTION:SCENE_X] sejam traduzidos em mudanças reais na live do usuário.
 */
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
