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
  <div
    className={`youtube-video-card ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="youtube-video-card-thumbnail">
      <Image
        src={video.snippet.thumbnails.medium.url}
        alt={video.snippet.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
    <div className="youtube-video-card-content">
      <h3 className="youtube-video-card-title">{video.snippet.title}</h3>
      <p className="youtube-video-card-channel">{video.snippet.channelTitle}</p>
      <div className="youtube-video-card-stats">
        <div className="youtube-video-card-stat">
          <Eye className="youtube-video-card-stat-icon" />
          <span className="youtube-video-card-stat-value">
            {formatNumber(statistics.viewCount || '0')}
          </span>
        </div>
        
        <div className="youtube-video-card-stat">
          <ThumbsUp className="youtube-video-card-stat-icon" />
          <span className="youtube-video-card-stat-value">
            {formatNumber(statistics.likeCount || '0')}
          </span>
        </div>
        
        <div className="youtube-video-card-stat">
          <MessageSquare className="youtube-video-card-stat-icon" />
          <span className="youtube-video-card-stat-value">
            {formatNumber(statistics.commentCount || '0')}
          </span>
        </div>
      </div>
    </div>
  </div>
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
      <div className="youtube-videos-container">
        <div className="youtube-videos-container-header">
          <h2 className="youtube-videos-container-header-title">YouTube Videos</h2>
          <p className="youtube-videos-container-header-search">Searching for "{query}"...</p>
        </div>
        <div className="youtube-loading-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="youtube-loading-item">
              <div className="youtube-loading-thumbnail"></div>
              <div className="youtube-loading-text">
                <div className="youtube-loading-line" style={{width: '75%'}}></div>
                <div className="youtube-loading-line" style={{width: '50%'}}></div>
                <div className="youtube-videos-stat">
                  <div className="youtube-loading-line" style={{width: '33%'}}></div>
                  <div className="youtube-loading-line" style={{width: '33%'}}></div>
                  <div className="youtube-loading-line" style={{width: '33%'}}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-videos-container">
      <div className="youtube-videos-container-header">
        <h2 className="youtube-videos-container-header-title">YouTube Videos</h2>
        <div className="youtube-videos-load-more-container"> 
          <p className="youtube-videos-container-header-search">Searching for "{query}"...</p>
      
          {nextPageToken && !loadingMore && (
            <button
              onClick={loadMoreVideos}
              disabled={loading || loadingMore}
              className="youtube-videos-load-more"
            >
              Load More <ChevronRight />
            </button>
          )}
          {loadingMore && (
            <div className="youtube-videos-loading">
              <Loader2 style={{animation: 'spin 1s linear infinite'}} />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="youtube-videos-error">
          <AlertTriangle />
          <p>{error.message}</p>
        </div>
      )}

      {/* Video carousel */}
      <div 
        className="youtube-videos-slider"
        ref={videosSliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div className="youtube-videos-slider-inner">
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