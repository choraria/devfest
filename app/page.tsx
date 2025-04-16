import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DevfestDirectory from "@/components/DevfestDirectory";
import DevfestMap from "@/components/DevfestMap";
import { sampleData } from "@/data/devfest-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Table2, SearchCode } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ notFound?: string; error?: string }> }) {
  const { notFound, error } = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto relative">
        {/* Theme toggle in top-right corner of the container */}
        <div className="absolute top-0 right-0 z-50">
          <ThemeToggle />
        </div>
        
        {/* Header with logo and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SearchCode className="h-8 w-8 dark:text-white" />
            <h1 className="text-2xl font-bold">DevFest Finder</h1>
          </div>
          <ThemeToggle />
        </div>
        
        {notFound && (
          <Alert className="mb-8 mx-auto">
            <AlertTitle>DevFest not found</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find a DevFest for &quot;{notFound}&quot;. Please try another city or browse the directory below.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="mb-8 mx-auto" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              An error occurred while processing your request. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="map" className="mx-auto">
          <div className="flex justify-center mb-6">
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
            <DevfestMap redirects={sampleData} />
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <DevfestDirectory redirects={sampleData} initialFilter={notFound} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
