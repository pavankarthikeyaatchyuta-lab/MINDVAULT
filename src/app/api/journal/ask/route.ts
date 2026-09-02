import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limiter';
import { AskJournalRequestSchema } from '@/lib/validation/schemas';
import { retrieveEvidenceForQuestion } from '@/lib/retrieval/evidence-service';
import { askMyJournal } from '@/lib/gemini/journal-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller and obtain authoritative UID
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    // Rate limit check: 15 queries per minute
    const rateLimit = checkRateLimit(`ask_${authenticatedUid}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt);
    }

    // 2. Validate input schema
    const rawBody = await req.json();
    const parseResult = AskJournalRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: parseResult.error.issues[0]?.message || 'Invalid question format',
          },
        },
        { status: 400 }
      );
    }

    const { question } = parseResult.data;

    // 3. Retrieve bounded evidence scoped strictly to the authenticated user
    const evidence = await retrieveEvidenceForQuestion(authenticatedUid, question, 10);

    // 4. Synthesize answer with strict source validation
    const result = await askMyJournal(question, evidence);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
