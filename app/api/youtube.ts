import axios from 'axios';
import { z } from 'zod';

// Zod schemas to replace imported types and provide type safety
const YouTubeVideoSnippetSchema = z.object({
  title: z.string(),
  description: z.string(),
  thumbnails: z.object({
    default: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional()
    }),
    medium: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional()
    }),
    high: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional()
    })
  }),
  channelTitle: z.string(),
  publishedAt: z.string()
});

const VideoStatisticsSchema = z.object({
  viewCount: z.string(),
  likeCount: z.string().optional(),
  commentCount: z.string().optional()
});

const YouTubeSearchItemSchema = z.object({
  id: z.object({
    videoId: z.string()
  }),
  snippet: YouTubeVideoSnippetSchema
});

const YouTubeStatisticsItemSchema = z.object({
  id: z.string(),
  statistics: VideoStatisticsSchema
});

const YouTubeSearchResponseSchema = z.object({
  items: z.array(YouTubeSearchItemSchema),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional()
});

const YouTubeStatisticsResponseSchema = z.object({
  items: z.array(YouTubeStatisticsItemSchema)
});

// Type aliases to replace imported types and satisfy ESLint
type YouTubeVideo = z.infer<typeof YouTubeSearchItemSchema>;
type VideoStatistics = z.infer<typeof VideoStatisticsSchema>;
type YouTubeSearchResponse = z.infer<typeof YouTubeSearchResponseSchema>;
type YouTubeStatisticsResponse = z.infer<typeof YouTubeStatisticsResponseSchema>;

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        maxResults: '8',
        q: query,
        pageToken,
        key: YOUTUBE_API_KEY
      }
    });

    // Validate the response
    return YouTubeSearchResponseSchema.parse(response.data);
  } catch (error) {
    console.error('YouTube search error:', error);
    throw new ApiError(
      'Failed to fetch YouTube videos',
      error instanceof Error ? error.message : 'SEARCH_ERROR'
    );
  }
}

export async function getVideoStatistics(videoIds: string[]): Promise<Record<string, VideoStatistics>> {
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }

  try {
    const response = await axios.get(
      `${YOUTUBE_API_BASE}/videos`,
      {
        params: {
          part: 'statistics',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        }
      }
    );

    // Validate the response
    const validatedResponse = YouTubeStatisticsResponseSchema.parse(response.data);

    return validatedResponse.items.reduce((acc, item) => {
      acc[item.id] = item.statistics;
      return acc;
    }, {} as Record<string, VideoStatistics>);
  } catch (error) {
    console.error('Statistics fetch error:', error);
    throw new ApiError(
      'Failed to fetch video statistics',
      error instanceof Error ? error.message : 'STATS_ERROR'
    );
  }
}

// Expose types to satisfy ESLint
export type { 
  YouTubeVideo, 
  VideoStatistics, 
  YouTubeSearchResponse, 
  YouTubeStatisticsResponse 
};