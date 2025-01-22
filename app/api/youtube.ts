import axios from 'axios';
import { YouTubeVideo, VideoStatistics, 
         YouTubeSearchResponse, YouTubeStatisticsResponse } from '../types/youtube';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.lNEXT_PUBLIC_YOUTUBE_API_KEY;

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
    const response = await axios.get<YouTubeSearchResponse>(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        maxResults: '8',
        q: query,
        pageToken,
        key: YOUTUBE_API_KEY
      }
    });

    return response.data;
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
    const response = await axios.get<YouTubeStatisticsResponse>(
      `${YOUTUBE_API_BASE}/videos`,
      {
        params: {
          part: 'statistics',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        }
      }
    );

    return response.data.items.reduce((acc, item) => {
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