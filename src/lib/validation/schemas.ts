import { z } from 'zod';

// =============================================================================
// 1. Chat & Message Schemas
// =============================================================================
export const JournalMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(4000, 'Message exceeds maximum length of 4000 characters'),
  timestamp: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  messages: z
    .array(JournalMessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Conversation history exceeds maximum turn limit of 50'),
  journalId: z.string().max(100).optional(),
});

// =============================================================================
// 2. Journal Persistence Schemas
// =============================================================================
export const JournalSaveRequestSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(20000).optional(),
  messages: z.array(JournalMessageSchema).min(1, 'Journal must contain at least one message'),
  topics: z.array(z.string().max(50)).max(10).optional(),
  location: z
    .object({
      placeId: z.string().max(200).optional(),
      name: z.string().max(200),
      formattedAddress: z.string().max(500).optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

// =============================================================================
// 3. Gemini Structured Output Schemas (Validated with Zod)
// =============================================================================
export const MemoryCategorySchema = z.enum([
  'EVENT',
  'PERSON',
  'PLACE',
  'GOAL',
  'DECISION',
  'ACHIEVEMENT',
  'IDEA',
  'CONCERN',
  'PREFERENCE',
]);

export const ExtractedMemoryItemSchema = z.object({
  category: MemoryCategorySchema,
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(1000),
  date: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(5).optional(),
});

export const ExtractedMemoriesOutputSchema = z.object({
  memories: z.array(ExtractedMemoryItemSchema).max(10),
});

export const JournalSummaryOutputSchema = z.object({
  summary: z.string().min(1).max(1000),
  topics: z.array(z.string().max(50)).max(8),
});

export const JournalTitleOutputSchema = z.object({
  title: z.string().min(1).max(100),
});

// =============================================================================
// 4. Manual Memory Management Schemas
// =============================================================================
export const MemoryCreateRequestSchema = z.object({
  category: MemoryCategorySchema,
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().min(1, 'Description is required').max(1000),
  sourceJournalId: z.string().min(1, 'sourceJournalId is required').max(100),
  sourceDate: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const MemoryUpdateRequestSchema = z.object({
  category: MemoryCategorySchema.optional(),
  title: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// =============================================================================
// 5. Stage 3: Ask My Journal Schemas
// =============================================================================
export const AskJournalRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(1000, 'Question exceeds maximum length of 1000 characters'),
});

export const AskSourceReferenceSchema = z.object({
  sourceType: z.enum(['journal', 'memory', 'goal']),
  sourceId: z.string(),
  title: z.string(),
  date: z.string(),
  excerpt: z.string().optional(),
});

export const AskJournalOutputSchema = z.object({
  answer: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
  sources: z.array(AskSourceReferenceSchema).default([]),
});

// =============================================================================
// 6. Stage 3: Journal Rewind Schemas
// =============================================================================
export const RewindRangeSchema = z.enum(['7d', '30d', '90d', 'all']);

export const RewindRequestSchema = z.object({
  range: RewindRangeSchema,
});

export const RewindOutputSchema = z.object({
  highlights: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        sourceJournalId: z.string(),
      })
    )
    .max(5)
    .default([]),
  recurringThemes: z
    .array(
      z.object({
        theme: z.string().min(1),
        description: z.string().min(1),
        sourceJournalIds: z.array(z.string()).default([]),
      })
    )
    .max(5)
    .default([]),
  goals: z
    .array(
      z.object({
        title: z.string().min(1),
        status: z.string(),
        sourceJournalId: z.string().optional(),
      })
    )
    .max(5)
    .default([]),
  reflection: z.string().min(1),
  oneMomentToRemember: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      sourceJournalId: z.string(),
    })
    .nullable()
    .optional(),
});

// =============================================================================
// 7. Stage 3: Timeline Schemas
// =============================================================================
export const TimelineFilterSchema = z.enum([
  'ALL',
  'JOURNAL',
  'ACHIEVEMENT',
  'DECISION',
  'IDEA',
  'GOAL',
  'EVENT',
  'PERSON',
  'PLACE',
  'CONCERN',
  'PREFERENCE',
]);

