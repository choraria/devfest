import { NextResponse } from "next/server";
import { getAllRedirects } from "@/lib/data";

// Cache the response for 1 hour, but allow background revalidation
export const revalidate = 3600;

export async function GET() {
  try {
    const redirects = await getAllRedirects();
    
    return NextResponse.json(redirects, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirects' },
      { status: 500 }
    );
  }
} 