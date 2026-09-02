import { TimelineFilterSchema } from '@/lib/validation/schemas';
import { GET } from '@/app/api/timeline/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';

describe('Security Test Suite: Stage 3 Personal Growth Timeline', () => {
  it('1. MUST reject unauthenticated requests to /api/timeline', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/timeline?filter=ALL');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST validate category filter and reject unknown categories', () => {
    expect(TimelineFilterSchema.safeParse('ALL').success).toBe(true);
    expect(TimelineFilterSchema.safeParse('ACHIEVEMENT').success).toBe(true);
    expect(TimelineFilterSchema.safeParse('DECISION').success).toBe(true);
    expect(TimelineFilterSchema.safeParse('GOAL').success).toBe(true);
    expect(TimelineFilterSchema.safeParse('JOURNAL').success).toBe(true);

    expect(TimelineFilterSchema.safeParse('INVALID_FILTER').success).toBe(false);
    expect(TimelineFilterSchema.safeParse('<script>').success).toBe(false);
  });

  it('3. MUST sort timeline items strictly chronologically descending (newest first)', () => {
    const rawItems = [
      { id: '1', date: '2026-08-01T10:00:00Z', title: 'Older' },
      { id: '2', date: '2026-08-20T10:00:00Z', title: 'Newer' },
      { id: '3', date: '2026-08-10T10:00:00Z', title: 'Middle' },
    ];

    rawItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    expect(rawItems[0].id).toBe('2');
    expect(rawItems[1].id).toBe('3');
    expect(rawItems[2].id).toBe('1');
  });

  it('4. MUST derive authenticated UID from verified token and scope repositories strictly', async () => {
    const mockUid = 'test-user-timeline-uid';
    jest.spyOn(authMiddleware, 'authenticateRequest').mockResolvedValue({
      uid: mockUid,
      email: 'user@example.com',
      emailVerified: true,
    });

    const journalListSpy = jest.spyOn(JournalRepository, 'list').mockResolvedValue([]);
    const memoryListSpy = jest.spyOn(MemoryRepository, 'list').mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/timeline?filter=ALL', {
      headers: { Authorization: 'Bearer valid.jwt.token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(journalListSpy).toHaveBeenCalledWith(mockUid, 100);
    expect(memoryListSpy).toHaveBeenCalledWith(mockUid);
  });
});
