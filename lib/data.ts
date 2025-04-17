import { promises as fs } from 'fs';
import path from 'path';
import { RedirectEntry } from './redis';

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