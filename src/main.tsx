/**
 * PONTO DE ENTRADA DO NAVEGADOR - MAIN ENTRY POINT (BOOTSTRAP)
 * Este é o estágio zero da aplicação, onde o React é injetado no DOM (Document Object Model).
 * Ele serve como o gatilho inicial que desperta toda a infraestrutura da Vaelindra.
 * As responsabilidades críticas deste módulo de inicialização são:
 * 1. Estabelecer a ponte entre o template HTML estático e a aplicação reativa TypeScript.
 * 2. Criar a raiz de renderização (Root) utilizando a API concurrent do React 18.
 * 3. Injetar os estilos globais da aplicação (Tailwind CSS e variações de Neon) via import direto.
 * 4. Envelopar a aplicação no React.StrictMode para garantir a identificação precoce de bugs de ciclo de vida.
 * 5. Servir como o local primordial para injeção de provedores globais, caso necessário no futuro.
 * 6. Garantir que o componente App seja montado no elemento 'root', o receptáculo principal da interface.
 * 7. Orquestrar o carregamento inicial dos assets básicos antes da execução da lógica do Kernel.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
