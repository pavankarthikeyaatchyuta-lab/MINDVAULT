import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { TimelineFilterSchema } from '@/lib/validation/schemas';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import { TimelineItem, TimelineChangeInsight } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const url = new URL(req.url);
    const filterParam = url.searchParams.get('filter') || 'ALL';

    const parseResult = TimelineFilterSchema.safeParse(filterParam);
    const activeFilter = parseResult.success ? parseResult.data : 'ALL';

    // 1. Fetch user journals and memories
    const [journals, memories] = await Promise.all([
      JournalRepository.list(authenticatedUid, 100),
      MemoryRepository.list(authenticatedUid),
    ]);

    const items: TimelineItem[] = [];

    // 2. Transform journals to timeline items
    if (activeFilter === 'ALL' || activeFilter === 'JOURNAL') {
      for (const j of journals) {
        items.push({
          id: `timeline_j_${j.id}`,
          type: 'JOURNAL',
          title: j.title || 'Personal Reflection',
          description: j.summary || (j.content.length > 250 ? `${j.content.slice(0, 250)}...` : j.content),
          date: j.createdAt,
          sourceJournalId: j.id,
          tags: j.topics || [],
        });
      }
    }

    // 3. Transform memories to timeline items
    for (const m of memories) {
      if (activeFilter === 'ALL' || activeFilter === m.category) {
        items.push({
          id: `timeline_m_${m.id}`,
          type: m.category,
          title: m.title,
          description: m.description,
          date: m.sourceDate || m.createdAt,
          sourceJournalId: m.sourceJournalId,
          sourceMemoryId: m.id,
          tags: m.tags || [],
        });
      }
    }

    // 4. Sort strictly chronologically (newest first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 5. Deterministic "What changed?" insight calculation
    let changeInsight: TimelineChangeInsight | null = null;
    if (items.length >= 4) {
      const midpoint = Math.floor(items.length / 2);
      const recentSlice = items.slice(0, midpoint);
      const earlierSlice = items.slice(midpoint);

      const countThemes = (slice: TimelineItem[]) => {
        const counts: Record<string, number> = {};
        for (const it of slice) {
          if (it.tags) {
            for (const t of it.tags) {
              counts[t] = (counts[t] || 0) + 1;
            }
          }
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k);
      };

      const earlierThemes = countThemes(earlierSlice);
      const recentThemes = countThemes(recentSlice);

      if (earlierThemes.length > 0 || recentThemes.length > 0) {
        const earlierStr = earlierThemes.join(', ') || 'general reflections';
        const recentStr = recentThemes.join(', ') || 'ongoing projects';
        changeInsight = {
          earlierThemes,
          recentThemes,
          shiftSummary: `Earlier entries focused primarily on ${earlierStr}, while more recent entries shifted toward ${recentStr}.`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalCount: items.length,
        changeInsight,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
