import { Redis } from '@upstash/redis';

// Initialize Redis client with environment variables
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Helper function to get a redirect entry by slug
export async function getRedirectBySlug(slug: string) {
  try {
    const data = await redis.get<RedirectEntry>(slug);
    return data;
  } catch (error) {
    console.error(`Error fetching redirect for slug ${slug}:`, error);
    return null;
  }
}

// Helper function to get all redirect entries
export async function getAllRedirects() {
  try {
    // Get all keys matching the pattern - use a different way to identify redirect entries
    const keys = await redis.keys('*');
    
    if (!keys.length) return [];
    
    // Get all values for the keys
    const redirects = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get<RedirectEntry>(key);
        // Filter to only include RedirectEntry objects by checking for required fields
        if (data && data.slug && data.destinationUrl) {
          return data;
        }
        return null;
      })
    );
    
    return redirects.filter(Boolean) as RedirectEntry[];
  } catch (error) {
    console.error('Error fetching all redirects:', error);
    return [];
  }
}

// Helper function to set a redirect entry
export async function setRedirect(entry: RedirectEntry) {
  try {
    await redis.set(entry.slug, entry);
    return true;
  } catch (error) {
    console.error(`Error setting redirect for slug ${entry.slug}:`, error);
    return false;
  }
}

// RedirectEntry type definition
export type RedirectEntry = {
  // Required fields
  slug: string;
  destinationUrl: string;
  devfestDate: string;
  
  // Optional fields
  devfestName?: string;
  gdgChapter?: string;
  city?: string;
  countryName?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  gdgUrl?: string;
  updatedBy?: string;
  updatedAt?: string;
}; 