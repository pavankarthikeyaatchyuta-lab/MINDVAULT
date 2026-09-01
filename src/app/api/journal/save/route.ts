import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { JournalSaveRequestSchema } from '@/lib/validation/schemas';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import {
  generateJournalTitle,
  generateJournalSummary,
  extractMemoriesFromJournal,
} from '@/lib/gemini/journal-service';
import { JournalEntry, JournalMessage, MemoryItem } from '@/types';
import { logger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    // 2. Validate input schema
    const rawBody = await req.json();
    const parseResult = JournalSaveRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid journal payload',
          },
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const messages = data.messages as JournalMessage[];

    // 3. Compile full content representation from messages
    const content =
      data.content ||
      messages
        .map((m) => `${m.role === 'user' ? 'Me' : 'MindVault'}: ${m.content}`)
        .join('\n\n');

    // 4. Save journal entry first (ensures user writing is never lost)
    let savedJournal: JournalEntry;
    let title = data.title;

    if (!title || title.trim().length === 0) {
      try {
        title = await generateJournalTitle(messages);
      } catch {
        title = `Journal — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    }

    if (data.id) {
      savedJournal = await JournalRepository.update(authenticatedUid, data.id, {
        title,
        content,
        messages,
        topics: data.topics || [],
        location: data.location,
      });
    } else {
      savedJournal = await JournalRepository.create(authenticatedUid, {
        title,
        content,
        messages,
        topics: data.topics || [],
        location: data.location,
      });
    }

    logger.info('Journal entry successfully saved', {
      service: 'JournalService',
      action: 'saveJournal',
      uid: authenticatedUid,
    });

    // 5. Attempt AI operations (Summary & Memory Extraction) gracefully
    let summary = savedJournal.summary;
    let topics = savedJournal.topics || [];
    let extractedMemories: MemoryItem[] = [];
    let aiStatus = { summaryGenerated: false, memoriesExtracted: 0 };

    try {
      // Generate summary
      const summaryResult = await generateJournalSummary(messages);
      summary = summaryResult.summary;
      topics = Array.from(new Set([...topics, ...summaryResult.topics]));

      // Update journal with summary and topics
      savedJournal = await JournalRepository.update(authenticatedUid, savedJournal.id, {
        summary,
        topics,
      });
      aiStatus.summaryGenerated = true;
    } catch (err: any) {
      logger.warn('AI Summary step failed during save; continuing gracefully', {
        service: 'JournalService',
        action: 'generateJournalSummary',
      });
    }

    try {
      // Extract structured memories
      const memoryItems = await extractMemoriesFromJournal(
        savedJournal.id,
        messages,
        savedJournal.createdAt
      );

      // Save extracted memories into Firestore
      for (const item of memoryItems) {
        const savedMemory = await MemoryRepository.create(authenticatedUid, {
          category: item.category,
          title: item.title,
          description: item.description,
          sourceJournalId: savedJournal.id,
          sourceDate: item.date || savedJournal.createdAt,
          tags: item.tags || [],
        });
        extractedMemories.push(savedMemory);
      }
      aiStatus.memoriesExtracted = extractedMemories.length;
    } catch (err: any) {
      logger.warn('AI Memory extraction step failed during save; continuing gracefully', {
        service: 'JournalService',
        action: 'extractMemoriesFromJournal',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        journal: savedJournal,
        extractedMemories,
        aiStatus,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
