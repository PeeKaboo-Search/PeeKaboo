import { z } from 'zod';

// API Response types
interface PlayStoreReview {
  reviewer: string;
  score: number;
  text: string;
  timestamp: string;
  avatar?: string;
  version?: string;
  reply?: string;
  reply_timestamp?: string;
  respondent?: string;
  useful?: number;
}

interface PlayStoreAppData {
  title: string;
  score: number;
  ratings: number;
  reviews: PlayStoreReview[];
  description: string;
  installs: string;
  developer: string;
  icon?: string;
  genre?: string;
  price?: {
    currency: string;
    value: number;
  };
}

// Review schema
const ReviewSchema = z.object({
  avatar: z.string().optional(),
  score: z.number().min(1).max(5),
  reviewer: z.string(),
  text: z.string(),
  timestamp: z.string(),
  version: z.string().optional(),
  reply: z.string().optional(),
  reply_timestamp: z.string().optional(),
  respondent: z.string().optional(),
  useful: z.number().optional(),
});

// App details schema
const AppDetailsSchema = z.object({
  title: z.string(),
  description: z.string(),
  score: z.number(),
  ratings: z.number(),
  reviews: z.array(ReviewSchema),
  installs: z.string(),
  developer: z.string(),
  icon: z.string().optional(),
  genre: z.string().optional(),
  price: z.object({
    currency: z.string(),
    value: z.number()
  }).optional(),
});

// Analytics schema
export const AppAnalyticsSchema = z.object({
  appName: z.string(),
  overallRating: z.number(),
  totalReviews: z.number(),
  topReviews: z.array(z.object({
    username: z.string(),
    rating: z.number(),
    comment: z.string(),
    date: z.string(),
  })),
  insights: z.object({
    positiveHighlights: z.array(z.string()),
    negativeComplaints: z.array(z.string()),
    featureSuggestions: z.array(z.string()),
  }),
});

export type AppAnalytics = z.infer<typeof AppAnalyticsSchema>;

// Helper function to extract insights from reviews
const extractInsights = (reviews: PlayStoreReview[]) => {
  const insights = {
    positiveHighlights: [] as string[],
    negativeComplaints: [] as string[],
    featureSuggestions: [] as string[],
  };

  reviews.forEach(review => {
    const text = review.text.toLowerCase();
    if (review.score >= 4) {
      insights.positiveHighlights.push(review.text);
    } else if (review.score <= 2) {
      insights.negativeComplaints.push(review.text);
    }
    if (text.includes('suggest') || text.includes('would be nice') || text.includes('should add')) {
      insights.featureSuggestions.push(review.text);
    }
  });

  return {
    positiveHighlights: insights.positiveHighlights.slice(0, 5),
    negativeComplaints: insights.negativeComplaints.slice(0, 5),
    featureSuggestions: insights.featureSuggestions.slice(0, 5),
  };
};

export const fetchPlayStoreAnalytics = async (query: string): Promise<AppAnalytics> => {
  const url = 'https://google-play-store-scraper-api.p.rapidapi.com/search-apps';
  
  try {
    // Step 1: Search for the app
    const searchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_PLAYSTORE_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'google-play-store-scraper-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: 'en',
        country: 'us',
        keyword: query
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed with status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.data || !searchData.data.length) {
      throw new Error('No results found');
    }

    const appData = searchData.data[0] as PlayStoreAppData;
    const reviews = appData.reviews || [];

    // Transform the data to match our schema
    const analytics: AppAnalytics = {
      appName: appData.title || query,
      overallRating: Number(appData.score) || 0,
      totalReviews: Number(appData.ratings) || 0,
      topReviews: reviews.slice(0, 5).map((review: PlayStoreReview) => ({
        username: review.reviewer || 'Anonymous',
        rating: review.score || 0,
        comment: review.text || '',
        date: review.timestamp || new Date().toISOString(),
      })),
      insights: extractInsights(reviews)
    };

    return AppAnalyticsSchema.parse(analytics);

  } catch (error) {
    console.error('Error fetching Play Store analytics:', error);
    throw error;
  }
};