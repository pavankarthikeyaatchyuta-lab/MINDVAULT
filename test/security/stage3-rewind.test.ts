import { RewindRequestSchema, RewindOutputSchema } from '@/lib/validation/schemas';
import { POST } from '@/app/api/journal/rewind/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';

describe('Security Test Suite: Stage 3 Journal Rewind', () => {
  it('1. MUST reject unauthenticated requests to /api/journal/rewind', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/journal/rewind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ range: '30d' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST validate supported ranges and reject arbitrary or malicious range strings', () => {
    expect(RewindRequestSchema.safeParse({ range: '7d' }).success).toBe(true);
    expect(RewindRequestSchema.safeParse({ range: '30d' }).success).toBe(true);
    expect(RewindRequestSchema.safeParse({ range: '90d' }).success).toBe(true);
    expect(RewindRequestSchema.safeParse({ range: 'all' }).success).toBe(true);

    expect(RewindRequestSchema.safeParse({ range: '1year' }).success).toBe(false);
    expect(RewindRequestSchema.safeParse({ range: '../etc/passwd' }).success).toBe(false);
    expect(RewindRequestSchema.safeParse({ range: '' }).success).toBe(false);
  });

  it('3. MUST validate structured RewindOutputSchema from Gemini', () => {
    const validOutput = {
      highlights: [
        {
          title: 'Shipped MindVault',
          description: 'Completed production build with clean tests.',
          sourceJournalId: 'journal_123',
        },
      ],
      recurringThemes: [
        {
          theme: 'Architecture',
          description: 'Continued focus on UID isolation.',
          sourceJournalIds: ['journal_123'],
        },
      ],
      goals: [
        {
          title: 'Deploy to Cloud Run',
          status: 'in-progress',
          sourceJournalId: 'journal_123',
        },
      ],
      reflection: 'A productive period focused on robust system design.',
      oneMomentToRemember: {
        title: 'Project Launch',
        description: 'First successful end-to-end run.',
        sourceJournalId: 'journal_123',
      },
    };

    const result = RewindOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('4. MUST reject malformed RewindOutput missing required reflection field', () => {
    const invalidOutput = {
      highlights: [],
      recurringThemes: [],
      goals: [],
      // missing reflection
    };

    const result = RewindOutputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });
});
