import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiter';
import { RewindRequestSchema, RewindRangeSchema } from '@/lib/validation/schemas';
import { JournalRepository, MemoryRepository, RewindRepository } from '@/lib/firestore/repositories';
import { synthesizeRewind } from '@/lib/gemini/journal-service';
import { JournalEntry, MemoryItem } from '@/types';

export const dynamic = 'force-dynamic';

function getStartDateForRange(range: '7d' | '30d' | '90d' | 'all'): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0); // Epoch
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    // Rate limit check: 10 rewind calls per minute
    const rateLimit = checkRateLimit(`rewind_${authenticatedUid}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    const rawBody = await req.json();
    const parseResult = RewindRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid range parameter',
          },
        },
        { status: 400 }
      );
    }

    const { range } = parseResult.data;
    const startDate = getStartDateForRange(range);
    const now = new Date();

    // 1. Fetch user records
    const [allJournals, allMemories] = await Promise.all([
      JournalRepository.list(authenticatedUid, 100),
      MemoryRepository.list(authenticatedUid),
    ]);

    // 2. Filter records within selected range
    const filteredJournals = allJournals.filter((j) => new Date(j.createdAt) >= startDate);
    const filteredMemories = allMemories.filter((m) => {
      const d = m.sourceDate ? new Date(m.sourceDate) : new Date(m.createdAt);
      return d >= startDate;
    });

    // 3. Compute deterministic statistics
    const journalCount = filteredJournals.length;
    const activeDaysSet = new Set(
      filteredJournals.map((j) => new Date(j.createdAt).toISOString().split('T')[0])
    );
    const activeDays = activeDaysSet.size;

    // Deterministic topic frequency calculation
    const topicCounts: Record<string, number> = {};
    for (const j of filteredJournals) {
      if (j.topics) {
        for (const t of j.topics) {
          const norm = t.trim();
          if (norm) {
            topicCounts[norm] = (topicCounts[norm] || 0) + 1;
          }
        }
      }
    }
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // If 0 entries exist in range: return clean deterministic empty retrospective
    if (journalCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          period: {
            type: range,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
          },
          stats: {
            journalCount: 0,
            activeDays: 0,
            topTopics: [],
          },
          highlights: [],
          recurringThemes: [],
          goals: [],
          reflection: "There are no journal entries recorded in this time range yet.",
          oneMomentToRemember: null,
          isEmpty: true,
        },
      });
    }

    // 4. Synthesize narrative via Gemini with verified source IDs
    const periodLabels: Record<string, string> = {
      '7d': '7-day',
      '30d': '30-day',
      '90d': '90-day',
      all: 'all-time',
    };

    const synthesis = await synthesizeRewind(
      periodLabels[range] || 'retrospective',
      { journalCount, activeDays, topTopics },
      filteredJournals,
      filteredMemories
    );

    const report = {
      period: {
        type: range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      stats: {
        journalCount,
        activeDays,
        topTopics,
      },
      highlights: synthesis.highlights,
      recurringThemes: synthesis.recurringThemes,
      goals: synthesis.goals,
      reflection: synthesis.reflection,
      oneMomentToRemember: synthesis.oneMomentToRemember,
      isEmpty: false,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
