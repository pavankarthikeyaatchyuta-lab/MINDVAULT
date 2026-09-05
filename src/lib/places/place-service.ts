import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import { MapPlaceNode, MapPlaceMemoryRef, MapPlaceJournalRef, LocationPrecision, CoordinateSource } from '@/types';

/**
 * Genuine coordinate database for major recognized tech, cultural, and travel hubs.
 * Maps genuine city-level centroids. Does not invent hyper-precise street coordinates.
 */
export const KNOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  hyderabad: { lat: 17.385, lng: 78.4867 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'mountain view': { lat: 37.3861, lng: -122.0839 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  'new york': { lat: 40.7128, lng: -74.006 },
  boston: { lat: 42.3601, lng: -71.0589 },
  austin: { lat: 30.2672, lng: -97.7431 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  london: { lat: 51.5074, lng: -0.1278 },
  paris: { lat: 48.8566, lng: 2.3522 },
  berlin: { lat: 52.52, lng: 13.405 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  dubai: { lat: 25.2048, lng: 55.2708 },
};

export interface ResolvedPlaceCoordinates {
  latitude: number | null;
  longitude: number | null;
  precision: LocationPrecision;
  coordinateSource: CoordinateSource;
}

/**
 * Resolves coordinates for a location string with strict provenance.
 * 
 * TRUST INVARIANT:
 * - If user supplied explicit numeric coordinates, marks as 'exact' / 'EXPLICIT_COORDINATES'.
 * - If location matches a recognized city database entry, marks as 'city' / 'KNOWN_CITY_DATABASE'.
 * - If location is an unknown or ambiguous name, returns null coordinates ('unresolved' / 'UNRESOLVED').
 * - NEVER derives synthetic or pseudo-random coordinates.
 */
export function resolveCoordinates(
  placeName: string,
  explicitLat?: number,
  explicitLng?: number
): ResolvedPlaceCoordinates {
  if (
    explicitLat !== undefined &&
    explicitLng !== undefined &&
    !isNaN(explicitLat) &&
    !isNaN(explicitLng) &&
    explicitLat >= -90 &&
    explicitLat <= 90 &&
    explicitLng >= -180 &&
    explicitLng <= 180
  ) {
    return {
      latitude: explicitLat,
      longitude: explicitLng,
      precision: 'exact',
      coordinateSource: 'EXPLICIT_COORDINATES',
    };
  }

  const normalized = placeName.trim().toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        precision: 'city',
        coordinateSource: 'KNOWN_CITY_DATABASE',
      };
    }
  }

  // STRICT INTEGRITY: Zero synthetic coordinates
  return {
    latitude: null,
    longitude: null,
    precision: 'unresolved',
    coordinateSource: 'UNRESOLVED',
  };
}

/**
 * Derives a canonical key to cluster venues into their parent known hub when applicable.
 */
export function getCanonicalPlaceKey(placeName: string): { key: string; displayName: string } {
  const normalized = placeName.trim().toLowerCase();
  for (const knownKey of Object.keys(KNOWN_COORDINATES)) {
    if (normalized.includes(knownKey)) {
      const displayName = knownKey.charAt(0).toUpperCase() + knownKey.slice(1);
      return { key: knownKey, displayName };
    }
  }
  return { key: normalized, displayName: placeName.trim() };
}

/**
 * Aggregates all user-owned PLACE memories and journal locations.
 * 
 * STRICT SECURITY & PROVENANCE INVARIANT:
 * - Scoped strictly to `authenticatedUid`.
 * - Preserves provenance and distinction between exact coordinates, city-level hubs,
 *   and unresolved places.
 */
export async function getAggregatedPlacesForUser(
  authenticatedUid: string,
  searchFilter?: string
): Promise<MapPlaceNode[]> {
  const [journals, memories] = await Promise.all([
    JournalRepository.list(authenticatedUid, 100),
    MemoryRepository.list(authenticatedUid),
  ]);

  const placeMap = new Map<string, MapPlaceNode>();

  // 1. Process PLACE category memories
  const placeMemories = memories.filter((m) => m.category === 'PLACE');
  for (const m of placeMemories) {
    const rawName = m.title.replace(/^\[.*?\]\s*/, '').trim();
    const { key, displayName } = getCanonicalPlaceKey(rawName);
    const coords = resolveCoordinates(rawName);

    const memRef: MapPlaceMemoryRef = {
      id: m.id,
      title: m.title,
      description: m.description,
      date: m.sourceDate || m.createdAt,
      sourceJournalId: m.sourceJournalId,
    };

    if (!placeMap.has(key)) {
      placeMap.set(key, {
        id: `place_${encodeURIComponent(key)}`,
        name: displayName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        precision: coords.precision,
        coordinateSource: coords.coordinateSource,
        mentionsCount: 1,
        lastMentioned: memRef.date,
        memories: [memRef],
        journals: [],
      });
    } else {
      const existing = placeMap.get(key)!;
      existing.mentionsCount += 1;
      existing.memories.push(memRef);
      if (new Date(memRef.date).getTime() > new Date(existing.lastMentioned).getTime()) {
        existing.lastMentioned = memRef.date;
      }
      // Upgrade precision if known
      if (existing.precision === 'unresolved' && coords.precision !== 'unresolved') {
        existing.latitude = coords.latitude;
        existing.longitude = coords.longitude;
        existing.precision = coords.precision;
        existing.coordinateSource = coords.coordinateSource;
      }
    }
  }

  // 2. Process Journal location attachments
  for (const j of journals) {
    if (j.location && j.location.name) {
      const rawName = j.location.name.trim();
      const { key, displayName } = getCanonicalPlaceKey(rawName);
      const coords = resolveCoordinates(rawName, j.location.latitude, j.location.longitude);

      const jRef: MapPlaceJournalRef = {
        id: j.id,
        title: j.title || 'Untitled Journal',
        date: j.createdAt,
      };

      if (!placeMap.has(key)) {
        placeMap.set(key, {
          id: `place_${encodeURIComponent(key)}`,
          name: displayName,
          latitude: coords.latitude,
          longitude: coords.longitude,
          precision: coords.precision,
          coordinateSource: coords.coordinateSource,
          mentionsCount: 1,
          lastMentioned: j.createdAt,
          memories: [],
          journals: [jRef],
        });
      } else {
        const existing = placeMap.get(key)!;
        existing.mentionsCount += 1;
        if (!existing.journals.some((entry) => entry.id === j.id)) {
          existing.journals.push(jRef);
        }
        if (new Date(j.createdAt).getTime() > new Date(existing.lastMentioned).getTime()) {
          existing.lastMentioned = j.createdAt;
        }
        // Upgrade precision if exact
        if (coords.precision === 'exact') {
          existing.latitude = coords.latitude;
          existing.longitude = coords.longitude;
          existing.precision = 'exact';
          existing.coordinateSource = 'EXPLICIT_COORDINATES';
        }
      }
    }
  }

  // 3. Process recognized city hubs mentioned in Journal content/title
  for (const j of journals) {
    const text = `${j.title || ''} ${j.summary || ''} ${j.content || ''}`.toLowerCase();
    for (const [knownKey, coords] of Object.entries(KNOWN_COORDINATES)) {
      if (text.includes(knownKey)) {
        const { key, displayName } = getCanonicalPlaceKey(knownKey);
        const jRef: MapPlaceJournalRef = {
          id: j.id,
          title: j.title || 'Journal Entry',
          date: j.createdAt,
        };

        if (!placeMap.has(key)) {
          placeMap.set(key, {
            id: `place_${encodeURIComponent(key)}`,
            name: displayName,
            latitude: coords.lat,
            longitude: coords.lng,
            precision: 'city',
            coordinateSource: 'KNOWN_CITY_DATABASE',
            mentionsCount: 1,
            lastMentioned: j.createdAt,
            memories: [],
            journals: [jRef],
          });
        } else {
          const existing = placeMap.get(key)!;
          if (!existing.journals.some((entry) => entry.id === j.id)) {
            existing.journals.push(jRef);
            existing.mentionsCount += 1;
            if (new Date(j.createdAt).getTime() > new Date(existing.lastMentioned).getTime()) {
              existing.lastMentioned = j.createdAt;
            }
          }
        }
      }
    }
  }

  let results = Array.from(placeMap.values());

  // Optional search filtering
  if (searchFilter && searchFilter.trim()) {
    const q = searchFilter.trim().toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q));
  }

  // Sort by mention frequency descending
  results.sort((a, b) => b.mentionsCount - a.mentionsCount);

  return results;
}
