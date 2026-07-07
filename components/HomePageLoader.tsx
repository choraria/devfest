"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { fetchRedirects, RedirectEntry } from "@/lib/data";
import { Loader2 } from "lucide-react";

function HomePageContent() {
  const searchParams = useSearchParams();
  const notFound = searchParams.get("notFound") ?? undefined;
  const error = searchParams.get("error") ?? undefined;

  const [redirects, setRedirects] = useState<RedirectEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchRedirects()
      .then(setRedirects)
      .catch(() => setLoadError("true"));
  }, []);

  if (loadError) {
    return <HomePage redirects={[]} error={loadError} />;
  }

  if (!redirects) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <HomePage redirects={redirects} notFound={notFound} error={error} />
  );
}

export function HomePageLoader() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
