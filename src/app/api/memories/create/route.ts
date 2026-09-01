import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { MemoryCreateRequestSchema } from '@/lib/validation/schemas';
import { MemoryRepository } from '@/lib/firestore/repositories';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const rawBody = await req.json();
    const parseResult = MemoryCreateRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid memory payload',
          },
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const memory = await MemoryRepository.create(authenticatedUid, {
      category: data.category,
      title: data.title,
      description: data.description,
      sourceJournalId: data.sourceJournalId,
      sourceDate: data.sourceDate || new Date().toISOString(),
      tags: data.tags || [],
    });

    return NextResponse.json({
      success: true,
      data: {
        memory,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
