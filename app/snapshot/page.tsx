"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function SnapshotPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SnapshotContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin inline-block mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <p className="text-xl text-gray-600">Loading snapshot...</p>
      </div>
    </div>
  );
}

function SnapshotContent() {
  const [snapshotContent, setSnapshotContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const htmlUrl = searchParams.get('url');

  useEffect(() => {
    // Ensure this runs only on the client side
    if (typeof window === 'undefined') return;

    const fetchFullPageContent = async () => {
      if (!htmlUrl) {
        setError('No URL provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(htmlUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const htmlContent = await response.text();
        
        // Basic sanitization and error prevention
        const sanitizedHtml = sanitizeHtml(htmlContent);
        
        setSnapshotContent(sanitizedHtml);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching full page content:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    fetchFullPageContent();
  }, [htmlUrl]);

  // HTML sanitization function
  const sanitizeHtml = (html: string): string => {
    try {
      // Remove potentially problematic scripts
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove inline event handlers
      html = html.replace(/on\w+="[^"]*"/gi, '');
      
      // Replace problematic image sources
      html = html.replace(
        /src=["'](https:\/\/lookaside\.instagram\.com\/seo\/google_widget\/crawler\/\?media_id=[^"']+)["']/g, 
        'src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+"'
      );
      
      return html;
    } catch (error) {
      console.error('HTML sanitization error:', error);
      return '<div>Error processing page content</div>';
    }
  };

  // Client-side rendering logic
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Snapshot Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!snapshotContent) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-gray-600">No snapshot found</p>
      </div>
    );
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: snapshotContent }}
      className="w-full min-h-screen"
    />
  );
}