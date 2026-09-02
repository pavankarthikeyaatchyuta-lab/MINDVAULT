import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiter';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import { synthesizeInsights } from '@/lib/gemini/journal-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    // Rate limit check: 10 insights generations per minute
    const rateLimit = checkRateLimit(`insights_${authenticatedUid}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    // 1. Fetch user data strictly scoped to authenticated UID
    const [journals, memories] = await Promise.all([
      JournalRepository.list(authenticatedUid, 100),
      MemoryRepository.list(authenticatedUid),
    ]);

    // Handle empty state gracefully
    if (journals.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: 'Your journal vault is waiting for its first entries.',
          periodStats: {
            totalJournals: 0,
            totalMemories: 0,
            activeDays: 0,
          },
          recurringThemes: [],
          emergingInterests: [],
          goalMomentum: [],
          peopleAndPlaces: { topPeople: [], topPlaces: [] },
          changes: [],
          personalPatterns: [],
          reflection: 'Start writing your thoughts to discover personal insights and patterns.',
          sources: [],
          isEmpty: true,
        },
      });
    }

    // 2. Deterministic Statistics Calculation
    const totalJournals = journals.length;
    const totalMemories = memories.length;
    const activeDaysSet = new Set(
      journals.map((j) => new Date(j.createdAt).toISOString().split('T')[0])
    );
    const activeDays = activeDaysSet.size;

    // Split journals into earlier vs recent halves
    const midpoint = Math.ceil(journals.length / 2);
    // Note: journals from list() are sorted newest first
    const recentJournals = journals.slice(0, midpoint);
    const earlierJournals = journals.slice(midpoint);

    const countTopics = (entries: typeof journals) => {
      const counts: Record<string, number> = {};
      for (const j of entries) {
        if (j.topics) {
          for (const t of j.topics) {
            const norm = t.trim();
            if (norm) counts[norm] = (counts[norm] || 0) + 1;
          }
        }
      }
      return counts;
    };

    const earlierTopicCounts = countTopics(earlierJournals);
    const recentTopicCounts = countTopics(recentJournals);
    const allTopics = new Set([...Object.keys(earlierTopicCounts), ...Object.keys(recentTopicCounts)]);

    const topicChanges = Array.from(allTopics)
      .map((topic) => ({
        topic,
        earlierCount: earlierTopicCounts[topic] || 0,
        recentCount: recentTopicCounts[topic] || 0,
      }))
      .sort((a, b) => (b.recentCount - b.earlierCount) - (a.recentCount - a.earlierCount))
      .slice(0, 5);

    // Top recurring themes
    const totalTopicCounts: Record<string, number> = {};
    for (const j of journals) {
      if (j.topics) {
        for (const t of j.topics) {
          const norm = t.trim();
          if (norm) totalTopicCounts[norm] = (totalTopicCounts[norm] || 0) + 1;
        }
      }
    }
    const topThemes = Object.entries(totalTopicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([theme, count]) => ({ theme, count }));

    // Extract Goals
    const goalMemories = memories.filter((m) => m.category === 'GOAL');
    const goalItems = goalMemories.slice(0, 6).map((m) => ({
      goal: m.title,
      status: 'active' as const,
      sourceJournalId: m.sourceJournalId,
    }));

    // Extract People and Places from memories
    const peopleMemories = memories.filter((m) => m.category === 'PERSON');
    const peopleCountsMap: Record<string, number> = {};
    for (const p of peopleMemories) {
      const name = p.title.replace(/^\[.*?\]\s*/, '').trim();
      peopleCountsMap[name] = (peopleCountsMap[name] || 0) + 1;
    }
    const topPeople = Object.entries(peopleCountsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mentions]) => ({ name, mentions }));

    const placeMemories = memories.filter((m) => m.category === 'PLACE');
    const placeCountsMap: Record<string, number> = {};
    for (const pl of placeMemories) {
      const name = pl.title.replace(/^\[.*?\]\s*/, '').trim();
      placeCountsMap[name] = (placeCountsMap[name] || 0) + 1;
    }
    const topPlaces = Object.entries(placeCountsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mentions]) => ({ name, mentions }));

    // 3. Synthesize qualitative narrative grounded in the verified metrics
    const report = await synthesizeInsights(
      { totalJournals, totalMemories, activeDays },
      topicChanges,
      topThemes,
      goalItems,
      topPeople,
      topPlaces,
      journals,
      memories
    );

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
