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
 * Detects temporal keywords and returns a target date window if specified in the query.
 */
export function detectTemporalIntent(query: string): { isTemporal: boolean; startDate?: Date; endDate?: Date } {
  const q = query.toLowerCase();
  const now = new Date();

  if (q.includes('yesterday') || q.includes('today')) {
    const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    return { isTemporal: true, startDate: start, endDate: now };
  }
  if (q.includes('last week') || q.includes('past week') || q.includes('this week')) {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { isTemporal: true, startDate: start, endDate: now };
  }
  if (q.includes('recently') || q.includes('lately') || q.includes('last month') || q.includes('past month')) {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { isTemporal: true, startDate: start, endDate: now };
  }
  if (q.includes('this year') || q.includes('earlier this year')) {
    const start = new Date(now.getFullYear(), 0, 1);
    return { isTemporal: true, startDate: start, endDate: now };
  }

  return { isTemporal: false };
}

/**
 * Identifies target memory categories from query intent.
 */
export function detectCategoryIntent(query: string): Set<string> {
  const q = query.toLowerCase();
  const categories = new Set<string>();

  if (q.includes('goal') || q.includes('target') || q.includes('aim') || q.includes('plan')) {
    categories.add('GOAL');
  }
  if (q.includes('decision') || q.includes('chose') || q.includes('decide') || q.includes('choice')) {
    categories.add('DECISION');
  }
  if (q.includes('idea') || q.includes('project') || q.includes('concept') || q.includes('building')) {
    categories.add('IDEA');
  }
  if (q.includes('person') || q.includes('who') || q.includes('friend') || q.includes('talked with')) {
    categories.add('PERSON');
  }
  if (q.includes('place') || q.includes('where') || q.includes('travel') || q.includes('city') || q.includes('trip')) {
    categories.add('PLACE');
  }
  if (q.includes('win') || q.includes('achieve') || q.includes('accomplish') || q.includes('proud')) {
    categories.add('ACHIEVEMENT');
  }
  if (q.includes('worried') || q.includes('worry') || q.includes('concern') || q.includes('anxious') || q.includes('stress')) {
    categories.add('CONCERN');
  }
  if (q.includes('prefer') || q.includes('like') || q.includes('dislike') || q.includes('habit')) {
    categories.add('PREFERENCE');
  }

  return categories;
}

/**
 * Retrieves and constructs a bounded evidence set for Ask My Journal using multi-signal hybrid scoring.
 * 
 * SIGNALS:
 * 1. Lexical match (tokens + exact phrase matching)
 * 2. Topic tag matches
 * 3. Memory Category Intent Boost
 * 4. Temporal window relevance
 * 5. Recency decay weighting
 * 
 * SECURITY INVARIANT:
 * - Scoped strictly to `authenticatedUid`.
 */
export async function retrieveEvidenceForQuestion(
  authenticatedUid: string,
  question: string,
  maxResults: number = 10
): Promise<EvidenceItem[]> {
  const tokens = tokenizeQuery(question);
  const temporal = detectTemporalIntent(question);
  const categoryIntents = detectCategoryIntent(question);
  const now = Date.now();

  // 1. Fetch user's journals and memories
  const [journals, memories] = await Promise.all([
    JournalRepository.list(authenticatedUid, 50),
    MemoryRepository.list(authenticatedUid),
  ]);

  const candidates: EvidenceItem[] = [];

  // Helper to score recency
  const getRecencyScore = (dateStr: string) => {
    const elapsedDays = Math.max(0, (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 2.0 - elapsedDays * 0.05); // Up to +2 points, gently decays
  };

  // 2. Score and convert Journals
  for (const j of journals) {
    let score = scoreText(j.title, tokens) * 2.5;

    // Exact title or query inclusion bonus
    if (question.toLowerCase().includes(j.title.toLowerCase()) && j.title.length > 4) {
      score += 4.0;
    }

    if (j.summary) {
      score += scoreText(j.summary, tokens) * 2.0;
    }
    if (j.topics && j.topics.length > 0) {
      score += scoreText(j.topics.join(' '), tokens) * 2.5;
    }
    if (j.content) {
      score += scoreText(j.content.slice(0, 2000), tokens);
    }

    // Temporal signal boost
    if (temporal.isTemporal && temporal.startDate && temporal.endDate) {
      const entryDate = new Date(j.createdAt);
      if (entryDate >= temporal.startDate && entryDate <= temporal.endDate) {
        score += 3.5;
      }
    }

    score += getRecencyScore(j.createdAt);

    if (score > 1.5 || temporal.isTemporal) {
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
    let score = scoreText(m.title, tokens) * 3.0;
    score += scoreText(m.description, tokens) * 2.0;
    score += scoreText(m.category, tokens) * 2.5;

    if (m.tags && m.tags.length > 0) {
      score += scoreText(m.tags.join(' '), tokens) * 2.0;
    }

    // Category intent boost
    if (categoryIntents.has(m.category)) {
      score += 4.0;
    }

    // Temporal signal boost
    const memDate = m.sourceDate ? new Date(m.sourceDate) : new Date(m.createdAt);
    if (temporal.isTemporal && temporal.startDate && temporal.endDate) {
      if (memDate >= temporal.startDate && memDate <= temporal.endDate) {
        score += 3.0;
      }
    }

    score += getRecencyScore(m.sourceDate || m.createdAt);

    if (score > 1.5 || categoryIntents.has(m.category)) {
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

  // If no candidates met threshold but user has journals, provide most recent 5
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

