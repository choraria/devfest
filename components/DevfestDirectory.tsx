"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RedirectEntry } from "@/lib/data";
import { Copy, Github, Check, ArrowUpDown } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface DevfestDirectoryProps {
  redirects: RedirectEntry[];
  initialFilter?: string;
}

// Declare gtag function
declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      params: { [key: string]: string | number | boolean | object | undefined }
    ) => void;
  }
}

const getCountryFlag = (countryCode: string | undefined) => {
  if (!countryCode) return '';
  // Convert country code to uppercase to ensure proper flag display
  const code = countryCode.toUpperCase();
  // Return regional indicator symbols that will be rendered as a flag
  return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
};

// Format date to "21 October 2023" format
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    // If the date string is already formatted or invalid, return as is
    return dateString;
  }
};

export default function DevfestDirectory({ redirects, initialFilter = "" }: DevfestDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilter);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [filteredRedirects, setFilteredRedirects] = useState<RedirectEntry[]>(redirects);
  const [copyingSlug, setCopyingSlug] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Get unique countries for the dropdown
  const countryOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Countries' },
      ...Array.from(new Set(redirects.map(r => r.countryName || '').filter(Boolean)))
        .sort()
        .map(country => ({ value: country, label: country }))
    ];
  }, [redirects]);
  
  // Update searchQuery if initialFilter changes
  useEffect(() => {
    if (initialFilter) {
      setSearchQuery(initialFilter);
    }
  }, [initialFilter]);
  
  // Filter and sort redirects based on search query, selected country, and sort config
  useEffect(() => {
    let results = redirects;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        redirect => 
          (redirect.city && redirect.city.toLowerCase().includes(query)) ||
          (redirect.gdgChapter && redirect.gdgChapter.toLowerCase().includes(query)) ||
          (redirect.devfestName && redirect.devfestName.toLowerCase().includes(query)) ||
          (redirect.slug && redirect.slug.toLowerCase().includes(query)) ||
          (redirect.countryName && redirect.countryName.toLowerCase().includes(query))
      );
    }
    
    if (selectedCountry) {
      results = results.filter(redirect => redirect.countryName === selectedCountry);
    }

    if (sortConfig) {
      results = [...results].sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = new Date(a.devfestDate || '').getTime();
          const dateB = new Date(b.devfestDate || '').getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'location') {
          const locationA = (a.city || '').toLowerCase();
          const locationB = (b.city || '').toLowerCase();
          return sortConfig.direction === 'asc' ? 
            locationA.localeCompare(locationB) : 
            locationB.localeCompare(locationA);
        }
        return 0;
      });
    }
    
    setFilteredRedirects(results);
  }, [searchQuery, selectedCountry, redirects, sortConfig]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };
  
  // Handle copying the URL to clipboard
  const handleCopyLink = async (slug: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    if (!slug) return;
    
    const baseUrl = typeof window !== 'undefined' ? 
      window.location.origin : 
      (process.env.NEXT_PUBLIC_SITE_URL || 'https://devfe.st');
    const url = `${baseUrl}/${slug}`;
    
    // Remove "https://" from the URL for copying
    const urlToCopy = url.replace(/^https?:\/\//, '');
    
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopyingSlug(slug);
      // Remove toast notification
      setTimeout(() => setCopyingSlug(null), 1000);
      
      // Track URL copy
      window.gtag?.('event', 'copy_devfest_url', {
        slug: slug,
        url: url
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle opening GitHub issue for URL update
  const handleUpdateUrl = (redirect: RedirectEntry) => {
    const title = encodeURIComponent(`Update DevFest details: ${redirect.city || redirect.slug} (slug: ${redirect.slug})`);
    const url = `https://github.com/choraria/devfest/issues/new?assignees=&labels=update-url&template=update-url.yml&title=${title}`;
    window.open(url, '_blank');
    
    // Track GitHub issue creation
    window.gtag?.('event', 'create_github_issue', {
      slug: redirect.slug,
      city: redirect.city,
      country: redirect.countryName
    });
  };

  // Track country filter changes
  const handleCountryChange = (value: string) => {
    const country = value === 'all' ? '' : value;
    setSelectedCountry(country);
    window.gtag?.('event', 'filter_by_country', {
      country: country || 'all'
    });
  };

  // Track search queries
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      window.gtag?.('event', 'search_devfests', {
        search_term: query
      });
    }
  };
  
  return (
    <div className="mb-12">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="w-full md:w-[350px]">
              <Input
                type="search"
                placeholder="Search DevFests by city, country, GDG chapter..."
                value={searchQuery}
                onChange={(e) => handleSearch(e)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-[200px] md:ml-auto">
              <Combobox
                options={countryOptions}
                value={selectedCountry || 'all'}
                onValueChange={handleCountryChange}
                placeholder="All Countries"
                searchPlaceholder="Search countries..."
                emptyText="No countries found."
              />
            </div>
          </div>
        </div>
      
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  onClick={() => handleSort('date')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead>DevFest</TableHead>
                <TableHead>GDG Chapter</TableHead>
                <TableHead 
                  onClick={() => handleSort('location')}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  Location <ArrowUpDown className="inline h-4 w-4 ml-1" />
                </TableHead>
                <TableHead className="text-right pl-0">Link</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRedirects.length > 0 ? (
                filteredRedirects.map((redirect) => {
                  const devfestName = redirect.devfestName || `DevFest ${redirect.city || redirect.slug}`;
                  
                  return (
                  <TableRow key={redirect.slug}>
                    <TableCell>{formatDate(redirect.devfestDate)}</TableCell>
                    <TableCell className="font-medium">
                      <div 
                        className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                        title={devfestName.length > 25 ? devfestName : undefined}
                      >
                        {devfestName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {redirect.gdgChapter ? (
                        redirect.gdgUrl ? (
                          <a 
                            href={redirect.gdgUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap inline-block text-inherit"
                            title={redirect.gdgChapter.length > 15 ? redirect.gdgChapter : undefined}
                          >
                            {redirect.gdgChapter}
                          </a>
                        ) : (
                          <div 
                            className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                            title={redirect.gdgChapter.length > 15 ? redirect.gdgChapter : undefined}
                          >
                            {redirect.gdgChapter}
                          </div>
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="pr-0">
                      <div className="flex items-center">
                        <div 
                          className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                          title={redirect.city && redirect.city.length > 15 ? redirect.city : undefined}
                        >
                          {redirect.city || ''}
                        </div>
                        {redirect.countryCode && (
                          <span className="ml-1 flex-shrink-0" title={redirect.countryName}>
                            {getCountryFlag(redirect.countryCode)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pl-0">
                      <button
                        onClick={() => window.open(redirect.destinationUrl, '_blank')}
                        className="hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
                      >
                        devfe.st/{redirect.slug}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => handleCopyLink(redirect.slug, e)}
                          title="Copy URL"
                          disabled={!redirect.slug}
                        >
                          {copyingSlug === redirect.slug ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleUpdateUrl(redirect)}
                          title="Update URL"
                          className="flex items-center dark:bg-white dark:text-black bg-black hover:bg-black/90 dark:hover:bg-white/90"
                        >
                          <Github className="h-4 w-4 mr-1" /> Update URL
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No DevFest events found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 