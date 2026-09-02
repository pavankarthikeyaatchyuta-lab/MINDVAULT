import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export interface AuthenticatedContext {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extracts and verifies the Firebase ID Token from the Authorization header.
 * 
 * CRITICAL SECURITY INVARIANT:
 * - This function is the single source of truth for the user's identity (UID).
 * - Under NO circumstance should client-supplied request body UID or query param UID
 *   be used for authorization or Firestore path resolution.
 * - Always use the verified `context.uid` returned by this function.
 */
export async function verifyAuthHeader(authHeader: string | null | undefined): Promise<AuthenticatedContext> {
  if (!authHeader) {
    throw new AuthError('Missing Authorization header. Authentication required.', 401);
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new AuthError('Invalid Authorization header format. Expected "Bearer <token>".', 401);
  }

  const idToken = parts[1];
  if (!idToken || idToken.length < 10) {
    throw new AuthError('Invalid or empty token provided.', 401);
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true);

    if (!decodedToken.uid) {
      throw new AuthError('Token does not contain a valid user identity (UID).', 401);
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
  } catch (err: any) {
    if (err instanceof AuthError) throw err;

    // Handle standard Firebase Admin auth error codes
    if (err.code === 'auth/id-token-expired') {
      throw new AuthError('Authentication token has expired. Please refresh your session.', 401);
    }
    if (err.code === 'auth/id-token-revoked') {
      throw new AuthError('Authentication token has been revoked.', 401);
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      throw new AuthError('Invalid authentication token.', 401);
    }

    throw new AuthError('Authentication failed: ' + (err.message || 'Token verification error'), 401);
  }
}

/**
 * Helper to verify NextRequest Authorization header
 */
export async function authenticateRequest(req: NextRequest | Request): Promise<AuthenticatedContext> {
  const authHeader = req.headers.get('authorization');
  return verifyAuthHeader(authHeader);
}

/**
 * Standard JSON error response helper that never leaks stack traces or credentials
 */
export function createErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  let errMessage = error instanceof Error ? error.message : 'Internal Server Error';
  if (errMessage.includes('/') || errMessage.includes('\\') || errMessage.includes('.json')) {
    errMessage = 'An internal system error occurred.';
  }
  
  // Non-sensitive server error response
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : errMessage,
      },
    },
    { status: 500 }
  );
}
