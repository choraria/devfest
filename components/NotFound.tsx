'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export function NotFound({ notFound, error }: { notFound?: string; error?: string }) {
  // Get search params directly from URL
  const searchParams = useSearchParams();
  
  // Extract parameters directly from the URL to ensure they're always fresh
  const notFoundParam = searchParams.get('notFound');
  const errorParam = searchParams.get('error');

  // Use the params from URL or the props
  const finalNotFound = notFoundParam || notFound;
  const finalError = errorParam || error;

  // Show toast on initial mount only with the correct dependencies
  useEffect(() => {
    if (finalNotFound && finalNotFound.trim() !== '') {
      console.log('Showing not found toast for:', finalNotFound);
      
      // Use setTimeout to ensure the toast is shown after hydration
      const timer = setTimeout(() => {
        toast.error(
          `We couldn't find a DevFest for "${finalNotFound}". Please try another city or browse the directory.`,
          {
            duration: 5000,
            className: 'error-toast',
          }
        );
      }, 100);
      
      // Clean up timeout
      return () => clearTimeout(timer);
    }
    
    if (finalError) {
      console.log('Showing error toast');
      
      // Use setTimeout to ensure the toast is shown after hydration
      const timer = setTimeout(() => {
        toast.error('An error occurred while processing your request. Please try again.', {
          duration: 5000,
          className: 'error-toast',
        });
      }, 100);
      
      // Clean up timeout
      return () => clearTimeout(timer);
    }
  }, [finalNotFound, finalError]);

  return null;
} 