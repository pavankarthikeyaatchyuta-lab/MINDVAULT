import { GET } from '@/app/api/map/places/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';
import * as placeService from '@/lib/places/place-service';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';

describe('Security Test Suite: Stage 4 Memory Map', () => {
  it('1. MUST reject unauthenticated requests to /api/map/places', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/map/places');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST deterministically resolve coordinates for known hubs', () => {
    const hyd = placeService.resolveCoordinates('Hyderabad');
    expect(hyd.lat).toBeCloseTo(17.385, 2);
    expect(hyd.lng).toBeCloseTo(78.4867, 2);

    const blr = placeService.resolveCoordinates('Bengaluru Office');
    expect(blr.lat).toBeCloseTo(12.9716, 2);
    expect(blr.lng).toBeCloseTo(77.5946, 2);

    const sf = placeService.resolveCoordinates('San Francisco HQ');
    expect(sf.lat).toBeCloseTo(37.7749, 2);
    expect(sf.lng).toBeCloseTo(-122.4194, 2);
  });

  it('3. MUST derive stable coordinates for arbitrary user-named places', () => {
    const coords1 = placeService.resolveCoordinates('Cozy Library Cafe');
    const coords2 = placeService.resolveCoordinates('Cozy Library Cafe');
    expect(coords1.lat).toBe(coords2.lat);
    expect(coords1.lng).toBe(coords2.lng);
  });

  it('4. MUST scope map place aggregation strictly by authenticated UID', async () => {
    const mockUid = 'test-map-user-uid';
    jest.spyOn(authMiddleware, 'authenticateRequest').mockResolvedValue({
      uid: mockUid,
      email: 'user@example.com',
      emailVerified: true,
    });

    const journalListSpy = jest.spyOn(JournalRepository, 'list').mockResolvedValue([]);
    const memoryListSpy = jest.spyOn(MemoryRepository, 'list').mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/map/places', {
      headers: { Authorization: 'Bearer valid.jwt.token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(journalListSpy).toHaveBeenCalledWith(mockUid, 100);
    expect(memoryListSpy).toHaveBeenCalledWith(mockUid);
  });

  it('5. MUST aggregate multiple memories and journals under the same location', async () => {
    const mockUid = 'test-map-user-uid-2';

    jest.spyOn(JournalRepository, 'list').mockResolvedValue([
      {
        id: 'j_hyd_1',
        uid: mockUid,
        title: 'Arrived in Hyderabad',
        content: 'Settled into the city.',
        messages: [],
        location: { name: 'Hyderabad' },
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ]);

    jest.spyOn(MemoryRepository, 'list').mockResolvedValue([
      {
        id: 'm_hyd_1',
        uid: mockUid,
        category: 'PLACE',
        title: 'Hyderabad Tech Park',
        description: 'Visited the tech center.',
        sourceJournalId: 'j_hyd_1',
        sourceDate: '2026-08-02T10:00:00Z',
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      },
    ]);

    const places = await placeService.getAggregatedPlacesForUser(mockUid);
    expect(places.length).toBe(1);
    expect(places[0].name.toLowerCase()).toContain('hyderabad');
    expect(places[0].mentionsCount).toBe(2);
    expect(places[0].memories.length).toBe(1);
    expect(places[0].journals.length).toBe(1);
  });
});
