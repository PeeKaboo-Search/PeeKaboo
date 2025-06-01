"use client";

import React, { useEffect, useState, useRef, memo, MouseEvent } from 'react';
import Image from 'next/image';
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

// Types (define locally to avoid import issues)
interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width?: number; height?: number };
    medium: { url: string; width?: number; height?: number };
    high: { url: string; width?: number; height?: number };
  };
  channelTitle: string;
  publishedAt: string;
}

interface VideoStatistics {
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
}

interface YouTubeVideo {
  id: string | { videoId: string };
  snippet: YouTubeVideoSnippet;
  statistics?: VideoStatistics;
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
}

interface CommentItemType {
  id: string;
  snippet: {
    topLevelComment: {
      id: string;
      snippet: {
        textDisplay: string;
        textOriginal: string;
        likeCount: number;
      }
    };
    totalReplyCount: number;
  }
}

interface CommentThreadResponse {
  items: CommentItemType[];
  nextPageToken?: string;
}

// API Functions (inline to avoid import path issues)
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function getVideoId(item: YouTubeVideo): string | null {
  if (typeof item.id === 'string') {
    return item.id;
  }
  
  if (item.id && typeof item.id === 'object' && 'videoId' in item.id) {
    return item.id.videoId;
  }
  
  return null;
}

async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }

  try {
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', '8');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
    if (pageToken) {
      searchUrl.searchParams.set('pageToken', pageToken);
    }

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    // Process items to ensure valid videoId structure
    const processedItems = searchData.items
      .map((item: any) => {
        if (typeof item.id === 'string') {
          return { ...item, id: { videoId: item.id } };
        }
        if (item.id && typeof item.id === 'object' && 'videoId' in item.id) {
          return item;
        }
        return null;
      })
      .filter(Boolean);

    const videoIds = processedItems
      .map((item: YouTubeVideo) => getVideoId(item))
      .filter((id): id is string => id !== null);
    
    // Fetch statistics
    const statistics = await getVideoStatistics(videoIds);

    // Merge statistics with search results
    const itemsWithStats = processedItems.map((item: YouTubeVideo) => {
      const videoId = getVideoId(item);
      if (!videoId) return item;
      
      return {
        ...item,
        statistics: statistics[videoId]
      };
    }).sort((a: YouTubeVideo, b: YouTubeVideo) => {
      const aViews = parseInt(a.statistics?.viewCount || '0');
      const bViews = parseInt(b.statistics?.viewCount || '0');
      return bViews - aViews;
    });

    return {
      items: itemsWithStats,
      nextPageToken: searchData.nextPageToken,
      prevPageToken: searchData.prevPageToken
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    throw new ApiError(
      'Failed to fetch YouTube videos. Please check your API key and try again.',
      'SEARCH_ERROR'
    );
  }
}

async function getVideoStatistics(videoIds: string[]): Promise<Record<string, VideoStatistics>> {
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }

  if (videoIds.length === 0) {
    return {};
  }

  try {
    const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    statsUrl.searchParams.set('part', 'statistics');
    statsUrl.searchParams.set('id', videoIds.join(','));
    statsUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(statsUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.items.reduce((acc: Record<string, VideoStatistics>, item: any) => {
      acc[item.id] = item.statistics;
      return acc;
    }, {});
  } catch (error) {
    console.error('Statistics fetch error:', error);
    return {}; // Return empty object instead of throwing
  }
}

async function getVideoComments(videoId: string, maxResults: number = 100): Promise<CommentThreadResponse> {
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }

  try {
    const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
    commentsUrl.searchParams.set('part', 'snippet');
    commentsUrl.searchParams.set('videoId', videoId);
    commentsUrl.searchParams.set('maxResults', maxResults.toString());
    commentsUrl.searchParams.set('order', 'relevance');
    commentsUrl.searchParams.set('textFormat', 'plainText');
    commentsUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(commentsUrl.toString());
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Comments are disabled for this video');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      items: data.items || [],
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error('Comments fetch error:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch video comments',
      'COMMENTS_ERROR'
    );
  }
}

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
  statistics: VideoStatistics;
  isSelected: boolean;
  onClick: () => void;
}

interface CommentItemProps {
  comment: CommentItemType;
}

// Main Component
const YouTubeVideos: React.FC<YouTubeVideosProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, VideoStatistics>>({});
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

      const newStats = { ...statistics };
      data.items.forEach(video => {
        const videoId = getVideoId(video);
        if (videoId && video.statistics) {
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

  const VideoCard: React.FC<VideoCardProps> = ({ video, statistics, isSelected, onClick }) => (
    <div
      className={`flex-shrink-0 w-72 cursor-pointer snap-start transition-all hover:shadow-lg border rounded-lg overflow-hidden bg-white
        ${isSelected ? 'ring-2 ring-red-600 shadow-md' : 'border-gray-200'}`}
      onClick={onClick}
    >
      <div className="relative w-full h-40">
        <Image
          src={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 text-sm">{video.snippet.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{video.snippet.channelTitle}</p>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1" title={`Views: ${parseInt(statistics.viewCount || '0', 10).toLocaleString()}`}>
            <Eye className="h-4 w-4" />
            <span className="text-sm">{formatNumber(statistics.viewCount || '0')}</span>
          </div>
          
          <div className="flex items-center gap-1" title={`Likes: ${parseInt(statistics.likeCount || '0', 10).toLocaleString()}`}>
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">{formatNumber(statistics.likeCount || '0')}</span>
          </div>
          
          <div className="flex items-center gap-1" title={`Comments: ${parseInt(statistics.commentCount || '0', 10).toLocaleString()}`}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">{formatNumber(statistics.commentCount || '0')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const CommentItem: React.FC<CommentItemProps> = ({ comment }) => (
    <div className="p-3 border rounded-lg transition-all hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="mt-1 text-xs whitespace-pre-line">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
          <div className="w-full h-40 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-4 mt-4">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-16" />
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

        const newStats: Record<string, VideoStatistics> = {};
        data.items.forEach(video => {
          const videoId = getVideoId(video);
          if (videoId && video.statistics) {
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

    fetchData();
  }, [query]);

  if (loading && !videos.length) {
    return (
      <div className="youtube-videos-container space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">YouTube Videos</h2>
          <p className="text-sm text-gray-500">Searching for &quot;{query}&quot;...</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="youtube-videos-container space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <div className="flex items-center gap-2"> 
          <p className="text-sm text-gray-500 mr-2">Search: &quot;{query}&quot;</p>
      
          {nextPageToken && !loadingMore && (
            <button
              onClick={loadMoreVideos}
              disabled={loading || loadingMore}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Load More <ChevronRight className="h-4 w-4" />
            </button>
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
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error.message}</p>
        </div>
      )}

      <div 
        className="relative overflow-x-auto"
        ref={videosSliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-4 py-4 px-2">
          {videos.map((video) => {
            const videoId = getVideoId(video);
            if (!videoId) return null;
            
            return (
              <VideoCard
                key={`youtube-video-${videoId}`}
                video={video}
                statistics={statistics[videoId] || ensureVideoStatistics({})}
                isSelected={selectedVideo === videoId}
                onClick={() => handleVideoSelect(videoId)}
              />
            );
          })}
        </div>
      </div>

      {selectedVideo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Comments</h3>
          </div>
          
          {commentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error && error.code === 'COMMENTS_ERROR' ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Error loading comments. {error.message}</p>
            </div>
          ) : !comments ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No comments available.</p>
            </div>
          ) : comments.items.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No comments found for this video.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {comments.items.slice(0, 10).map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              {comments.items.length > 10 && (
                <p className="text-center text-xs text-gray-500 pt-2">
                  Showing 10 of {comments.items.length} comments
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(YouTubeVideos);