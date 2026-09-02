import { GET } from '@/app/api/map/places/route';
import { NextRequest } from 'next/server';
import * as authMiddleware from '@/lib/security/auth-middleware';
import * as placeService from '@/lib/places/place-service';
import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';

describe('Security Test Suite: Stage 5 Memory Map Trust & Provenance', () => {
  it('1. MUST reject unauthenticated requests to /api/map/places', async () => {
    jest.spyOn(authMiddleware, 'authenticateRequest').mockRejectedValue(
      new authMiddleware.AuthError('Missing Authorization header. Authentication required.', 401)
    );

    const req = new NextRequest('http://localhost:3000/api/map/places');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('2. MUST deterministically resolve coordinates for recognized hubs with city-level precision', () => {
    const hyd = placeService.resolveCoordinates('Hyderabad');
    expect(hyd.latitude).toBeCloseTo(17.385, 2);
    expect(hyd.longitude).toBeCloseTo(78.4867, 2);
    expect(hyd.precision).toBe('city');
    expect(hyd.coordinateSource).toBe('KNOWN_CITY_DATABASE');

    const blr = placeService.resolveCoordinates('Bengaluru Office');
    expect(blr.latitude).toBeCloseTo(12.9716, 2);
    expect(blr.longitude).toBeCloseTo(77.5946, 2);
    expect(blr.precision).toBe('city');

    const sf = placeService.resolveCoordinates('San Francisco HQ');
    expect(sf.latitude).toBeCloseTo(37.7749, 2);
    expect(sf.longitude).toBeCloseTo(-122.4194, 2);
    expect(sf.precision).toBe('city');
  });

  it('3. MUST preserve exact-level precision when explicit valid coordinates are provided', () => {
    const exact = placeService.resolveCoordinates('Custom Research Center', 37.422, -122.084);
    expect(exact.latitude).toBe(37.422);
    expect(exact.longitude).toBe(-122.084);
    expect(exact.precision).toBe('exact');
    expect(exact.coordinateSource).toBe('EXPLICIT_COORDINATES');
  });

  it('4. MUST NEVER fabricate synthetic coordinates for arbitrary or unknown user-named places', () => {
    const unknownCafe = placeService.resolveCoordinates('Cozy Library Cafe');
    expect(unknownCafe.latitude).toBeNull();
    expect(unknownCafe.longitude).toBeNull();
    expect(unknownCafe.precision).toBe('unresolved');
    expect(unknownCafe.coordinateSource).toBe('UNRESOLVED');

    const unknownRooftop = placeService.resolveCoordinates('Rooftop Sunset Terrace');
    expect(unknownRooftop.latitude).toBeNull();
    expect(unknownRooftop.longitude).toBeNull();
    expect(unknownRooftop.precision).toBe('unresolved');
    expect(unknownRooftop.coordinateSource).toBe('UNRESOLVED');
  });

  it('5. MUST reject invalid out-of-range coordinates without throwing or fabricating', () => {
    const outOfRange = placeService.resolveCoordinates('Broken GPS Pin', 999, 999);
    expect(outOfRange.latitude).toBeNull();
    expect(outOfRange.longitude).toBeNull();
    expect(outOfRange.precision).toBe('unresolved');
  });

  it('6. MUST scope map place aggregation strictly by authenticated UID', async () => {
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

  it('7. MUST aggregate multiple memories and journals under the same canonical location and maintain provenance', async () => {
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
    expect(places[0].name).toBe('Hyderabad');
    expect(places[0].mentionsCount).toBe(2);
    expect(places[0].precision).toBe('city');
    expect(places[0].coordinateSource).toBe('KNOWN_CITY_DATABASE');
    expect(places[0].memories.length).toBe(1);
    expect(places[0].journals.length).toBe(1);
  });
});
