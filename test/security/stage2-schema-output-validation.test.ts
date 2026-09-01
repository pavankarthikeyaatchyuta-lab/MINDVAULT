import {
  ExtractedMemoriesOutputSchema,
  JournalSummaryOutputSchema,
  JournalTitleOutputSchema,
} from '@/lib/validation/schemas';

describe('Security Test Suite: Stage 2 Gemini Structured Output Validation', () => {
  it('1. MUST accept valid memory extraction output conforming to schema', () => {
    const validOutput = {
      memories: [
        {
          category: 'ACHIEVEMENT',
          title: 'Prototype Launched',
          description: 'Successfully deployed the initial version to staging.',
          date: '2026-09-01',
          tags: ['prototype', 'deployment'],
        },
        {
          category: 'DECISION',
          title: 'Selected Next.js Framework',
          description: 'Decided to build on Next.js 15 for Cloud Run compatibility.',
          tags: ['architecture'],
        },
      ],
    };

    const result = ExtractedMemoriesOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('2. MUST reject invalid memory category (e.g. MEDICAL_DIAGNOSIS, INVENTED_TYPE)', () => {
    const invalidOutput = {
      memories: [
        {
          category: 'MEDICAL_DIAGNOSIS', // Illegal category
          title: 'Fake diagnosis',
          description: 'Invalid category test',
        },
      ],
    };

    const result = ExtractedMemoriesOutputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });

  it('3. MUST reject missing required fields (missing title or description)', () => {
    const incompleteOutput = {
      memories: [
        {
          category: 'IDEA',
          // missing title
          description: 'Missing title test',
        },
      ],
    };

    const result = ExtractedMemoriesOutputSchema.safeParse(incompleteOutput);
    expect(result.success).toBe(false);
  });

  it('4. MUST validate summary output schema and reject missing summary field', () => {
    const validSummary = {
      summary: 'The user built a prototype and prepared for testing.',
      topics: ['Prototype', 'Testing'],
    };
    expect(JournalSummaryOutputSchema.safeParse(validSummary).success).toBe(true);

    const invalidSummary = {
      topics: ['Missing summary text'],
    };
    expect(JournalSummaryOutputSchema.safeParse(invalidSummary).success).toBe(false);
  });

  it('5. MUST validate title output schema and reject empty title', () => {
    expect(JournalTitleOutputSchema.safeParse({ title: 'A Good Title' }).success).toBe(true);
    expect(JournalTitleOutputSchema.safeParse({ title: '' }).success).toBe(false);
  });
});
