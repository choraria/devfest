import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';
import { RedirectEntry } from "@/lib/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Set revalidation period to 1 hour
export const revalidate = 3600;

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  if (!slug) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  try {
    // Try to get the redirect entry from Redis using just the slug as key
    const redirectEntry = await redis.get<RedirectEntry>(slug);
    
    // If entry exists, redirect to the destination URL
    if (redirectEntry && redirectEntry.destinationUrl) {
      return NextResponse.redirect(redirectEntry.destinationUrl, { 
        status: 302,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    } else {
      // For API routes, return a 404 JSON response first
      // Then return the redirect to home with the notFound parameter
      return NextResponse.redirect(new URL(`/?notFound=${slug}`, request.url), {
        status: 302,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
    return NextResponse.redirect(new URL('/?error=true', request.url));
  }
} 