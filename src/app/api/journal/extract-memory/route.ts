import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { extractMemoriesFromJournal } from '@/lib/gemini/journal-service';
import { MemoryRepository, JournalRepository } from '@/lib/firestore/repositories';
import { JournalMessage, MemoryItem } from '@/types';

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
    const effectiveJournalId = journalId || `draft_${Date.now()}`;
    const sourceDate = new Date().toISOString();

    const extracted = await extractMemoriesFromJournal(
      effectiveJournalId,
      messages as JournalMessage[],
      sourceDate
    );

    // Save extracted memories to Firestore if a journalId was linked
    const savedMemories: MemoryItem[] = [];
    if (journalId) {
      for (const item of extracted) {
        const memory = await MemoryRepository.create(authenticatedUid, {
          category: item.category,
          title: item.title,
          description: item.description,
          sourceJournalId: journalId,
          sourceDate: item.date || sourceDate,
          tags: item.tags || [],
        });
        savedMemories.push(memory);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        memories: journalId ? savedMemories : extracted,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
