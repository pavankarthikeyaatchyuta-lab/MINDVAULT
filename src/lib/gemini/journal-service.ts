import { getGeminiClient, DEFAULT_GEMINI_MODEL } from '@/lib/gemini/client';
import {
  MINDVAULT_JOURNAL_SYSTEM_PROMPT,
  MINDVAULT_TITLE_SYSTEM_PROMPT,
  MINDVAULT_SUMMARY_SYSTEM_PROMPT,
  MINDVAULT_MEMORY_EXTRACTION_SYSTEM_PROMPT,
  MINDVAULT_ASK_SYSTEM_PROMPT,
  MINDVAULT_REWIND_SYSTEM_PROMPT,
  MINDVAULT_INSIGHTS_SYSTEM_PROMPT,
} from '@/lib/gemini/system-prompt';
import {
  JournalTitleOutputSchema,
  JournalSummaryOutputSchema,
  ExtractedMemoriesOutputSchema,
  ExtractedMemoryItemSchema,
  AskJournalOutputSchema,
  RewindOutputSchema,
  InsightsOutputSchema,
} from '@/lib/validation/schemas';
import { JournalMessage, MemoryItem, EvidenceItem, AskJournalResult, JournalEntry, InsightsReport } from '@/types';
import { logger } from '@/lib/observability/logger';
import { z } from 'zod';

/**
 * Robustly cleans and extracts valid JSON string from Gemini response.
 * Handles markdown fences, preamble text, and trailing whitespace.
 */
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    cleaned = match[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return cleaned.slice(startIdx, endIdx + 1);
  }
  return cleaned;
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
 * Executes a Gemini API call with transparent retry for transient network hiccups, 503 capacity limits, or 429 rate limits.
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (err?.status === 400 || err?.message?.includes('INVALID_ARGUMENT')) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * 1. Generates a thoughtful, reflective next turn in a multi-turn journal conversation.
 */
export async function generateReflectiveResponse(messages: JournalMessage[]): Promise<string> {
  try {
    const ai = await getGeminiClient();
    const delimitedContent = formatMessagesAsData(messages);

    const promptText = `The following is the active journal conversation. Please provide a concise, reflective, empathetic response or a thoughtful follow-up question to help the user explore their thoughts:\n\n${delimitedContent}`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction: MINDVAULT_JOURNAL_SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      })
    );

    const outputText = response.text?.trim();
    if (!outputText) {
      return "I hear you. What aspects of this are feeling most significant to you right now?";
    }

    return outputText;
  } catch (error: any) {
    console.error('*** GEMINI generateReflectiveResponse RAW ERROR ***:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      code: error?.code,
      stack: error?.stack,
      raw: error,
    });
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
        maxOutputTokens: 1024,
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
        maxOutputTokens: 2048,
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
        maxOutputTokens: 4096,
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

/**
 * 5. Synthesizes an answer to a natural-language question using ONLY retrieved evidence.
 * Strict source validation ensures hallucinated source IDs are rejected.
 */
export async function askMyJournal(
  question: string,
  evidence: EvidenceItem[]
): Promise<AskJournalResult> {
  // If no evidence retrieved, return immediately without invoking Gemini
  if (!evidence || evidence.length === 0) {
    return {
      answer: "I couldn't find enough information in your journal to answer that confidently.",
      confidence: 'low',
      sources: [],
    };
  }

  try {
    const ai = await getGeminiClient();

    const formattedEvidence = evidence
      .map(
        (e) =>
          `[SOURCE_ID: ${e.sourceId}] TYPE: ${e.sourceType} | DATE: ${e.date} | TITLE: ${e.title}\nCONTENT: ${e.content}`
      )
      .join('\n\n---\n\n');

    const promptText = `QUESTION:\n"${question}"\n\n<verified_journal_evidence>\n${formattedEvidence}\n</verified_journal_evidence>\n\nAnswer the question concisely and cite exact matching sourceIds from the evidence.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction: MINDVAULT_ASK_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const rawJson = cleanJsonText(response.text || '{}');
    const parsed = JSON.parse(rawJson);
    const validated = AskJournalOutputSchema.parse(parsed);

    // CRITICAL SECURITY ENFORCEMENT: Source Validation
    // Discard any sourceId not genuinely present in the user-owned retrieved evidence
    const verifiedSources = validated.sources
      .map((s) => {
        const matchingEvidence = evidence.find((e) => e.sourceId === s.sourceId);
        if (!matchingEvidence) return null;
        return {
          sourceType: matchingEvidence.sourceType,
          sourceId: matchingEvidence.sourceId,
          title: matchingEvidence.title,
          date: matchingEvidence.date,
          excerpt: s.excerpt || matchingEvidence.content.slice(0, 150),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      answer: validated.answer,
      confidence: validated.confidence,
      sources: verifiedSources,
    };
  } catch (err: any) {
    logger.warn('Ask My Journal synthesis failed or returned invalid schema', {
      service: 'GeminiService',
      action: 'askMyJournal',
      errorCode: err?.message,
    });
    return {
      answer: "I couldn't find enough information in your journal to answer that confidently right now.",
      confidence: 'low',
      sources: [],
    };
  }
}

/**
 * 6. Synthesizes a grounded retrospective for Journal Rewind from verified stats and records.
 */
export async function synthesizeRewind(
  periodLabel: string,
  stats: { journalCount: number; activeDays: number; topTopics: string[] },
  evidenceJournals: JournalEntry[],
  evidenceMemories: MemoryItem[]
): Promise<z.infer<typeof RewindOutputSchema>> {
  const fallbackOutput = {
    highlights: [],
    recurringThemes: stats.topTopics.map((t) => ({
      theme: t,
      description: `Discussions relating to ${t} occurred frequently.`,
      sourceJournalIds: evidenceJournals.slice(0, 2).map((j) => j.id),
    })),
    goals: [],
    reflection: `During this ${periodLabel} period, you recorded ${stats.journalCount} journal entries across ${stats.activeDays} active days, reflecting most frequently on ${stats.topTopics.join(', ') || 'personal thoughts'}.`,
    oneMomentToRemember: evidenceJournals[0]
      ? {
          title: evidenceJournals[0].title || 'A Notable Journal Entry',
          description: evidenceJournals[0].summary || 'An important reflection recorded during this period.',
          sourceJournalId: evidenceJournals[0].id,
        }
      : null,
  };

  if (evidenceJournals.length === 0) {
    return fallbackOutput;
  }

  try {
    const ai = await getGeminiClient();

    const formattedStats = `PERIOD: ${periodLabel}\nTOTAL_ENTRIES: ${stats.journalCount}\nACTIVE_DAYS: ${stats.activeDays}\nTOP_TOPICS: ${stats.topTopics.join(', ')}`;

    const formattedJournals = evidenceJournals
      .slice(0, 15)
      .map(
        (j) =>
          `[JOURNAL_ID: ${j.id}] DATE: ${j.createdAt} | TITLE: ${j.title}\nSUMMARY: ${j.summary || j.content.slice(0, 200)}`
      )
      .join('\n\n');

    const formattedMemories = evidenceMemories
      .slice(0, 15)
      .map(
        (m) =>
          `[MEMORY_ID: ${m.id}] CATEGORY: ${m.category} | TITLE: ${m.title} | DATE: ${m.sourceDate || m.createdAt}\nDESC: ${m.description} | SOURCE_JOURNAL: ${m.sourceJournalId}`
      )
      .join('\n\n');

    const promptText = `STATISTICS:\n${formattedStats}\n\n<verified_rewind_evidence>\nJOURNALS:\n${formattedJournals}\n\nMEMORIES:\n${formattedMemories}\n</verified_rewind_evidence>\n\nSynthesize a grounded, inspiring retrospective in JSON conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction: MINDVAULT_REWIND_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const rawJson = cleanJsonText(response.text || '{}');
    const parsed = JSON.parse(rawJson);
    const validated = RewindOutputSchema.parse(parsed);

    // CRITICAL SECURITY ENFORCEMENT: Validate source journal IDs against evidence
    const validJournalIds = new Set(evidenceJournals.map((j) => j.id));

    const validatedHighlights = validated.highlights.filter((h) =>
      validJournalIds.has(h.sourceJournalId)
    );

    const validatedThemes = validated.recurringThemes.map((t) => ({
      ...t,
      sourceJournalIds: t.sourceJournalIds.filter((id) => validJournalIds.has(id)),
    }));

    let validatedMoment = validated.oneMomentToRemember;
    if (validatedMoment && !validJournalIds.has(validatedMoment.sourceJournalId)) {
      validatedMoment = fallbackOutput.oneMomentToRemember;
    }

    return {
      highlights: validatedHighlights.length > 0 ? validatedHighlights : fallbackOutput.highlights,
      recurringThemes: validatedThemes.length > 0 ? validatedThemes : fallbackOutput.recurringThemes,
      goals: validated.goals,
      reflection: validated.reflection || fallbackOutput.reflection,
      oneMomentToRemember: validatedMoment,
    };
  } catch (err: any) {
    logger.warn('Rewind synthesis failed or returned invalid schema; using deterministic fallback', {
      service: 'GeminiService',
      action: 'synthesizeRewind',
      errorCode: err?.message,
    });
    return fallbackOutput;
  }
}

/**
 * 7. Synthesizes a grounded personal growth and pattern analysis for MindVault Insights.
 */
export async function synthesizeInsights(
  stats: { totalJournals: number; totalMemories: number; activeDays: number },
  topicChanges: { topic: string; earlierCount: number; recentCount: number }[],
  topThemes: { theme: string; count: number }[],
  goalItems: { goal: string; status: 'active' | 'completed' | 'dormant'; sourceJournalId?: string }[],
  peopleItems: { name: string; mentions: number }[],
  placeItems: { name: string; mentions: number }[],
  evidenceJournals: JournalEntry[],
  evidenceMemories: MemoryItem[]
): Promise<InsightsReport> {
  const fallbackReport: InsightsReport = {
    summary: `Across ${stats.totalJournals} journal entries and ${stats.activeDays} active days, your reflections show steady personal exploration with ${topThemes.length} recurring themes.`,
    periodStats: stats,
    recurringThemes: topThemes.slice(0, 5).map((t) => ({
      theme: t.theme,
      count: t.count,
      description: `Discussions and reflections on ${t.theme} appeared ${t.count} times.`,
    })),
    emergingInterests: topicChanges.slice(0, 4).map((tc) => ({
      interest: tc.topic,
      earlierCount: tc.earlierCount,
      recentCount: tc.recentCount,
      explanation: `Appeared ${tc.recentCount} times in recent entries compared to ${tc.earlierCount} earlier.`,
    })),
    goalMomentum: goalItems.slice(0, 5),
    peopleAndPlaces: {
      topPeople: peopleItems.slice(0, 5),
      topPlaces: placeItems.slice(0, 5),
    },
    changes: topicChanges.slice(0, 3).map((tc) => ({
      area: tc.topic,
      shift: `Focus shifted toward ${tc.topic} with increased frequency in recent reflections.`,
    })),
    personalPatterns: [
      `Recorded ${stats.totalJournals} reflections across ${stats.activeDays} active days.`,
      stats.totalMemories > 0 ? `Preserved ${stats.totalMemories} structured memories across your experiences.` : 'Building initial memory baseline.',
    ],
    reflection: 'Your journal documents an intentional, evolving journey of continuous reflection and learning.',
    sources: evidenceJournals.slice(0, 5).map((j) => ({
      sourceType: 'journal' as const,
      sourceId: j.id,
      title: j.title || 'Journal Entry',
    })),
    isEmpty: stats.totalJournals === 0,
  };

  if (evidenceJournals.length === 0) {
    return fallbackReport;
  }

  try {
    const ai = await getGeminiClient();

    const formattedDataset = `
PERIOD_STATS:
- Total Journals: ${stats.totalJournals}
- Total Memories: ${stats.totalMemories}
- Active Days: ${stats.activeDays}

TOPIC_FREQUENCY_COMPARISON (Earlier vs Recent):
${topicChanges.map((tc) => `- ${tc.topic}: ${tc.earlierCount} earlier -> ${tc.recentCount} recently`).join('\n')}

TOP_THEMES:
${topThemes.map((tt) => `- ${tt.theme} (${tt.count} entries)`).join('\n')}

GOALS:
${goalItems.map((g) => `- [${g.status.toUpperCase()}] ${g.goal}`).join('\n')}

PEOPLE_MENTIONS:
${peopleItems.map((p) => `- ${p.name}: ${p.mentions}`).join('\n')}

PLACES_MENTIONS:
${placeItems.map((pl) => `- ${pl.name}: ${pl.mentions}`).join('\n')}

JOURNAL_SAMPLES:
${evidenceJournals.slice(0, 10).map((j) => `[ID: ${j.id}] ${j.title}: ${j.summary || j.content.slice(0, 150)}`).join('\n')}
`;

    const promptText = `Interpret the following verified journal analytics into structured JSON conforming to the schema:\n\n<verified_insights_dataset>\n${formattedDataset}\n</verified_insights_dataset>`;

    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction: MINDVAULT_INSIGHTS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.25,
        maxOutputTokens: 4096,
      },
    });

    const rawJson = cleanJsonText(response.text || '{}');
    const parsed = JSON.parse(rawJson);
    const validated = InsightsOutputSchema.parse(parsed);

    // CRITICAL SECURITY ENFORCEMENT: Source Validation
    const validJournalIds = new Set(evidenceJournals.map((j) => j.id));
    const validMemoryIds = new Set(evidenceMemories.map((m) => m.id));

    const validatedSources = validated.sources.filter((s) => {
      if (s.sourceType === 'journal') return validJournalIds.has(s.sourceId);
      if (s.sourceType === 'memory') return validMemoryIds.has(s.sourceId);
      return false;
    });

    const validatedGoals = validated.goalMomentum.map((g) => ({
      ...g,
      sourceJournalId: g.sourceJournalId && validJournalIds.has(g.sourceJournalId) ? g.sourceJournalId : undefined,
    }));

    return {
      summary: validated.summary,
      periodStats: stats,
      recurringThemes: validated.recurringThemes.length > 0 ? validated.recurringThemes : fallbackReport.recurringThemes,
      emergingInterests: validated.emergingInterests.length > 0 ? validated.emergingInterests : fallbackReport.emergingInterests,
      goalMomentum: validatedGoals.length > 0 ? validatedGoals : fallbackReport.goalMomentum,
      peopleAndPlaces: validated.peopleAndPlaces,
      changes: validated.changes.length > 0 ? validated.changes : fallbackReport.changes,
      personalPatterns: validated.personalPatterns.length > 0 ? validated.personalPatterns : fallbackReport.personalPatterns,
      reflection: validated.reflection,
      sources: validatedSources.length > 0 ? validatedSources : fallbackReport.sources,
      isEmpty: false,
    };
  } catch (err: any) {
    logger.warn('Insights synthesis failed; using deterministic fallback', {
      service: 'GeminiService',
      action: 'synthesizeInsights',
      errorCode: err?.message,
    });
    return fallbackReport;
  }
}

