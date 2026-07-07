export type RedirectEntry = {
  destinationUrl: string;
  devfestDate: string;
  devfestName: string;
  updatedBy: string;
  updatedAt: string;
  slug?: string;
  gdgChapter?: string;
  city?: string;
  countryName?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  gdgUrl?: string;
};

const GITHUB_DATA_URL =
  "https://cdn.jsdelivr.net/gh/choraria/devfest@main/data/devfest-data.json";

export async function fetchRedirects(): Promise<RedirectEntry[]> {
  const sources = ["/devfest-data.json", GITHUB_DATA_URL];

  for (const url of sources) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data)) return data;
    } catch {
      // try next source
    }
  }

  throw new Error("Failed to load DevFest data");
}
