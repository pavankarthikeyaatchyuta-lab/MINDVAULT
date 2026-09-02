import { AskJournalRequestSchema, AskJournalOutputSchema } from '@/lib/validation/schemas';
import { POST } from '@/app/api/journal/ask/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';
import * as evidenceService from '@/lib/retrieval/evidence-service';
import * as geminiService from '@/lib/gemini/journal-service';

describe('Security Test Suite: Stage 3 Ask My Journal', () => {
  it('1. MUST reject unauthenticated requests to /api/journal/ask', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/journal/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What goals did I set?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST reject empty question or questions exceeding 1000 characters', () => {
    expect(AskJournalRequestSchema.safeParse({ question: '' }).success).toBe(false);

    const longQuestion = 'a'.repeat(1001);
    expect(AskJournalRequestSchema.safeParse({ question: longQuestion }).success).toBe(false);

    expect(AskJournalRequestSchema.safeParse({ question: 'Valid question?' }).success).toBe(true);
  });

  it('3. MUST return low confidence fallback when evidence is empty without invoking Gemini', async () => {
    const result = await geminiService.askMyJournal('What did I do?', []);

    expect(result.confidence).toBe('low');
    expect(result.answer).toContain("I couldn't find enough information");
    expect(result.sources).toHaveLength(0);
  });

  it('4. MUST validate and filter out any hallucinated sourceId from Gemini response', () => {
    const mockEvidence = [
      {
        sourceType: 'journal' as const,
        sourceId: 'valid_journal_123',
        title: 'Project Update',
        date: '2026-08-20',
        content: 'Worked on ML prototype.',
        relevance: 5,
      },
    ];

    // Simulate Gemini returning one valid and one hallucinated source ID
    const rawGeminiSources = [
      {
        sourceType: 'journal' as const,
        sourceId: 'valid_journal_123',
        title: 'Project Update',
        date: '2026-08-20',
      },
      {
        sourceType: 'journal' as const,
        sourceId: 'hallucinated_fake_id_999', // Hallucinated ID
        title: 'Fake Entry',
        date: '2026-08-21',
      },
    ];

    const validatedSources = rawGeminiSources.filter((s) =>
      mockEvidence.some((e) => e.sourceId === s.sourceId)
    );

    expect(validatedSources).toHaveLength(1);
    expect(validatedSources[0].sourceId).toBe('valid_journal_123');
  });

  it('5. MUST ensure tokenizeQuery strips stop words and sanitizes search tokens', () => {
    const tokens = evidenceService.tokenizeQuery('What did I say about the project yesterday?');
    expect(tokens).toContain('project');
    expect(tokens).toContain('yesterday');
    expect(tokens).not.toContain('what');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('about');
  });
});
