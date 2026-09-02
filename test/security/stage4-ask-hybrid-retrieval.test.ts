import * as evidenceService from '@/lib/retrieval/evidence-service';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';

describe('Security Test Suite: Stage 4 Ask My Journal Hybrid Retrieval', () => {
  it('1. MUST detect temporal keywords and construct correct time bounds', () => {
    const resRecent = evidenceService.detectTemporalIntent('What did I do recently?');
    expect(resRecent.isTemporal).toBe(true);
    expect(resRecent.startDate).toBeDefined();

    const resMonth = evidenceService.detectTemporalIntent('What goals did I set last month?');
    expect(resMonth.isTemporal).toBe(true);
    expect(resMonth.startDate).toBeDefined();

    const resNonTemporal = evidenceService.detectTemporalIntent('What is my favorite language?');
    expect(resNonTemporal.isTemporal).toBe(false);
  });

  it('2. MUST detect category intent from user query keywords', () => {
    const goalIntents = evidenceService.detectCategoryIntent('What goals have I been aiming for?');
    expect(goalIntents.has('GOAL')).toBe(true);

    const decisionIntents = evidenceService.detectCategoryIntent('What career decision did I make?');
    expect(decisionIntents.has('DECISION')).toBe(true);

    const placeIntents = evidenceService.detectCategoryIntent('What city did I travel to?');
    expect(placeIntents.has('PLACE')).toBe(true);

    const worryIntents = evidenceService.detectCategoryIntent('What concerns or worries kept recurring?');
    expect(worryIntents.has('CONCERN')).toBe(true);
  });

  it('3. MUST prioritize target category memories over unrelated entries', async () => {
    const mockUid = 'test-hybrid-retrieval-uid';

    jest.spyOn(JournalRepository, 'list').mockResolvedValue([]);
    jest.spyOn(MemoryRepository, 'list').mockResolvedValue([
      {
        id: 'mem_other',
        uid: mockUid,
        category: 'PREFERENCE',
        title: 'I like green tea',
        description: 'Drink tea in the morning.',
        sourceJournalId: 'j1',
        sourceDate: '2026-08-01',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01',
      },
      {
        id: 'mem_goal',
        uid: mockUid,
        category: 'GOAL',
        title: 'Complete Hackathon Project',
        description: 'Aiming to finish the submission by tomorrow.',
        sourceJournalId: 'j2',
        sourceDate: '2026-08-15',
        createdAt: '2026-08-15',
        updatedAt: '2026-08-15',
      },
    ]);

    const evidence = await evidenceService.retrieveEvidenceForQuestion(
      mockUid,
      'What goals have I set?'
    );

    expect(evidence.length).toBeGreaterThanOrEqual(1);
    expect(evidence[0].sourceId).toBe('mem_goal');
    expect(evidence[0].relevance).toBeGreaterThan(0);
  });
});
