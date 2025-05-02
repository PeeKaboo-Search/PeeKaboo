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

// Simplified comment schema - only store essential data
const CommentSnippetSchema = z.object({
  topLevelComment: z.object({
    id: z.string(),
    snippet: z.object({
      textDisplay: z.string(),
      textOriginal: z.string(),
      likeCount: z.number(),
      // Removed authorDisplayName, authorProfileImageUrl, publishedAt, updatedAt
    })
  }),
  totalReplyCount: z.number()
});

const CommentThreadSchema = z.object({
  id: z.string(),
  snippet: CommentSnippetSchema
});

const CommentThreadResponseSchema = z.object({
  items: z.array(CommentThreadSchema),
  nextPageToken: z.string().optional()
});

// Enhanced Comment Analysis schema with sentiment analysis
// Export directly to avoid the 'assigned but never used' error
export const CommentAnalysisSchema = z.object({
  success: z.boolean(),
  data: z.object({
    analysis: z.object({
      overview: z.string(),
      sentimentAnalysis: z.object({
        overall: z.enum(['positive', 'negative', 'neutral', 'mixed']),
        score: z.number(),
        distribution: z.object({
          positive: z.number(),
          negative: z.number(),
          neutral: z.number()
        }),
        trends: z.array(z.object({
          topic: z.string(),
          sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
          intensity: z.number()
        }))
      }),
      painPoints: z.array(z.object({
        title: z.string(),
        description: z.string(),
        frequency: z.number(),
        impact: z.number(),
        sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
        possibleSolutions: z.array(z.string())
      })),
      userExperiences: z.array(z.object({
        scenario: z.string(),
        impact: z.string(),
        frequencyPattern: z.string(),
        sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed'])
      })),
      emotionalTriggers: z.array(z.object({
        trigger: z.string(),
        context: z.string(),
        intensity: z.number(),
        responsePattern: z.string(),
        dominantEmotion: z.string()
      })),
      marketImplications: z.string()
    }),
    sources: z.array(z.object({
      content: z.string(),
      sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional()
      // Removed author, likeCount, timestamp
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
const MAX_COMMENTS_TO_ANALYZE = 50; // Limit number of comments sent to Groq
const MAX_COMMENT_LENGTH = 300; // Limit comment length to reduce data size

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
function getVideoId(item: YouTubeVideo): string | null {
  if (typeof item.id === 'string') {
    return item.id as string;
  }
  
  if (item.id && typeof item.id === 'object') {
    if ('videoId' in item.id) {
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
    
    // Define a type for YouTube API response items
    type YouTubeResponseItem = {
      id: string | { videoId?: string; kind?: string };
      [key: string]: unknown;
    };
    
    // Pre-process the items to ensure they all have a valid id.videoId structure
    const processedData = {
      ...searchResponse.data,
      items: searchResponse.data.items.map((item: YouTubeResponseItem) => {
        // If id is a string, convert it to { videoId: id }
        if (typeof item.id === 'string') {
          return { ...item, id: { videoId: item.id } };
        }
        // If id is already an object with videoId, keep it as is
        if (item.id && typeof item.id === 'object' && 'videoId' in item.id) {
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
    
    // Define a type for the YouTube comment response
    type YouTubeCommentItem = {
      id: string;
      snippet: {
        topLevelComment: {
          id: string;
          snippet: {
            textDisplay: string;
            textOriginal: string;
            likeCount: number;
            [key: string]: unknown;
          };
        };
        totalReplyCount: number;
        [key: string]: unknown;
      };
    };
    
    // Process the response to keep only the text content
    const simplifiedResponse = {
      ...response.data,
      items: response.data.items.map((item: YouTubeCommentItem) => ({
        id: item.id,
        snippet: {
          topLevelComment: {
            id: item.snippet.topLevelComment.id,
            snippet: {
              textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
              textOriginal: item.snippet.topLevelComment.snippet.textOriginal, 
              likeCount: item.snippet.topLevelComment.snippet.likeCount
            }
          },
          totalReplyCount: item.snippet.totalReplyCount
        }
      }))
    };
    
    return CommentThreadResponseSchema.parse(simplifiedResponse);
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

    // Limit the number of comments and their length for Groq analysis
    const limitedComments = comments.items
      .slice(0, MAX_COMMENTS_TO_ANALYZE)
      .map(item => sanitizeText(item.snippet.topLevelComment.snippet.textOriginal, MAX_COMMENT_LENGTH))
      .filter(Boolean)
      .join('\n\n');

    if (!limitedComments) {
      return { success: false, error: 'No valid comments to analyze' };
    }

    const analysis = await generateCommentAnalysis(videoTitle, limitedComments);

    // Add sentiment analysis to sources but only store the content and sentiment
    const sourcesWithSentiment = comments.items.map(item => ({
      content: sanitizeText(item.snippet.topLevelComment.snippet.textOriginal, MAX_COMMENT_LENGTH),
      sentiment: analyzeSentiment(item.snippet.topLevelComment.snippet.textOriginal)
    }));

    return {
      success: true,
      data: {
        analysis: JSON.parse(analysis),
        sources: sourcesWithSentiment,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Comment analysis error:', error);
    return { success: false, error: errorMessage };
  }
}

// Simple sentiment analysis function (placeholder - in production, use a proper NLP library or API)
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const positiveWords = ['great', 'good', 'awesome', 'excellent', 'love', 'amazing', 'best', 'perfect', 'helpful', 'wonderful'];
  const negativeWords = ['bad', 'worst', 'terrible', 'awful', 'hate', 'disappointing', 'horrible', 'useless', 'poor', 'waste'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  if (positiveCount > 0 && negativeCount > 0) {
    return positiveCount > negativeCount ? 'mixed' : 'mixed';
  } else if (positiveCount > 0) {
    return 'positive';
  } else if (negativeCount > 0) {
    return 'negative';
  }
  return 'neutral';
}

async function generateCommentAnalysis(videoTitle: string, commentText: string): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  // Simplified prompt - focusing only on essential analysis
  const analysisPrompt = {
    role: 'system',
    content: `Analyze the provided YouTube comments for the video titled "${videoTitle}" and generate a focused analysis in the following JSON format:

{
  "overview": "Executive summary of the comment analysis using sophisticated content creator terminology",
  "sentimentAnalysis": {
    "overall": "positive/negative/neutral/mixed",
    "score": "Numerical value from -10 to 10, where -10 is extremely negative and 10 is extremely positive",
    "distribution": {
      "positive": "Percentage of positive comments (0-100)",
      "negative": "Percentage of negative comments (0-100)",
      "neutral": "Percentage of neutral comments (0-100)"
    },
    "trends": [
      {
        "topic": "Specific aspect of the content being discussed",
        "sentiment": "positive/negative/neutral/mixed",
        "intensity": "Numerical value 1-10 indicating strength of sentiment"
      }
    ] (exactly 3 items)
  },
  "painPoints": [
    {
      "title": "Clear, impactful title of the issue or concern",
      "description": "Detailed analysis of the viewer feedback using content creator psychology terms",
      "frequency": "Numerical value 1-10 indicating how often this appears",
      "impact": "Numerical value 1-10 indicating severity",
      "sentiment": "positive/negative/neutral/mixed",
      "possibleSolutions": ["Array of 2-3 potential content improvements"]
    }
  ] (exactly 3 items),
  "userExperiences": [
    {
      "scenario": "Detailed description of the viewer experience",
      "impact": "Analysis of how this experience affects viewer engagement",
      "frequencyPattern": "Pattern of occurrence and context",
      "sentiment": "positive/negative/neutral/mixed"
    }
  ] (exactly 2 items),
  "emotionalTriggers": [
    {
      "trigger": "Name of the emotional trigger",
      "context": "Detailed context where this trigger appears",
      "intensity": "Numerical value 1-10",
      "responsePattern": "Typical viewer response to this trigger",
      "dominantEmotion": "Primary emotion associated with this trigger"
    }
  ] (exactly 2 items),
  "marketImplications": "Strategic insights for content creation based on sentiment patterns"
}`
  };

  const payload = {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',    
    messages: [
      analysisPrompt,
      {
        role: 'user',
        content: commentText,
      },
    ],
    temperature: 0.7,
    max_tokens: 2500, // Reduced token limit
    response_format: { type: 'json_object' },
  };

  type GroqResponse = {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
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

    const data = await response.json() as GroqResponse;
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
function sanitizeText(text: string, maxLength: number = 300): string {
  if (!text) return '';
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  const truncated = sanitized.substring(0, maxLength);
  return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
}