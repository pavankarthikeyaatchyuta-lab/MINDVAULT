import { GET } from '@/app/api/health/route';

describe('Unit Test: /api/health Endpoint', () => {
  it('MUST return healthy status with timestamp and runtime metadata', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('mindvault-api');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBe('1.0.0');
    expect(data.runtime).toBeDefined();
    expect(data.runtime.node).toBeDefined();
  });
});
