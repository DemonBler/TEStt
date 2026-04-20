/**
 * DEFINIÇÕES DE AMBIENTE VITE - GLOBAL TYPE DEFINITIONS (VITE-ENV.D.TS)
 * Este arquivo provê as tipagens globais e extensões de módulo necessárias para o ecossistema Vite.
 * Ele garante que o TypeScript reconheça tipos específicos de assets e variáveis de ambiente.
 * As principais funcionalidades desta camada de tipagem são:
 * 1. Inclusão das referências de tipo do cliente Vite (vite/client), permitindo o uso de import.meta.env.
 * 2. Declaração de suporte a módulos JSON, permitindo a importação direta de arquivos de configuração em TypeScript.
 * 3. Garantia de que arquivos estáticos (imagens, vídeos, shaders) sejam reconhecidos como módulos válidos.
 * 4. Extensão das interfaces globais para acesso a variáveis injetadas em tempo de compilação.
 * 5. Prevenção de erros de compilação relacionados ao carregamento dinâmico de recursos não-TS.
 * 6. Suporte à inteligência de código (IntelliSense) para caminhos de assets e parâmetros de configuração do Vite.
 * 7. Manutenção de um ambiente de desenvolvimento tipado e seguro para todos os módulos que utilizam recursos do navegador.
 */
/// <reference types="vite/client" />

declare module "*.json" {
  const value: any;
  export default value;
}
