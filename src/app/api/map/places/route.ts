import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth-middleware';
import { MapPlacesQuerySchema } from '@/lib/validation/schemas';
import { getAggregatedPlacesForUser } from '@/lib/places/place-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await authenticateRequest(req);
    const authenticatedUid = authContext.uid;

    const url = new URL(req.url);
    const queryParam = url.searchParams.get('query') || undefined;

    const parseResult = MapPlacesQuerySchema.safeParse({ query: queryParam });
    const query = parseResult.success ? parseResult.data.query : undefined;

    const places = await getAggregatedPlacesForUser(authenticatedUid, query);

    return NextResponse.json({
      success: true,
      data: {
        places,
        totalPlaces: places.length,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
