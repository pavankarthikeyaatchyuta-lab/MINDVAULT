import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiter';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { generateReflectiveResponse } from '@/lib/gemini/journal-service';
import { JournalMessage } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict server-side Firebase ID token verification
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    // Rate limit check: 20 chat turns per minute
    const rateLimit = checkRateLimit(`chat_${authenticatedUid}`, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    // 2. Validate request body against schema
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

    const { messages } = parseResult.data;

    // 3. Generate reflective response from Gemini
    const assistantContent = await generateReflectiveResponse(messages as JournalMessage[]);

    const responseMessage: JournalMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        message: responseMessage,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
