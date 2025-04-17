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
export async function getAllRedirects(): Promise<RedirectEntry[]> {
  try {
    // Get all keys at once - for our use case with ~1500 records, this is acceptable
    const keys = await redis.keys('*');
    
    if (!keys.length) return [];
    
    // Use pipeline to fetch all values in a single round trip
    const pipeline = redis.pipeline();
    keys.forEach(key => {
      pipeline.get(key);
    });
    
    const results = await pipeline.exec();
    
    // Process results and filter invalid entries
    const redirects = results
      .map((result, index) => {
        if (!result) return null;
        try {
          const data = typeof result === 'string' ? JSON.parse(result) : result;
          if (data && data.destinationUrl && data.devfestDate) {
            return {
              ...data,
              slug: data.slug || keys[index] // Use key as slug if not present
            };
          }
        } catch (e) {
          console.error('Error parsing redirect data:', e);
        }
        return null;
      })
      .filter(Boolean) as RedirectEntry[];
    
    return redirects;
  } catch (error) {
    console.error('Error fetching all redirects:', error);
    return [];
  }
}

// Helper function to set a redirect entry
export async function setRedirect(entry: RedirectEntry & { slug: string }) {
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
  destinationUrl: string;
  devfestDate: string;
  devfestName: string;
  updatedBy: string;
  updatedAt: string;
  
  // Optional fields
  slug?: string;
  gdgChapter?: string;
  city?: string;
  countryName?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  gdgUrl?: string;
}; 