import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// Rate limiting configuration
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

// Comment schema definition
const YouTubeCommentSchema = z.object({
  snippet: z.object({
    topLevelComment: z.object({
      snippet: z.object({
        textDisplay: z.string(),
        textOriginal: z.string(),
        authorDisplayName: z.string(),
        authorProfileImageUrl: z.string().optional(),
        authorChannelUrl: z.string().optional(),
        likeCount: z.number(),
        publishedAt: z.string(),
      })
    })
  })
});

const YouTubeCommentsResponseSchema = z.object({
  items: z.array(YouTubeCommentSchema),
  nextPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number()
  })
});

// Type definitions
type YouTubeComment = z.infer<typeof YouTubeCommentSchema>;
type YouTubeCommentsResponse = z.infer<typeof YouTubeCommentsResponseSchema>;

// Error class with specific codes
class YouTubeApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'YouTubeApiError';
  }
}

// Request tracking for rate limiting
const requestTracker = {
  lastRequest: 0,
  requestCount: 0,
  reset(): void {
    this.requestCount = 0;
    this.lastRequest = Date.now();
  },
  canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequest >= 60000) { // Reset after 1 minute
      this.reset();
      return true;
    }
    return this.requestCount < 5; // Max 5 requests per minute
  },
  trackRequest(): void {
    this.requestCount++;
    this.lastRequest = Date.now();
  }
};

interface CommentsFetchOptions {
  maxResults?: number;
  pageToken?: string;
}

// Helper function to delay execution
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper function to determine if error is retryable
const isRetryableError = (error: any): boolean => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 429 || status === 503 || status === 500;
  }
  return false;
};

// Main fetch function with retries and rate limiting
export async function fetchVideoComments(
  videoId: string,
  options: CommentsFetchOptions = {},
  retryCount: number = 0
): Promise<{
  comments: Array<{
    text: string;
    author: string;
    authorImage?: string;
    authorChannel?: string;
    likes: number;
    publishedDate: string;
  }>;
  nextPageToken?: string;
  totalResults: number;
}> {
  const RAPID_API_KEY = process.env.NEXT_PUBLIC_RAPID_YT_API_KEY;
  const RAPID_API_HOST = 'youtube-api-full.p.rapidapi.com';

  if (!RAPID_API_KEY) {
    throw new YouTubeApiError(
      'RapidAPI key is not configured',
      'CONFIG_ERROR',
      undefined,
      false
    );
  }

  // Check rate limiting
  if (!requestTracker.canMakeRequest()) {
    const waitTime = 60000 - (Date.now() - requestTracker.lastRequest);
    await delay(waitTime);
  }

  try {
    requestTracker.trackRequest();

    const response = await axios.get('https://youtube-api-full.p.rapidapi.com/video/comments', {
      params: {
        id: "tmrdRJo540w",
        maxResults: options.maxResults || 20,
        pageToken: options.pageToken || '',
        textFormat: 'plainText'
      },
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST
      },
      timeout: 10000 // 10 second timeout
    });

    const validatedResponse = YouTubeCommentsResponseSchema.parse(response.data);

    return {
      comments: validatedResponse.items.map(item => ({
        text: item.snippet.topLevelComment.snippet.textOriginal,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        authorImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
        authorChannel: item.snippet.topLevelComment.snippet.authorChannelUrl,
        likes: item.snippet.topLevelComment.snippet.likeCount,
        publishedDate: item.snippet.topLevelComment.snippet.publishedAt
      })),
      nextPageToken: validatedResponse.nextPageToken,
      totalResults: validatedResponse.pageInfo.totalResults
    };

  } catch (error) {
    // Handle specific error types
    if (error instanceof z.ZodError) {
      throw new YouTubeApiError(
        'Invalid response format from YouTube API',
        'PARSE_ERROR',
        undefined,
        false
      );
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const retryable = isRetryableError(error);

      // Handle rate limiting
      if (status === 429) {
        if (retryCount < MAX_RETRIES) {
          await delay(RETRY_DELAY * (retryCount + 1));
          return fetchVideoComments(videoId, options, retryCount + 1);
        }
      }

      throw new YouTubeApiError(
        error.response?.data?.message || 'Failed to fetch comments',
        status === 429 ? 'RATE_LIMIT_ERROR' : 'API_ERROR',
        status,
        retryable
      );
    }

    // Handle unknown errors
    throw new YouTubeApiError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      undefined,
      false
    );
  }
}

// Export types for use in components
export type { YouTubeComment, YouTubeCommentsResponse };

// Interval to reset request tracker
setInterval(() => {
  requestTracker.reset();
}, 60000); // Reset every minute