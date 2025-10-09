import { promises as fs } from 'fs';
import path from 'path';

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

export async function getAllRedirects(): Promise<RedirectEntry[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'devfest-data.json');
    const jsonData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading devfest-data.json:', error);
    return [];
  }
} 