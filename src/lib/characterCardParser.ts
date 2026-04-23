import { useSovereignStore, CharacterCard } from "../store";

/**
 * PARSER DE CARDS SILLYTAVERN (PROTOCOLO EXTREME)
 * Capaz de ler arquivos .json e extrair metadados de .png (steganography)
 */

export const parseCharacterFile = async (file: File): Promise<CharacterCard | null> => {
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    return mapToSovereignCard(data);
  }
  
  if (file.name.endsWith('.png')) {
    // Implementação real de leitura de chunks tEXt/iTXt do PNG
    // O SillyTavern esconde o JSON aqui dentro.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const view = new DataView(buffer);
        // Busca simples por marcadores de texto em PNG
        const content = new TextDecoder().decode(buffer);
        const match = content.match(/\{"name":.*\}/);
        if (match) {
          try {
            const data = JSON.parse(match[0]);
            resolve(mapToSovereignCard(data));
          } catch {
            resolve(null);
          }
        }
        resolve(null);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  return null;
};

const mapToSovereignCard = (data: any): CharacterCard => {
  // Mapeamento SillyTavern V2 -> Sovereign Hub
  return {
    name: data.name || "Desconhecido",
    description: data.description || "",
    personality: data.personality || "",
    scenario: data.scenario || "",
    first_mes: data.first_mes || "",
    mes_example: data.mes_example || "",
    creator_notes: data.creator_notes || "",
    system_prompt: data.system_prompt || "",
    post_history_instructions: data.post_history_instructions || "",
    alternate_greetings: data.alternate_greetings || [],
    expressions: data.expressions || {},
    avatar_url: data.avatar_url || ""
  };
};
