"use client";

import React, { useEffect, useState, useRef, memo } from 'react';
import Image from 'next/image';
import { 
  Star, 
  Loader2, 
  ChevronRight,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { searchApps } from '@/app/api/playstoreAnalyticsApi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from "@/app/components/ui/skeleton";
import AppAnalysis from '@/app/components/PlayStoreAnalysis';
import type { AppBasic } from '@/app/api/playstoreAnalyticsApi';

// Error state interface
interface ErrorState {
  message: string;
  code: string;
}

// Props interface for the component
interface AppSelectionProps {
  query: string;
}

// Format rating to display stars
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < fullStars 
              ? 'text-yellow-400 fill-yellow-400' 
              : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400 opacity-50'
                : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

// AppCard component with larger icons
const AppCard = memo(({ 
  app, 
  isSelected, 
  onClick 
}: { 
  app: AppBasic, 
  isSelected: boolean,
  onClick: () => void
}) => (
  <Card
    className={`app-card flex-shrink-0 w-72 cursor-pointer snap-start transition-all hover:shadow-lg
      ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={app.app_icon}
            alt={app.app_name}
            fill
            sizes="(max-width: 768px) 96px, 96px"
            className="object-cover rounded-lg"
          />
        </div>
        <div className="flex-1 text-center min-w-0">
          <h3 className="font-semibold line-clamp-2">{app.app_name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{app.app_id}</p>
        </div>
      </div>
    </CardContent>
  </Card>
));
AppCard.displayName = 'AppCard';

// Main App Selection component
const AppSelection: React.FC<AppSelectionProps> = ({ query }) => {
  const [apps, setApps] = useState<AppBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [appSelectionComplete, setAppSelectionComplete] = useState<boolean>(false);
  
  // Scrolling state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  
  // Refs for scrolling
  const appsSliderRef = useRef<HTMLDivElement>(null);
  
  // Scrolling handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!appsSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - appsSliderRef.current.offsetLeft);
    setScrollLeft(appsSliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!appsSliderRef.current) return;
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - appsSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      appsSliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Handle app selection
  const handleAppSelect = (appId: string) => {
    if (appId === selectedApp && appSelectionComplete) return;
    setSelectedApp(appId);
  };
  
  // Handle proceeding to analysis after app selection
  const handleProceedToAnalysis = async () => {
    if (!selectedApp) return;
    setAppSelectionComplete(true);
  };
  
  // Handle going back to app selection
  const handleBackToSelection = () => {
    setAppSelectionComplete(false);
  };

  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedApp(null);
        setAppSelectionComplete(false);
        
        const appData = await searchApps(query);
        setApps(appData);
        
        if (appData.length > 0) {
          setSelectedApp(appData[0].app_id);
        }
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch data',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchData();
    }
  }, [query]);

  // Scroll to left and right buttons for app slider
  const scrollLeft20 = () => {
    if (appsSliderRef.current) {
      appsSliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight20 = () => {
    if (appsSliderRef.current) {
      appsSliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Render loading state
  if (loading && !apps.length) {
    return (
      <div className="app-analytics-container space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">App Analytics</h2>
          <p className="text-sm text-muted-foreground">Searching for &quot;{query}&quot;...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If app analysis is selected, show the Analysis component
  if (appSelectionComplete && selectedApp) {
    return (
      <AppAnalysis 
        appId={selectedApp} 
        appName={apps.find(app => app.app_id === selectedApp)?.app_name || ''} 
        onBackToSelection={handleBackToSelection} 
      />
    );
  }

  // Otherwise show the selection UI
  return (
    <div className="app-analytics-container space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">App Analytics</h2>
        <p className="text-sm text-muted-foreground">Results for &quot;{query}&quot;</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error.message}</p>
        </div>
      )}

      <div className="mb-2">
        <h3 className="text-lg font-semibold mb-2">Select an app to analyze</h3>
        <p className="text-muted-foreground text-sm">
        Choose an app below to analyze its reviews and get comprehensive insights.
        </p>
      </div>
      
      {/* Apps carousel with navigation buttons */}
      <div className="relative">
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
          onClick={scrollLeft20}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        
        <div 
          className="apps-slider relative overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent mx-8 px-2"
          ref={appsSliderRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div className="flex gap-6 py-4 px-2">
            {apps.map((app) => (
              <AppCard
                key={`app-${app.app_id}`}
                app={app}
                isSelected={selectedApp === app.app_id}
                onClick={() => handleAppSelect(app.app_id)}
              />
            ))}
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
          onClick={scrollRight20}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* App selection confirmation */}
      {selectedApp && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleProceedToAnalysis}
            className="px-8 py-2 flex items-center gap-2"
          >
            Analyze Selected App
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(AppSelection);