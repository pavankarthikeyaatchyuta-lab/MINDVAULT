import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { MemoryRepository } from '@/lib/firestore/repositories';
import { MemoryCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const url = new URL(req.url);
    const categoryParam = url.searchParams.get('category') as MemoryCategory | null;

    const memories = await MemoryRepository.list(
      authenticatedUid,
      categoryParam || undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        memories,
        count: memories.length,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
