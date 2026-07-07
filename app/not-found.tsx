"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SLUG_PATTERN = /^\/[a-z0-9-]+$/i;

export default function NotFound() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const slug = pathname.replace(/^\//, "");

    if (slug && SLUG_PATTERN.test(pathname)) {
      window.location.replace(`/?notFound=${encodeURIComponent(slug)}`);
      return;
    }

    setShowFallback(true);
  }, []);

  if (!showFallback) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-xl text-center p-8">
        <h1 className="text-4xl font-bold mb-4">404 - DevFest Not Found</h1>
        <p className="mb-6">
          We couldn&apos;t find the DevFest you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
