import { notFound } from 'next/navigation';

// This page handles any dynamic routes that don't have a route handler
// It will return a 404 status for proper SEO
export default function CatchAllSlugPage() {
  // This forces Next.js to render the 404 page with proper status
  notFound();
} 