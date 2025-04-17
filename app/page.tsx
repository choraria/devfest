import { HomePage } from "@/components/HomePage";
import { getAllRedirects } from "@/lib/data";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

/* 
 * In Next.js 15, searchParams is a Promise that needs to be awaited 
 * before accessing its properties.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Need to await searchParams before accessing its properties
  const params = await searchParams || {};
  
  // Extract and process query parameters safely after awaiting
  const notFoundParam = params.notFound;
  const errorParam = params.error;
  
  // Convert to the expected types
  const notFound = typeof notFoundParam === 'string' ? notFoundParam : undefined;
  const error = typeof errorParam === 'string' ? errorParam : undefined;

  // Fetch redirects from JSON file
  const redirects = await getAllRedirects();
  
  return <HomePage redirects={redirects} notFound={notFound} error={error} />;
}
