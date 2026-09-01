import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { JournalRepository } from '@/lib/firestore/repositories';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(1, limitParam), 100);

    const journals = await JournalRepository.list(authenticatedUid, limit);

    return NextResponse.json({
      success: true,
      data: {
        journals,
        count: journals.length,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
