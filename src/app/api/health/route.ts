import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'mindvault-api',
    timestamp: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
    },
    version: '1.0.0',
  });
}
