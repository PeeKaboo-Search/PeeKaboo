"use client";

import React, { useEffect, useState, useRef, memo } from 'react';
import Image from 'next/image';
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { 
  YouTubeVideo, 
  VideoStatistics
} from '@/app/types/youtube';
import { searchYouTubeVideos } from '@/app/api/youtubeAnalytics';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import "@/app/styles/YouTubeAnalytics.css";
import CommentAnalysis from './YTcomments';

// Error state interface
interface ErrorState {
  message: string;
  code: string;
}

// Props interface for the component
interface YouTubeVideosProps {
  query: string;
}

// Ensure VideoStatistics type is strict
const ensureVideoStatistics = (stats: Partial<VideoStatistics>): VideoStatistics => ({
  viewCount: stats.viewCount || '0',
  likeCount: stats.likeCount || '0',
  commentCount: stats.commentCount || '0'
});

// Helper functions
// Format large numbers in a readable way
const formatNumber = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n)) return 'N/A';
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
};

// VideoCard component
const VideoCard = memo(({ 
  video, 
  statistics, 
  isSelected, 
  onClick 
}: { 
  video: YouTubeVideo, 
  statistics: VideoStatistics,
  isSelected: boolean,
  onClick: () => void
}) => (
  <Card
    className={`youtube-video-card flex-shrink-0 w-72 cursor-pointer snap-start transition-all hover:shadow-lg
      ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-0">
      <div className="relative w-full h-40">
        <Image
          src={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-lg"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2">{video.snippet.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{video.snippet.channelTitle}</p>
        <div className="flex gap-4 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.viewCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Views: {parseInt(statistics.viewCount).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.likeCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Likes: {parseInt(statistics.likeCount || '0').toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.commentCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comments: {parseInt(statistics.commentCount || '0').toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
));
VideoCard.displayName = 'VideoCard';

// Main YouTube component
const YouTubeVideos: React.FC<YouTubeVideosProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, VideoStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Scrolling state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  
  // Refs for scrolling
  const videosSliderRef = useRef<HTMLDivElement>(null);
  
  // Scrolling handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videosSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - videosSliderRef.current.offsetLeft);
    setScrollLeft(videosSliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videosSliderRef.current) return;
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - videosSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      videosSliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Load more videos when user clicks "Load More"
  const loadMoreVideos = async () => {
    if (!nextPageToken || loadingMore) return;
    try {
      setLoadingMore(true);
      const data = await searchYouTubeVideos(query, nextPageToken);
      const newVideos = [...videos, ...data.items];
      setVideos(newVideos);
      setNextPageToken(data.nextPageToken);

      // Extract and update statistics
      const newStats: Record<string, VideoStatistics> = { ...statistics };
      data.items.forEach(video => {
        const videoId = video.id.videoId;
        if (video.statistics) {
          newStats[videoId] = ensureVideoStatistics(video.statistics);
        }
      });
      
      setStatistics(newStats);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load more videos',
        code: 'LOAD_MORE_ERROR'
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle video selection
  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedVideo(null);
        
        const data = await searchYouTubeVideos(query, undefined);
        setVideos(data.items);
        setNextPageToken(data.nextPageToken);

        // Extract statistics from the search results
        const newStats: Record<string, VideoStatistics> = {};
        data.items.forEach(video => {
          const videoId = video.id.videoId;
          if (video.statistics) {
            newStats[videoId] = ensureVideoStatistics(video.statistics);
          }
        });
        
        setStatistics(newStats);
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

  // Render loading state
  if (loading && !videos.length) {
    return (
      <div className="youtube-videos-container space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">YouTube Videos</h2>
          <p className="text-sm text-muted-foreground">Searching for &quot;{query}&quot;...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-videos-container space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <div className="flex items-center"> 
           <p className="text-sm text-muted-foreground">Searching for &quot;{query}&quot;...</p>
      
          {nextPageToken && !loadingMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreVideos}
              disabled={loading || loadingMore}
              className="flex items-center gap-1"
            >
              Load More <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {loadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error.message}</p>
        </div>
      )}

      {/* Video carousel */}
      <div 
        className="youtube-videos-slider relative overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        ref={videosSliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-4 py-4 px-2">
          {videos.map((video) => (
            <VideoCard
              key={`youtube-video-${video.id.videoId}`}
              video={video}
              statistics={statistics[video.id.videoId] || ensureVideoStatistics({})}
              isSelected={selectedVideo === video.id.videoId}
              onClick={() => handleVideoSelect(video.id.videoId)}
            />
          ))}
        </div>
      </div>

      {/* Selected video comments section */}
      {selectedVideo && (
        <CommentAnalysis 
          videoId={selectedVideo} 
          videoTitle={videos.find(v => v.id.videoId === selectedVideo)?.snippet.title || ''}
        />
      )}
    </div>
  );
};

YouTubeVideos.displayName = 'YouTubeVideos';

export default memo(YouTubeVideos);