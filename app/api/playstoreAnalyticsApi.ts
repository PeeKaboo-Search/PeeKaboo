import axios from 'axios';
import { z } from 'zod';

// Zod schemas for app data - updated to match actual API response
const AppBasicSchema = z.object({
  app_id: z.string(),
  app_name: z.string(),
  app_icon: z.string().optional()
});

const PhotosSchema = z.union([
  z.object({
    app_icon: z.string()
  }),
  z.array(z.any())
]).transform(val => {
  // Handle both array and object formats
  if (Array.isArray(val)) {
    // Extract app_icon from array if possible
    const iconObj = val.find(item => item && typeof item === 'object' && 'app_icon' in item);
    return { app_icon: iconObj?.app_icon || '' };
  }
  return val;
});

const AppDetailsSchema = z.object({
  app_id: z.string(),
  app_name: z.string(),
  app_category: z.string(),
  app_category_id: z.string(),
  app_developer: z.string(),
  num_downloads: z.string(),
  app_description: z.string(),
  app_page_link: z.string(),
  price: z.number(),
  price_currency: z.string().nullable(),
  is_paid: z.boolean(),
  rating: z.number(),
  photos: PhotosSchema,
  trailer: z.string().nullable(),
  num_downloads_exact: z.number(),
  app_content_rating: z.string(),
  chart_label: z.string().nullable(),
  chart_rank: z.union([z.string(), z.number()]).nullable(),
  app_updated_at_timestamp: z.number(),
  app_updated_at_datetime_utc: z.string(),
  num_ratings: z.number(),
  num_reviews: z.number(),
  app_first_released_at_datetime_utc: z.string(),
  app_first_released_at_timestamp: z.number(),
  current_version: z.string().nullable(),
  current_version_released_at_timestamp: z.number().nullable(),
  current_version_released_at_datetime_utc: z.string().nullable(),
  current_version_whatsnew: z.string().optional(),
  contains_ads: z.boolean(),
  privacy_policy_link: z.string()
});

const SearchResponseSchema = z.object({
  status: z.string(),
  request_id: z.string(),
  data: z.object({
    apps: z.array(AppDetailsSchema)
  })
});

const ReviewSchema = z.object({
  review_id: z.string(),
  review_text: z.string(),
  review_rating: z.number(),
  author_id: z.string(),
  author_name: z.string(),
  author_photo: z.string(),
  author_app_version: z.string().optional(),
  review_timestamp: z.number(),
  review_datetime_utc: z.string(),
  review_likes: z.number(),
  app_developer_reply: z.string().nullable(),
  app_developer_reply_timestamp: z.number().nullable(),
  app_developer_reply_datetime_utc: z.string().nullable()
});

const ReviewResponseSchema = z.object({
  status: z.string(),
  request_id: z.string(),
  data: z.object({
    reviews: z.array(ReviewSchema)
  })
});

// Enhanced Review Analysis schema with sentiment analysis
export const ReviewAnalysisSchema = z.object({
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
      rating: z.number(),
      sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional()
    })),
    timestamp: z.string()
  }).optional(),
  error: z.string().optional()
});

// Type aliases
export type App = z.infer<typeof AppDetailsSchema>;
export type AppBasic = z.infer<typeof AppBasicSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;

// Constants
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_PRAPID_API_KEY;
const RAPIDAPI_HOST = 'store-apps.p.rapidapi.com';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const TIMEOUT = 30000;
const MAX_REVIEWS_TO_ANALYZE = 50;
const MAX_REVIEW_LENGTH = 500;

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

// Search for apps by query term
export async function searchApps(query: string, region: string = 'US', language: string = 'en'): Promise<AppBasic[]> {
  try {
    const url = `https://store-apps.p.rapidapi.com/search?q=${encodeURIComponent(query)}&region=${region}&language=${language}`;
    
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };
    
    const response = await axios.get(url, options);
    const validatedResponse = SearchResponseSchema.parse(response.data);
    
    // Return simplified app information
    return validatedResponse.data.apps.map(app => {
      const appIcon = typeof app.photos === 'object' && 'app_icon' in app.photos 
        ? app.photos.app_icon 
        : '';
      
      return {
        app_id: app.app_id,
        app_name: app.app_name,
        app_icon: appIcon
      };
    });
  } catch (error) {
    console.error('App search error:', error);
    throw new ApiError(
      'Failed to fetch apps',
      error instanceof Error ? error.message : 'SEARCH_ERROR'
    );
  }
}

// Get reviews for a specific app
export async function getAppReviews(
  appId: string, 
  limit: number = 50, 
  sortBy: string = 'NEWEST', 
  rating: string = 'ANY', 
  region: string = 'us', 
  language: string = 'en'
): Promise<Review[]> {
  try {
    const url = `https://store-apps.p.rapidapi.com/app-reviews?app_id=${appId}&limit=${limit}&sort_by=${sortBy}&device=PHONE&rating=${rating}&region=${region}&language=${language}`;
    
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };
    
    const response = await axios.get(url, options);
    const validatedResponse = ReviewResponseSchema.parse(response.data);
    
    return validatedResponse.data.reviews;
  } catch (error) {
    console.error('App reviews error:', error);
    throw new ApiError(
      'Failed to fetch app reviews',
      error instanceof Error ? error.message : 'REVIEWS_ERROR'
    );
  }
}

// Analyze app reviews
export async function analyzeAppReviews(appId: string, appName: string): Promise<ReviewAnalysis> {
  try {
    if (!appId.trim()) {
      return { success: false, error: 'App ID cannot be empty' };
    }
    
    if (!GROQ_API_KEY) {
      return { success: false, error: 'Groq API key not configured' };
    }

    const reviews = await getAppReviews(appId);
    if (reviews.length === 0) {
      return { success: false, error: 'No reviews found for this app' };
    }

    // Limit the number of reviews and their length for Groq analysis
    const limitedReviews = reviews
      .slice(0, MAX_REVIEWS_TO_ANALYZE)
      .map(review => ({
        text: sanitizeText(review.review_text, MAX_REVIEW_LENGTH),
        rating: review.review_rating
      }))
      .filter(review => Boolean(review.text))
      .map(review => `[Rating: ${review.rating}/5] ${review.text}`)
      .join('\n\n');

    if (!limitedReviews) {
      return { success: false, error: 'No valid reviews to analyze' };
    }

    const analysis = await generateReviewAnalysis(appName, limitedReviews);

    // Add sentiment analysis to sources
    const sourcesWithSentiment = reviews.map(review => ({
      content: sanitizeText(review.review_text, MAX_REVIEW_LENGTH),
      rating: review.review_rating,
      sentiment: analyzeSentiment(review.review_text, review.review_rating)
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
    console.error('Review analysis error:', error);
    return { success: false, error: errorMessage };
  }
}

// Sentiment analysis function that takes rating into account
function analyzeSentiment(text: string, rating: number): 'positive' | 'negative' | 'neutral' | 'mixed' {
  // Consider rating as primary factor
  if (rating >= 4) {
    return 'positive';
  } else if (rating <= 2) {
    return 'negative';
  }
  
  // For 3-star ratings, analyze text content
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
    return 'mixed';
  } else if (positiveCount > negativeCount) {
    return 'positive';
  } else if (negativeCount > positiveCount) {
    return 'negative';
  }
  
  return 'neutral';
}

// Generate analysis using Groq API
async function generateReviewAnalysis(appName: string, reviewText: string): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const analysisPrompt = {
    role: 'system',
    content: `Analyze the provided app reviews for "${appName}" and generate a comprehensive analysis in the following JSON format:

{
  "overview": "Executive summary of the review analysis using sophisticated product development and UX terminology",
  "sentimentAnalysis": {
    "overall": "positive/negative/neutral/mixed",
    "score": "Numerical value from -10 to 10, where -10 is extremely negative and 10 is extremely positive",
    "distribution": {
      "positive": "Percentage of positive reviews (0-100)",
      "negative": "Percentage of negative reviews (0-100)",
      "neutral": "Percentage of neutral reviews (0-100)"
    },
    "trends": [
      {
        "topic": "Specific aspect of the app being discussed",
        "sentiment": "positive/negative/neutral/mixed",
        "intensity": "Numerical value 1-10 indicating strength of sentiment"
      }
    ] (exactly 3 items)
  },
  "painPoints": [
    {
      "title": "Clear, impactful title of the issue or concern",
      "description": "Detailed analysis of the user feedback using UX and product development terminology",
      "frequency": "Numerical value 1-10 indicating how often this appears",
      "impact": "Numerical value 1-10 indicating severity",
      "sentiment": "positive/negative/neutral/mixed",
      "possibleSolutions": ["Array of 2-3 potential improvements"]
    }
  ] (exactly 3 items),
  "userExperiences": [
    {
      "scenario": "Detailed description of the user experience",
      "impact": "Analysis of how this experience affects user engagement",
      "frequencyPattern": "Pattern of occurrence and context",
      "sentiment": "positive/negative/neutral/mixed"
    }
  ] (exactly 3 items),
  "emotionalTriggers": [
    {
      "trigger": "Name of the emotional trigger",
      "context": "Detailed context where this trigger appears",
      "intensity": "Numerical value 1-10",
      "responsePattern": "Typical user response to this trigger",
      "dominantEmotion": "Primary emotion associated with this trigger"
    }
  ] (exactly 3 items),
  "marketImplications": "Strategic insights for product development based on sentiment patterns"
}`
  };

  const payload = {
    model: 'deepseek-r1-distill-qwen-32b',
    messages: [
      analysisPrompt,
      {
        role: 'user',
        content: reviewText,
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
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

// Utility function to sanitize text
function sanitizeText(text: string, maxLength: number = 500): string {
  if (!text) return '';
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  const truncated = sanitized.substring(0, maxLength);
  return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
}