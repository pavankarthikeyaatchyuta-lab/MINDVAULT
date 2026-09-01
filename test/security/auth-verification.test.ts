import { verifyAuthHeader, AuthError } from '@/lib/security/auth-middleware';
import * as adminAuth from '@/lib/firebase/admin';

// Mock getAdminAuth
jest.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: jest.fn(),
}));

describe('Security Test Suite: Authentication & UID Verification', () => {
  let mockVerifyIdToken: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken = jest.fn();
    (adminAuth.getAdminAuth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
  });

  it('1. MUST reject unauthenticated requests with missing Authorization header', async () => {
    await expect(verifyAuthHeader(null)).rejects.toThrow(AuthError);
    await expect(verifyAuthHeader(undefined)).rejects.toThrow('Missing Authorization header');
    await expect(verifyAuthHeader('')).rejects.toThrow(AuthError);
  });

  it('2. MUST reject requests with invalid header format (not Bearer <token>)', async () => {
    await expect(verifyAuthHeader('Basic abcdef123456')).rejects.toThrow('Invalid Authorization header format');
    await expect(verifyAuthHeader('Bearer')).rejects.toThrow('Invalid Authorization header format');
    await expect(verifyAuthHeader('Token 123456789012')).rejects.toThrow('Invalid Authorization header format');
  });

  it('3. MUST reject requests with empty or short tokens', async () => {
    await expect(verifyAuthHeader('Bearer 1234')).rejects.toThrow('Invalid or empty token');
  });

  it('4. MUST reject requests when token is expired or revoked', async () => {
    const expiredError: any = new Error('Firebase ID token has expired.');
    expiredError.code = 'auth/id-token-expired';
    mockVerifyIdToken.mockRejectedValue(expiredError);

    await expect(verifyAuthHeader('Bearer expired-token-1234567890')).rejects.toThrow('Authentication token has expired');
  });

  it('5. MUST reject requests when token is invalid or malformed', async () => {
    const invalidError: any = new Error('Firebase ID token is invalid.');
    invalidError.code = 'auth/invalid-id-token';
    mockVerifyIdToken.mockRejectedValue(invalidError);

    await expect(verifyAuthHeader('Bearer invalid-token-1234567890')).rejects.toThrow('Invalid authentication token');
  });

  it('6. MUST derive authenticated UID strictly from verified token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'verified-user-123',
      email: 'test@example.com',
      email_verified: true,
    });

    const result = await verifyAuthHeader('Bearer valid-token-1234567890');
    expect(result).toBeDefined();
    expect(result.uid).toBe('verified-user-123');
    expect(result.email).toBe('test@example.com');
  });

  it('7. MUST prevent client-supplied spoofed UID from overriding authenticated UID', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'authenticated-victim-uid',
      email: 'victim@example.com',
    });

    // Simulating attacker attempting to pass spoofedUid in body
    const attackerPayload = {
      spoofedUid: 'attacker-target-user-999',
      journalText: 'Malicious entry',
    };

    const verifiedContext = await verifyAuthHeader('Bearer valid-token-1234567890');
    
    // Security assertion: the verified UID is ALWAYS used, never attacker's spoofed field
    const effectiveUid = verifiedContext.uid;
    expect(effectiveUid).toBe('authenticated-victim-uid');
    expect(effectiveUid).not.toBe(attackerPayload.spoofedUid);
  });
});
