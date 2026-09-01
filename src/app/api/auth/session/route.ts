import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    return NextResponse.json({
      success: true,
      user: {
        uid: authContext.uid,
        email: authContext.email || null,
        emailVerified: authContext.emailVerified || false,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
