import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { JournalRepository } from '@/lib/firestore/repositories';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;
    const { id } = await params;

    const journal = await JournalRepository.getById(authenticatedUid, id);

    if (!journal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Journal entry not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        journal,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;
    const { id } = await params;

    await JournalRepository.delete(authenticatedUid, id);

    return NextResponse.json({
      success: true,
      data: {
        deletedId: id,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
