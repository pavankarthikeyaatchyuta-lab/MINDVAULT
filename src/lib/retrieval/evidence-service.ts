import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import { EvidenceItem } from '@/types';
import { logger } from '@/lib/observability/logger';

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'that', 'the',
  'this', 'to', 'was', 'what', 'when', 'where', 'who', 'will', 'with', 'did',
  'have', 'been', 'some', 'me'
]);

/**
 * Tokenizes a query into normalized search terms, filtering common stop words.
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Calculates a lexical relevance score based on keyword match frequencies.
 */
function scoreText(text: string, tokens: string[]): number {
  if (!text || tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower.includes(token)) {
      score += 1;
      // Bonus if match occurs as a distinct word
      const regex = new RegExp(`\\b${token}\\b`, 'i');
      if (regex.test(lower)) {
        score += 1.5;
      }
    }
  }
  return score;
}

/**
 * Retrieves and constructs a bounded evidence set for Ask My Journal.
 * 
 * SECURITY INVARIANT:
 * - Scoped strictly to `authenticatedUid`.
 * - Cross-user data access is mathematically impossible because calls are restricted
 *   to `JournalRepository.list(authenticatedUid)` and `MemoryRepository.list(authenticatedUid)`.
 */
export async function retrieveEvidenceForQuestion(
  authenticatedUid: string,
  question: string,
  maxResults: number = 10
): Promise<EvidenceItem[]> {
  const tokens = tokenizeQuery(question);

  // 1. Fetch user's journals and memories
  const [journals, memories] = await Promise.all([
    JournalRepository.list(authenticatedUid, 50),
    MemoryRepository.list(authenticatedUid),
  ]);

  const candidates: EvidenceItem[] = [];

  // 2. Score and convert Journals
  for (const j of journals) {
    let score = scoreText(j.title, tokens) * 2;
    if (j.summary) {
      score += scoreText(j.summary, tokens) * 1.5;
    }
    if (j.topics && j.topics.length > 0) {
      score += scoreText(j.topics.join(' '), tokens) * 2;
    }
    if (j.content) {
      score += scoreText(j.content.slice(0, 2000), tokens);
    }

    // Include recent journals even if zero match if user asks broad temporal question like "lately" or "recent"
    const isTemporal = tokens.some((t) => ['lately', 'recent', 'recently', 'today', 'yesterday'].includes(t));
    if (score > 0 || isTemporal) {
      // Bound text content to prevent token inflation
      const snippet = j.summary || (j.content.length > 400 ? `${j.content.slice(0, 400)}...` : j.content);
      candidates.push({
        sourceType: 'journal',
        sourceId: j.id,
        title: j.title || 'Untitled Journal',
        date: j.createdAt,
        content: snippet,
        relevance: score,
      });
    }
  }

  // 3. Score and convert Memories
  for (const m of memories) {
    let score = scoreText(m.title, tokens) * 2.5;
    score += scoreText(m.description, tokens) * 1.5;
    score += scoreText(m.category, tokens) * 2;
    if (m.tags && m.tags.length > 0) {
      score += scoreText(m.tags.join(' '), tokens) * 1.5;
    }

    if (score > 0) {
      candidates.push({
        sourceType: 'memory',
        sourceId: m.id,
        title: `[${m.category}] ${m.title}`,
        date: m.sourceDate || m.createdAt,
        content: m.description,
        relevance: score,
      });
    }
  }

  // 4. Sort by relevance descending, tie-break by date
  candidates.sort((a, b) => {
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // If no candidates matched by keywords, fall back to the most recent 5 journals
  if (candidates.length === 0 && journals.length > 0) {
    for (const j of journals.slice(0, 5)) {
      candidates.push({
        sourceType: 'journal',
        sourceId: j.id,
        title: j.title || 'Untitled Journal',
        date: j.createdAt,
        content: j.summary || (j.content.length > 300 ? `${j.content.slice(0, 300)}...` : j.content),
        relevance: 0.1,
      });
    }
  }

  return candidates.slice(0, maxResults);
}

/**
 * Validates that an AI-returned sourceId genuinely exists within the user-owned evidence set.
 * Any hallucinated ID not present in retrievedEvidence is rejected.
 */
export function validateEvidenceSource(
  sourceId: string,
  retrievedEvidence: EvidenceItem[]
): EvidenceItem | null {
  return retrievedEvidence.find((e) => e.sourceId === sourceId) || null;
}
