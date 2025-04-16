'use client';

import DevfestDirectory from "@/components/DevfestDirectory";
import DevfestMap from "@/components/DevfestMap";
import { RedirectEntry } from "@/lib/redis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Table2, SearchCode } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotFound } from "@/components/NotFound";

interface HomePageProps {
  redirects: RedirectEntry[];
  notFound?: string;
  error?: string;
}

export function HomePage({ redirects, notFound, error }: HomePageProps) {
  return (
    <div className="container mx-auto px-4 pt-4 pb-8">
      <div className="max-w-5xl mx-auto relative">
        {/* Theme toggle in top-right corner of the container */}
        <div className="absolute top-0 right-0 z-50">
          <ThemeToggle />
        </div>
        
        {/* Header with logo and title */}
        <div className="flex items-center justify-between mb-2 md:mb-0">
          <div className="flex items-center gap-2">
            <SearchCode className="h-8 w-8 dark:text-white" />
            <h1 className="text-2xl font-bold">DevFest Finder</h1>
          </div>
          <ThemeToggle />
        </div>
        
        <NotFound notFound={notFound} error={error} />
        
        <Tabs defaultValue="map" className="mx-auto">
          <div className="flex justify-center mb-3">
            <TabsList>
              <TabsTrigger value="map" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center">
                <Table2 className="mr-2 h-4 w-4" />
                Table View
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="map" className="mt-0">
            <DevfestMap redirects={redirects} />
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <DevfestDirectory redirects={redirects} initialFilter={notFound} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          Maintained by <a href="https://x.com/choraria" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@choraria</a>
        </div>
      </div>
    </div>
  );
} 