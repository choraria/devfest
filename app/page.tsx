import { Suspense } from "react";
import { HomePageLoader } from "@/components/HomePageLoader";
import { Loader2 } from "lucide-react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <HomePageLoader />
    </Suspense>
  );
}
