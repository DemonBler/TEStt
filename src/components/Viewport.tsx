/**
 * JANELA DE OBSERVAÇÃO NEURAL - VIEWPORT (COMPONENT)
 * Este componente atua como o palco principal de visualização da entidade digital Vaelindra dentro da interface.
 * Sua função é servir de invólucro (wrapper) de alta fidelidade para o sistema de renderização 3D do avatar VRM.
 * Através deste componente, as seguintes operações são centralizadas e garantidas:
 * 1. Definição da área de visualização absoluta para o avatar, garantindo preenchimento total do container pai.
 * 2. Aplicação de camadas de fundo condicionais, permitindo a visibilidade do fundo semi-transparente do painel.
 * 3. Isolamento da camada de renderização WebGL para prevenir conflitos de estilo CSS com a interface de chat.
 * 4. Ponto de montagem para overlays de status visual que aparecem sobre o modelo 3D durante carregamentos.
 * 5. Gerenciamento do posicionamento relativo que permite a flutuação de elementos de UI sobre a cabeça da personagem.
 */
import React from 'react';
import { VRMViewer } from './VRMViewer';

export const Viewport = () => {
  return (
    <div className="h-full w-full bg-black/40 relative">
      <VRMViewer />
    </div>
  );
};
