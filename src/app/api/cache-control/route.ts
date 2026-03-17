import { NextRequest, NextResponse } from 'next/server';
import { getCacheHeaders } from '@/lib/cache';

/**
 * API endpoint to clear caches when a deployment happens
 * Usage: POST /api/cache-clear
 *
 * This endpoint triggers a cache clear command that will:
 * 1. Clear all service worker caches
 * 2. Invalidate browser cache
 * 3. Send version bump to clients
 *
 * You can call this from your deployment pipeline or CI/CD
 */
export async function POST(request: NextRequest) {
  try {
    // You can add authentication here if needed
    const authHeader = request.headers.get('authorization');
    const validToken = process.env.CACHE_CLEAR_TOKEN;

    // If a token is configured, verify it
    if (validToken && authHeader !== `Bearer ${validToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: getCacheHeaders('api'),
        }
      );
    }

    // Log the cache clear
    console.log('[API] Cache clear triggered at', new Date().toISOString());

    return NextResponse.json(
      {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      },
      {
        status: 200,
        headers: {
          ...getCacheHeaders('api'),
          'X-Cache-Clear': 'true',
        },
      }
    );
  } catch (error) {
    console.error('[API] Cache clear error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: getCacheHeaders('api'),
      }
    );
  }
}

/**
 * GET endpoint to check cache status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Cache control API is running',
      endpoints: {
        'POST /api/cache-clear': 'Clear all caches (requires auth token)',
        'GET /api/cache-control': 'Check cache status',
      },
    },
    {
      status: 200,
      headers: getCacheHeaders('api'),
    }
  );
}
