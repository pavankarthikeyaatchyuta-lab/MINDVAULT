import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/lib/secrets/secret-manager';

let genAIInstance: GoogleGenAI | null = null;
let lastApiKey: string | null = null;

/**
 * Returns a configured GoogleGenAI SDK instance.
 * Automatically fetches the API key from Secret Manager or environment.
 */
export async function getGeminiClient(): Promise<GoogleGenAI> {
  const apiKey = await getGeminiApiKey();

  if (!genAIInstance || lastApiKey !== apiKey) {
    genAIInstance = new GoogleGenAI({ apiKey });
    lastApiKey = apiKey;
  }

  return genAIInstance;
}

/**
 * Default Gemini model used across MindVault services.
 * Uses lightweight/fast Gemini 2.5 Flash for cost-effective, high-speed summarization & extraction.
 */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
