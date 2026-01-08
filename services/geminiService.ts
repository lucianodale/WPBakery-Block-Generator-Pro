
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
  private ai: GoogleGenAI;

  constructor() {
    // A API_KEY deve vir exclusivamente de process.env.API_KEY
    if (!process.env.API_KEY) {
      console.error("WPBakery Pro Error: API_KEY não encontrada nas variáveis de ambiente. Verifique as configurações na Vercel.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateBlock(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
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
      
      // Tratamento específico para erro de cota ou chave inválida
      if (error.message?.includes("API_KEY") || error.message?.includes("403") || error.message?.includes("401")) {
        throw new Error("Erro de Autenticação: A API_KEY é inválida ou não foi configurada corretamente na Vercel.");
      }
      
      throw error;
    }
  }
}
