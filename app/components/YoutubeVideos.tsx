"use client";

import React, { useEffect, useState, useRef, memo, MouseEvent } from 'react';
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

// Import API functions and types
import { 
  searchYouTubeVideos, 
  getVideoComments,
  type YouTubeVideo,
  type VideoStatistics,
  type YouTubeSearchResponse,
  type CommentThreadResponse,
  type CommentThread
} from '../api/youtubeAnalytics';

// Component interfaces
interface ErrorState {
  message: string;
  code: string;
}

interface YouTubeVideosProps {
  query: string;
}

interface VideoCardProps {
  video: YouTubeVideo;
  isSelected: boolean;
  onClick: () => void;
}

interface CommentItemProps {
  comment: CommentThread;
}

// Helper function to extract videoId safely
function getVideoId(item: YouTubeVideo): string | null {
  if (typeof item.id === 'string') {
    return item.id;
  }
  
  if (item.id && typeof item.id === 'object' && 'videoId' in item.id) {
    return item.id.videoId;
  }
  
  return null;
}

// Main Component
const YouTubeVideos: React.FC<YouTubeVideosProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  
  const [comments, setComments] = useState<CommentThreadResponse | null>(null);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  
  const videosSliderRef = useRef<HTMLDivElement>(null);

  const ensureVideoStatistics = (stats: Partial<VideoStatistics> | undefined): VideoStatistics => ({
    viewCount: stats?.viewCount || '0',
    likeCount: stats?.likeCount || '0',
    commentCount: stats?.commentCount || '0'
  });

  const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(n)) return 'N/A';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
    return n.toString();
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    if (!videosSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - videosSliderRef.current.offsetLeft);
    setScrollLeft(videosSliderRef.current.scrollLeft);
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleMouseLeave = (): void => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    if (!videosSliderRef.current || !isDragging) return;
    e.preventDefault();
    const x = e.pageX - videosSliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    videosSliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const loadMoreVideos = async (): Promise<void> => {
    if (!nextPageToken || loadingMore) return;
    try {
      setLoadingMore(true);
      const data = await searchYouTubeVideos(query, nextPageToken);
      const newVideos = [...videos, ...data.items];
      setVideos(newVideos);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load more videos',
        code: 'LOAD_MORE_ERROR'
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVideoSelect = (videoId: string): void => {
    setSelectedVideo(videoId);
    fetchComments(videoId);
  };

  const fetchComments = async (videoId: string): Promise<void> => {
    if (!videoId) return;
    
    setCommentsLoading(true);
    setComments(null);
    setError(null);
    
    try {
      const commentsData = await getVideoComments(videoId);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch comments',
        code: 'COMMENTS_ERROR'
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  const VideoCard: React.FC<VideoCardProps> = ({ video, isSelected, onClick }) => {
    const statistics = ensureVideoStatistics(video.statistics);
    
    return (
      <div
        className={`flex-shrink-0 w-64 cursor-pointer snap-start transition-all duration-300 hover:scale-105 rounded-xl overflow-hidden
          ${isSelected 
            ? 'bg-white/20 border border-white/30 shadow-2xl backdrop-blur-lg' 
            : 'bg-black/40 border border-white/10 hover:bg-white/10 backdrop-blur-md'
          }`}
        onClick={onClick}
      >
        <div className="relative w-full h-32">
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-2 text-xs text-white/90 leading-tight">{video.snippet.title}</h3>
          <p className="text-xs text-white/60 mt-1 truncate">{video.snippet.channelTitle}</p>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1" title={`Views: ${parseInt(statistics.viewCount || '0', 10).toLocaleString()}`}>
              <Eye className="h-3 w-3 text-white/70" />
              <span className="text-xs text-white/70">{formatNumber(statistics.viewCount || '0')}</span>
            </div>
            
            <div className="flex items-center gap-1" title={`Likes: ${parseInt(statistics.likeCount || '0', 10).toLocaleString()}`}>
              <ThumbsUp className="h-3 w-3 text-white/70" />
              <span className="text-xs text-white/70">{formatNumber(statistics.likeCount || '0')}</span>
            </div>
            
            <div className="flex items-center gap-1" title={`Comments: ${parseInt(statistics.commentCount || '0', 10).toLocaleString()}`}>
              <MessageSquare className="h-3 w-3 text-white/70" />
              <span className="text-xs text-white/70">{formatNumber(statistics.commentCount || '0')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CommentItem: React.FC<CommentItemProps> = ({ comment }) => (
    <div className="p-4 bg-black/30 border border-white/10 rounded-lg transition-all hover:bg-white/5 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="mt-1 text-sm whitespace-pre-line text-white/80 leading-relaxed">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{comment.snippet.topLevelComment.snippet.likeCount}</span>
            </div>
            {comment.snippet.totalReplyCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{comment.snippet.totalReplyCount} replies</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="flex gap-4 py-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-64 bg-black/40 rounded-xl overflow-hidden animate-pulse backdrop-blur-md">
          <div className="w-full h-32 bg-white/10" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-2 bg-white/10 rounded w-1/2" />
            <div className="flex gap-3 mt-4">
              <div className="h-2 bg-white/10 rounded w-12" />
              <div className="h-2 bg-white/10 rounded w-12" />
              <div className="h-2 bg-white/10 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!query) return;
      
      try {
        setLoading(true);
        setError(null);
        setSelectedVideo(null);
        setComments(null);
        
        const data = await searchYouTubeVideos(query);
        setVideos(data.items);
        setNextPageToken(data.nextPageToken);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch data',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading && !videos.length) {
    return (
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-red-600">YouTube Videos</h2>
          <p className="text-sm text-white/60">Searching for &quot;{query}&quot;...</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-red-600">YouTube Videos</h2>
        <div className="flex items-center gap-4"> 
          <p className="text-sm text-white/60">Search: &quot;{query}&quot;</p>
      
          {nextPageToken && !loadingMore && (
            <button
              onClick={loadMoreVideos}
              disabled={loading || loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-all backdrop-blur-sm text-white/80"
            >
              Load More <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {loadingMore && (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 border border-red-500/30 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <p>{error.message}</p>
        </div>
      )}

      <div 
        className="relative overflow-x-auto scrollbar-hide"
        ref={videosSliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-4 py-4">
          {videos.map((video) => {
            const videoId = getVideoId(video);
            if (!videoId) return null;
            
            return (
              <VideoCard
                key={`youtube-video-${videoId}`}
                video={video}
                isSelected={selectedVideo === videoId}
                onClick={() => handleVideoSelect(videoId)}
              />
            );
          })}
        </div>
      </div>

      {selectedVideo && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white/90">Comments</h3>
          </div>
          
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-black/30 border border-white/10 rounded-lg p-4 animate-pulse backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-full" />
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error && error.code === 'COMMENTS_ERROR' ? (
            <div className="p-8 text-center bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-white/40" />
              <p className="text-white/60">Error loading comments. {error.message}</p>
            </div>
          ) : !comments ? (
            <div className="p-8 text-center bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-white/40" />
              <p className="text-white/60">No comments available.</p>
            </div>
          ) : comments.items.length === 0 ? (
            <div className="p-8 text-center bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-white/40" />
              <p className="text-white/60">No comments found for this video.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
              {comments.items.slice(0, 10).map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              {comments.items.length > 10 && (
                <p className="text-center text-sm text-white/40 pt-2">
                  Showing 10 of {comments.items.length} comments
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default memo(YouTubeVideos);