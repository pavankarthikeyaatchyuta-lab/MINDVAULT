import { ChatRequestSchema, JournalMessageSchema } from '@/lib/validation/schemas';
import { POST } from '@/app/api/journal/chat/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';

describe('Security Test Suite: Stage 2 Chat Input Validation & Auth', () => {
  it('1. MUST reject oversized message content (> 4000 characters)', () => {
    const hugeContent = 'a'.repeat(4001);
    const result = JournalMessageSchema.safeParse({
      role: 'user',
      content: hugeContent,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Message exceeds maximum length');
    }
  });

  it('2. MUST reject empty message content', () => {
    const result = JournalMessageSchema.safeParse({
      role: 'user',
      content: '',
    });

    expect(result.success).toBe(false);
  });

  it('3. MUST reject oversized conversation history (> 50 messages)', () => {
    const manyMessages = Array.from({ length: 51 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }));

    const result = ChatRequestSchema.safeParse({
      messages: manyMessages,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Conversation history exceeds maximum turn limit');
    }
  });

  it('4. MUST reject unauthenticated chat requests at the API route layer', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/journal/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
