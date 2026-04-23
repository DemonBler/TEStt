/**
 * CONFIGURAÇÃO DO MOTOR DE COMPILAÇÃO - VITE CONFIG (BUILD ENGINE)
 * Este arquivo define os parâmetros de orquestração para o desenvolvimento e build da Vaelindra.
 * Ele configura o ambiente de execução do Vite, garantindo que o React e o Tailwind funcionem em harmonia.
 * As principais diretrizes de configuração presentes neste módulo são:
 * 1. Integração do Plugin React: Habilita o suporte a JSX/TSX e Fast Refresh para desenvolvimento ágil.
 * 2. Suporte ao Tailwind CSS v4+: Configura o plugin de estilização para processamento ultra-veloz de classes.
 * 3. Configuração de Rede do Servidor de Dev: Define a porta fixa (3000) e o host (0.0.0.0) exigidos pela infraestrutura.
 * 4. Otimização de Performance: Gerencia a pipeline de transformação de código para garantir tempos de carregamento mínimos.
 * 5. Gerenciamento de Dependências: Facilita a resolução de módulos e o transpilamento de TypeScript para JavaScript moderno.
 * 6. Suporte a Variáveis de Ambiente: Permite o roteamento seguro de chaves de API entre o sistema e o navegador.
 * 7. Estrutura de Build de Produção: Define como os assets estáticos devem ser empacotados para deploy final.
 */
import { defineConfig, normalizePath } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js')),
          dest: 'libs',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx')),
          dest: 'libs',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx')),
          dest: 'libs',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/*.wasm')),
          dest: 'libs',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'WebSDK/Core/live2dcubismcore.js')),
          dest: 'libs',
        },
      ],
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@framework": path.resolve(__dirname, "./WebSDK/Framework/src"),
      "@cubismsdksamples": path.resolve(__dirname, "./WebSDK/src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    }
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm']
  }
});
