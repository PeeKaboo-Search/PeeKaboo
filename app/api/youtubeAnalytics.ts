import axios from 'axios';
import { z } from 'zod';

// Zod schemas for YouTube data
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

// Fix: Handle different types of video IDs in search results
const YouTubeVideoIdSchema = z.object({
  kind: z.string().optional(),
  videoId: z.string()
});

// Use union type to handle different kinds of IDs that might be returned
const YouTubeSearchItemIdSchema = z
  .object({
    videoId: z.string()
  })
  .or(YouTubeVideoIdSchema);

const YouTubeSearchItemSchema = z.object({
  id: YouTubeSearchItemIdSchema,
  snippet: YouTubeVideoSnippetSchema,
  statistics: VideoStatisticsSchema.optional()
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

// Comment schemas
const CommentSnippetSchema = z.object({
  topLevelComment: z.object({
    id: z.string(),
    snippet: z.object({
      textDisplay: z.string(),
      textOriginal: z.string(),
      authorDisplayName: z.string(),
      authorProfileImageUrl: z.string().optional(),
      authorChannelUrl: z.string().optional(),
      likeCount: z.number(),
      publishedAt: z.string(),
      updatedAt: z.string()
    })
  }),
  totalReplyCount: z.number(),
  canReply: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

const CommentThreadSchema = z.object({
  id: z.string(),
  snippet: CommentSnippetSchema
});

const CommentThreadResponseSchema = z.object({
  items: z.array(CommentThreadSchema),
  nextPageToken: z.string().optional()
});

// Comment Analysis schema
const CommentAnalysisSchema = z.object({
  success: z.boolean(),
  data: z.object({
    analysis: z.object({
      overview: z.string(),
      painPoints: z.array(z.object({
        title: z.string(),
        description: z.string(),
        frequency: z.number(),
        impact: z.number(),
        possibleSolutions: z.array(z.string())
      })),
      userExperiences: z.array(z.object({
        scenario: z.string(),
        impact: z.string(),
        frequencyPattern: z.string(),
        sentiment: z.enum(['positive', 'negative', 'neutral'])
      })),
      emotionalTriggers: z.array(z.object({
        trigger: z.string(),
        context: z.string(),
        intensity: z.number(),
        responsePattern: z.string()
      })),
      marketImplications: z.string()
    }),
    sources: z.array(z.object({
      content: z.string(),
      author: z.object({
        name: z.string(),
        profileImage: z.string().optional()
      }),
      likeCount: z.number(),
      timestamp: z.string()
    })),
    timestamp: z.string()
  }).optional(),
  error: z.string().optional()
});

// Type aliases
export type YouTubeVideo = z.infer<typeof YouTubeSearchItemSchema>;
export type VideoStatistics = z.infer<typeof VideoStatisticsSchema>;
export type YouTubeSearchResponse = z.infer<typeof YouTubeSearchResponseSchema>;
export type YouTubeStatisticsResponse = z.infer<typeof YouTubeStatisticsResponseSchema>;
export type CommentThread = z.infer<typeof CommentThreadSchema>;
export type CommentThreadResponse = z.infer<typeof CommentThreadResponseSchema>;
export type CommentAnalysis = z.infer<typeof CommentAnalysisSchema>;

// Constants
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const TIMEOUT = 30000;

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Helper function for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
    }
    throw error;
  }
}

// Helper function to extract videoId safely
function getVideoId(item: any): string | null {
  if (typeof item.id === 'string') {
    return item.id;
  }
  
  if (item.id && typeof item.id === 'object') {
    if (item.id.videoId) {
      return item.id.videoId;
    }
  }
  
  return null;
}

export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }
  try {
    // Fetch search results
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        maxResults: '8',
        q: query,
        pageToken,
        key: YOUTUBE_API_KEY
      }
    });
    
    // Pre-process the items to ensure they all have a valid id.videoId structure
    const processedData = {
      ...searchResponse.data,
      items: searchResponse.data.items.map((item: any) => {
        // If id is a string, convert it to { videoId: id }
        if (typeof item.id === 'string') {
          return { ...item, id: { videoId: item.id } };
        }
        // If id is already an object with videoId, keep it as is
        if (item.id && typeof item.id === 'object' && item.id.videoId) {
          return item;
        }
        // Otherwise, this item doesn't have a valid videoId, filter it out
        return null;
      }).filter(Boolean) // Remove null items
    };
    
    const searchData = YouTubeSearchResponseSchema.parse(processedData);
    
    // Fetch statistics for videos
    const videoIds = searchData.items
      .map(item => getVideoId(item))
      .filter((id): id is string => id !== null);
    
    const statistics = await getVideoStatistics(videoIds);

    // Merge statistics with search results
    const itemsWithStats = searchData.items.map(item => {
      const videoId = getVideoId(item);
      if (!videoId) return item;
      
      return {
        ...item,
        statistics: statistics[videoId]
      };
    }).sort((a, b) => {
      const aViews = parseInt(a.statistics?.viewCount || '0');
      const bViews = parseInt(b.statistics?.viewCount || '0');
      return bViews - aViews;
    });

    return {
      ...searchData,
      items: itemsWithStats
    };
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

export async function getVideoComments(videoId: string, maxResults: number = 100): Promise<CommentThreadResponse> {
  if (!YOUTUBE_API_KEY) {
    throw new ApiError('YouTube API key is not configured', 'CONFIG_ERROR');
  }
  try {
    const response = await axios.get(
      `${YOUTUBE_API_BASE}/commentThreads`,
      {
        params: {
          part: 'snippet',
          videoId: videoId,
          maxResults: maxResults,
          order: 'relevance',
          textFormat: 'plainText',
          key: YOUTUBE_API_KEY
        }
      }
    );
    return CommentThreadResponseSchema.parse(response.data);
  } catch (error) {
    console.error('Comments fetch error:', error);
    throw new ApiError(
      'Failed to fetch video comments',
      error instanceof Error ? error.message : 'COMMENTS_ERROR'
    );
  }
}

export async function analyzeVideoComments(videoId: string, videoTitle: string): Promise<CommentAnalysis> {
  try {
    if (!videoId.trim()) {
      return { success: false, error: 'Video ID cannot be empty' };
    }
    
    if (!YOUTUBE_API_KEY || !GROQ_API_KEY) {
      return { success: false, error: 'API keys not configured' };
    }

    const comments = await getVideoComments(videoId);
    if (comments.items.length === 0) {
      return { success: false, error: 'No comments found for this video' };
    }

    const commentTexts = comments.items
      .map(item => item.snippet.topLevelComment.snippet.textOriginal.trim())
      .filter(Boolean)
      .join('\n\n');

    if (!commentTexts) {
      return { success: false, error: 'No valid comments to analyze' };
    }

    const analysis = await generateCommentAnalysis(videoTitle, commentTexts);

    return {
      success: true,
      data: {
        analysis: JSON.parse(analysis),
        sources: comments.items.map(item => ({
          content: sanitizeText(item.snippet.topLevelComment.snippet.textOriginal),
          author: {
            name: item.snippet.topLevelComment.snippet.authorDisplayName,
            profileImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl
          },
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          timestamp: item.snippet.topLevelComment.snippet.publishedAt
        })),
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Comment analysis error:', error);
    return { success: false, error: errorMessage };
  }
}

async function generateCommentAnalysis(videoTitle: string, commentText: string): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const analysisPrompt = {
    role: 'system',
    content: `You are an expert content analysis specialist focusing on YouTube audience behavior and sentiment. Analyze the provided comments for the video titled "${videoTitle}" and generate a comprehensive analysis in the following JSON format:

{
  "overview": "Executive summary of the comment analysis using sophisticated content creator terminology",
  "painPoints": [
    {
      "title": "Clear, impactful title of the issue or concern",
      "description": "Detailed analysis of the viewer feedback using content creator psychology terms",
      "frequency": "Numerical value 1-10 indicating how often this appears",
      "impact": "Numerical value 1-10 indicating severity",
      "possibleSolutions": ["Array of 2-3 potential content improvements"]
    }
  ] (exactly 6 items),
  "userExperiences": [
    {
      "scenario": "Detailed description of the viewer experience",
      "impact": "Analysis of how this experience affects viewer engagement",
      "frequencyPattern": "Pattern of occurrence and context",
      "sentiment": "positive/negative/neutral"
    }
  ] (exactly 3 items),
  "emotionalTriggers": [
    {
      "trigger": "Name of the emotional trigger",
      "context": "Detailed context where this trigger appears",
      "intensity": "Numerical value 1-10",
      "responsePattern": "Typical viewer response to this trigger"
    }
  ] (exactly 3 items),
  "marketImplications": "Strategic insights for content creation and audience development"
}

Ensure the analysis is data-driven, uses professional creator terminology, and provides actionable insights.`
  };

  const payload = {
    model: 'deepseek-r1-distill-qwen-32b',
    messages: [
      analysisPrompt,
      {
        role: 'user',
        content: commentText,
      },
    ],
    temperature: 0.7,
    max_tokens: 4500,
    response_format: { type: 'json_object' },
  };

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      TIMEOUT
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Groq API error (${response.status}): ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }

    const data = await response.json();
    const analysis = data?.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis generated from Groq API');
    }

    return analysis;

  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(
      `Analysis generation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// Utility function
function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  let sanitized = text.replace(/\s+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  const truncated = sanitized.substring(0, maxLength);
  return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
}