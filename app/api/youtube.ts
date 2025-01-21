import { YoutubeTranscript } from 'youtube-transcript';
import {
  YouTubeVideo,
  VideoStatistics,
  VideoAnalysis,
  TranscriptItem,
  YouTubeSearchResponse,
  YouTubeStatisticsResponse
} from '../types/youtube';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const GROQ_API_BASE = 'https://api.groq.com/v1/completions';

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new ApiError(
      error.error?.message || `API request failed with status ${response.status}`,
      response.status.toString()
    );
  }
  return response.json();
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '8',
    q: `${query} advertisement`,
    key: process.env.lNEXT_PUBLIC_YOUTUBE_API_KEY || ''
  });

  try {
    const data = await fetchWithError<YouTubeSearchResponse>(
      `${YOUTUBE_API_BASE}/search?${params}`
    );
    return data.items;
  } catch (error) {
    throw new ApiError(
      'Failed to fetch YouTube videos',
      error instanceof ApiError ? error.code : 'SEARCH_ERROR'
    );
  }
}

export async function getVideoStatistics(videoIds: string[]): Promise<Record<string, VideoStatistics>> {
  const params = new URLSearchParams({
    part: 'statistics',
    id: videoIds.join(','),
    key: process.env.lNEXT_PUBLIC_YOUTUBE_API_KEY || ''
  });

  try {
    const data = await fetchWithError<YouTubeStatisticsResponse>(
      `${YOUTUBE_API_BASE}/videos?${params}`
    );
    
    return data.items.reduce((acc, item) => {
      acc[item.id] = item.statistics;
      return acc;
    }, {} as Record<string, VideoStatistics>);
  } catch (error) {
    throw new ApiError(
      'Failed to fetch video statistics',
      error instanceof ApiError ? error.code : 'STATS_ERROR'
    );
  }
}

async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    const transcriptItems: TranscriptItem[] = await YoutubeTranscript.fetchTranscript(videoId);
    return transcriptItems.map(item => item.text).join(' ');
  } catch (error) {
    console.warn('Transcript fetch failed:', error);
    return '';
  }
}

export async function analyzeVideoContent(video: YouTubeVideo): Promise<VideoAnalysis> {
  if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
    throw new ApiError('Groq API key is not configured', 'CONFIG_ERROR');
  }

  try {
    // Fetch transcript
    const transcript = await getVideoTranscript(video.id.videoId);
    const contentToAnalyze = transcript || video.snippet.description;

    const response = await fetch(GROQ_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{
          role: 'user',
          content: `Analyze this YouTube video content and provide:

          Title: ${video.snippet.title}
          Content: ${contentToAnalyze}

          Please provide:
          1. A brief summary (2-3 sentences)
          2. Up to 3 most notable quotes (use exact quotes from the transcript if available)
          3. Up to 3 positive points or highlights
          4. Up to 3 negative points or criticisms
          5. Up to 5 key topics or themes

          Format the response as JSON with these fields:
          {
            "summary": "string",
            "quotes": ["string"],
            "sentiment": {
              "positive": ["string"],
              "negative": ["string"]
            },
            "keywords": ["string"]
          }`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze content');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return {
      ...analysis,
      transcript: contentToAnalyze
    };
  } catch (error) {
    throw new ApiError(
      'Failed to analyze video content',
      error instanceof ApiError ? error.code : 'ANALYSIS_ERROR'
    );
  }
}