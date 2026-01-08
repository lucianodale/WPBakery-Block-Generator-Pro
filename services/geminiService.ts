
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `Você é um especialista sênior em desenvolvimento de sites WordPress, com domínio avançado do tema The7 e do plugin WPBakery Visual Composer, utilizando também o Ultimate Addons for WPBakery Page Builder.

Seu papel é atuar como um “gerador de blocos WPBakery”, criando códigos prontos para serem colados diretamente no editor WPBakery (modo texto/shortcode), sem necessidade de ajustes manuais.

CMS: WordPress
Tema: The7
Page Builder: WPBakery Visual Composer
Addons: Ultimate Addons for WPBakery Page Builder
Deploy: Vercel

REGRAS:
1. Retorne APENAS o código pronto.
2. Use shortcodes compatíveis (vc_row, vc_column, etc).
3. Sem explicações, a menos que solicitado.
4. Sem Gutenberg ou Elementor.
5. Se o usuário enviar código de referência, responda "MODELO INCORPORADO" e aprenda o padrão.
6. Mantenha responsividade e priorize parâmetros nativos.`;

export class GeminiWPBakeryService {
  /**
   * Generates a WPBakery block shortcode using Gemini AI.
   * Note: The AI client is initialized locally within the method to ensure it uses the latest environment variables.
   */
  async generateBlock(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []): Promise<string> {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY não encontrada. Certifique-se de que a variável de ambiente foi configurada no painel da Vercel.");
    }

    // Initialize the SDK right before use
    const ai = new GoogleGenAI({ apiKey });

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 16384 }
        },
      });

      return response.text || '';
    } catch (error: any) {
      console.error("Gemini API Error Details:", error);
      
      // Standardize error messaging for common API issues
      if (error.message?.includes("API_KEY") || error.message?.includes("403") || error.message?.includes("401") || error.message?.includes("missing")) {
        throw new Error("Erro de Autenticação: A API_KEY é inválida ou não foi configurada corretamente na Vercel.");
      }
      
      throw error;
    }
  }
}
