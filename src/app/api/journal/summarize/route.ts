import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { generateJournalSummary } from '@/lib/gemini/journal-service';
import { JournalRepository } from '@/lib/firestore/repositories';
import { JournalMessage } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const rawBody = await req.json();
    const parseResult = ChatRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid conversation payload',
          },
        },
        { status: 400 }
      );
    }

    const { messages, journalId } = parseResult.data;
    const summaryData = await generateJournalSummary(messages as JournalMessage[]);

    // If journalId is provided, persist the summary back to Firestore
    if (journalId) {
      const existing = await JournalRepository.getById(authenticatedUid, journalId);
      if (existing) {
        const updatedTopics = Array.from(new Set([...(existing.topics || []), ...summaryData.topics]));
        await JournalRepository.update(authenticatedUid, journalId, {
          summary: summaryData.summary,
          topics: updatedTopics,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
