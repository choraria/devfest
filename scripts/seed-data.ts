import { Redis } from '@upstash/redis';
import { RedirectEntry } from '../lib/redis';
import dotenv from 'dotenv';
import { sampleData as devfestData } from '../data/devfest-data';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function seedData() {
  try {
    for (const entry of devfestData) {
      const { slug, ...filteredEntry } = entry;
      
      // Skip entries without a slug
      if (!slug) {
        console.warn('Skipping entry without slug:', entry);
        continue;
      }
      
      await redis.set(slug, JSON.stringify(filteredEntry));
      console.log(`Seeded data for ${slug}`);
    }
    console.log('Data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedData(); 