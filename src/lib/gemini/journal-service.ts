import { getGeminiClient, DEFAULT_GEMINI_MODEL } from '@/lib/gemini/client';
import {
  MINDVAULT_JOURNAL_SYSTEM_PROMPT,
  MINDVAULT_TITLE_SYSTEM_PROMPT,
  MINDVAULT_SUMMARY_SYSTEM_PROMPT,
  MINDVAULT_MEMORY_EXTRACTION_SYSTEM_PROMPT,
} from '@/lib/gemini/system-prompt';
import {
  JournalTitleOutputSchema,
  JournalSummaryOutputSchema,
  ExtractedMemoriesOutputSchema,
  ExtractedMemoryItemSchema,
} from '@/lib/validation/schemas';
import { JournalMessage, MemoryItem } from '@/types';
import { logger } from '@/lib/observability/logger';
import { z } from 'zod';

/**
 * Strips markdown code fence blocks if the model outputs ```json ... ```
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Formats multi-turn journal messages into safe delimited user journal data for Gemini.
 */
function formatMessagesAsData(messages: JournalMessage[]): string {
  const formatted = messages
    .map((m) => `[${m.role === 'user' ? 'USER' : 'JOURNAL_COMPANION'}]: ${m.content}`)
    .join('\n\n');

  return `<user_journal_entry>\n${formatted}\n</user_journal_entry>`;
}

/**
 * 1. Generates a thoughtful, reflective next turn in a multi-turn journal conversation.
 */
export async function generateReflectiveResponse(messages: JournalMessage[]): Promise<string> {
  try {
    const ai = await getGeminiClient();
    const delimitedContent = formatMessagesAsData(messages);

    const promptText = `The following is the active journal conversation. Please provide a concise, reflective, empathetic response or a thoughtful follow-up question to help the user explore their thoughts:\n\n${delimitedContent}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction: MINDVAULT_JOURNAL_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 350,
      },
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      return "I hear you. What aspects of this are feeling most significant to you right now?";
    }

    return outputText;
  } catch (error: any) {
    logger.error('Failed to generate reflective response from Gemini', {
      service: 'GeminiService',
      action: 'generateReflectiveResponse',
      errorCode: error?.code || 'UNKNOWN',
    });
    throw new Error('MindVault could not reach the reflection engine right now. Your writing is safe.');
  }
}

/**
 * 2. Generates an evocative short title for a journal session with fallback.
 */
export async function generateJournalTitle(messages: JournalMessage[]): Promise<string> {
  const fallbackTitle = `Journal — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  if (!messages || messages.length === 0) {
    return fallbackTitle;
  }

  try {
    const ai = await getGeminiClient();
    const delimitedContent = formatMessagesAsData(messages);

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Generate a concise 2-6 word title for this journal session:\n\n${delimitedContent}`,
      config: {
        systemInstruction: MINDVAULT_TITLE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 100,
      },
    });

    const rawJson = cleanJsonText(response.text || '{}');
    const parsed = JSON.parse(rawJson);
    const validated = JournalTitleOutputSchema.parse(parsed);

    return validated.title.trim() || fallbackTitle;
  } catch (err) {
    logger.warn('Title generation failed or returned invalid schema; using deterministic fallback', {
      service: 'GeminiService',
      action: 'generateJournalTitle',
    });
    return fallbackTitle;
  }
}

/**
 * 3. Generates an objective summary and key topics for a journal entry.
 */
export async function generateJournalSummary(
  messages: JournalMessage[]
): Promise<{ summary: string; topics: string[] }> {
  try {
    const ai = await getGeminiClient();
    const delimitedContent = formatMessagesAsData(messages);

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Summarize this journal session and extract key topics:\n\n${delimitedContent}`,
      config: {
        systemInstruction: MINDVAULT_SUMMARY_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 300,
      },
    });

    const rawJson = cleanJsonText(response.text || '{}');
    const parsed = JSON.parse(rawJson);
    const validated = JournalSummaryOutputSchema.parse(parsed);

    return validated;
  } catch (err: any) {
    logger.warn('Summary generation failed or returned invalid schema', {
      service: 'GeminiService',
      action: 'generateJournalSummary',
      errorCode: err?.message,
    });
    // Fallback: extract first message preview as basic summary
    const userMsg = messages.find((m) => m.role === 'user')?.content || 'Journal entry';
    return {
      summary: userMsg.length > 150 ? `${userMsg.slice(0, 150)}...` : userMsg,
      topics: ['Journal'],
    };
  }
}

/**
 * 4. Extracts structured memories from a journal entry and validates against strict schema.
 */
export async function extractMemoriesFromJournal(
  sourceJournalId: string,
  messages: JournalMessage[],
  sourceDate: string
): Promise<z.infer<typeof ExtractedMemoryItemSchema>[]> {
  try {
    const ai = await getGeminiClient();
    const delimitedContent = formatMessagesAsData(messages);

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: `Extract meaningful memories from this journal entry into valid structured JSON conforming to the schema:\n\n${delimitedContent}`,
      config: {
        systemInstruction: MINDVAULT_MEMORY_EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 800,
      },
    });

    const rawJson = cleanJsonText(response.text || '{"memories":[]}');
    const parsed = JSON.parse(rawJson);
    const validated = ExtractedMemoriesOutputSchema.parse(parsed);

    return validated.memories;
  } catch (err: any) {
    logger.warn('Memory extraction failed or returned invalid schema', {
      service: 'GeminiService',
      action: 'extractMemoriesFromJournal',
      errorCode: err?.message,
    });
    return [];
  }
}
