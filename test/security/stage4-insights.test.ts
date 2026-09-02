import { GET } from '@/app/api/insights/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';
import { InsightsOutputSchema } from '@/lib/validation/schemas';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';

describe('Security Test Suite: Stage 4 MindVault Insights', () => {
  it('1. MUST reject unauthenticated requests to /api/insights', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/insights');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST return clean empty state without calling Gemini when user has zero journals', async () => {
    const mockUid = 'test-insights-empty-uid';
    jest.spyOn(authMiddleware, 'authenticateRequest').mockResolvedValue({
      uid: mockUid,
      email: 'user@example.com',
      emailVerified: true,
    });

    jest.spyOn(JournalRepository, 'list').mockResolvedValue([]);
    jest.spyOn(MemoryRepository, 'list').mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/insights', {
      headers: { Authorization: 'Bearer valid.jwt.token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.isEmpty).toBe(true);
    expect(json.data.periodStats.totalJournals).toBe(0);
  });

  it('3. MUST validate structured InsightsOutputSchema from Gemini', () => {
    const validInsights = {
      summary: 'Consistent growth in software engineering and cloud architecture.',
      recurringThemes: [
        {
          theme: 'Cloud Architecture',
          count: 6,
          description: 'Recurring discussions on Cloud Run and Secret Manager.',
        },
      ],
      emergingInterests: [
        {
          interest: 'Next.js 15',
          earlierCount: 1,
          recentCount: 5,
          explanation: 'Appeared substantially more often in recent entries.',
        },
      ],
      goalMomentum: [
        {
          goal: 'Ship MindVault Hackathon Prototype',
          status: 'active' as const,
          sourceJournalId: 'journal_123',
        },
      ],
      peopleAndPlaces: {
        topPeople: [{ name: 'Alex', mentions: 3 }],
        topPlaces: [{ name: 'Hyderabad', mentions: 4 }],
      },
      changes: [
        {
          area: 'Technical Architecture',
          shift: 'Focus shifted from initial planning to multi-stage hardening.',
        },
      ],
      personalPatterns: ['Journaling consistently every weekday morning.'],
      reflection: 'A disciplined, intentional progression toward mastery.',
      sources: [
        {
          sourceType: 'journal' as const,
          sourceId: 'journal_123',
          title: 'MindVault Launch',
        },
      ],
    };

    const result = InsightsOutputSchema.safeParse(validInsights);
    expect(result.success).toBe(true);
  });

  it('4. MUST reject malformed InsightsOutput missing summary', () => {
    const invalidInsights = {
      // missing summary
      recurringThemes: [],
      emergingInterests: [],
      goalMomentum: [],
      peopleAndPlaces: { topPeople: [], topPlaces: [] },
      changes: [],
      personalPatterns: [],
      reflection: 'Good job.',
      sources: [],
    };

    const result = InsightsOutputSchema.safeParse(invalidInsights);
    expect(result.success).toBe(false);
  });
});
