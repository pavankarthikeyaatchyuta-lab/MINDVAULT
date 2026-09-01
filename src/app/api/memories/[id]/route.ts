import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { MemoryUpdateRequestSchema } from '@/lib/validation/schemas';
import { MemoryRepository } from '@/lib/firestore/repositories';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;
    const { id } = await params;

    const memory = await MemoryRepository.getById(authenticatedUid, id);

    if (!memory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Memory item not found',
          },
        },
        { status: 404 }
      );
    }

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;
    const { id } = await params;

    const rawBody = await req.json();
    const parseResult = MemoryUpdateRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid update payload',
          },
        },
        { status: 400 }
      );
    }

    const updated = await MemoryRepository.update(authenticatedUid, id, parseResult.data);

    return NextResponse.json({
      success: true,
      data: {
        memory: updated,
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

    await MemoryRepository.delete(authenticatedUid, id);

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
