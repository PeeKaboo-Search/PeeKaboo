// /app/api/playstoreAnalyticsApi.ts

export interface AppBasic {
  app_id: string;
  app_name: string;
  app_icon: string;
  app_category?: string;
  rating?: number;
}

export interface App extends AppBasic {
  app_category: string;
  app_category_id: string;
  app_developer: string;
  num_downloads: string;
  app_description: string;
  app_page_link: string;
  price: number;
  price_currency: string | null;
  is_paid: boolean;
  rating: number;
  photos: {
    app_icon: string;
    trailer: string | null;
  };
  num_downloads_exact: number;
  app_content_rating: string;
  chart_label: string | null;
  chart_rank: string | null;
  app_updated_at_timestamp: number;
  app_updated_at_datetime_utc: string;
  num_ratings: number;
  num_reviews: number;
  app_first_released_at_datetime_utc: string;
  app_first_released_at_timestamp: number;
  current_version: string | null;
  current_version_released_at_timestamp: number | null;
  current_version_released_at_datetime_utc: string | null;
  current_version_whatsnew: string | null;
  contains_ads: boolean;
  privacy_policy_link: string | null;
  app_developer_website: string | null;
  app_developer_email: string | null;
}

export interface Review {
  review_id: string;
  review_text: string;
  review_rating: number;
  author_id: string;
  author_name: string;
  author_photo: string;
  author_app_version: string;
  review_timestamp: number;
  review_datetime_utc: string;
  review_likes: number;
  app_developer_reply: string | null;
  app_developer_reply_timestamp: number | null;
  app_developer_reply_datetime_utc: string | null;
}

export interface ReviewAnalysis {
  success: boolean;
  error?: string;
  data?: {
    appId: string;
    appName: string;
    analysis: {
      overview: string;
      sentimentAnalysis: {
        overall: 'positive' | 'negative' | 'neutral' | 'mixed';
        score: number;
        distribution: {
          positive: number;
          neutral: number;
          negative: number;
        };
        trends: Array<{
          topic: string;
          sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
          intensity: number;
          examples: string[];
        }>;
      };
      painPoints: Array<{
        title: string;
        description: string;
        frequency: number;
        impact: number;
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        possibleSolutions: string[];
        reviewExamples: string[];
      }>;
      userExperiences: Array<{
        scenario: string;
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        impact: string;
        frequencyPattern: string;
        userQuotes: string[];
      }>;
      featureRequests: Array<{
        feature: string;
        description: string;
        demand: number;
        businessValue: number;
        implementationComplexity: 'low' | 'medium' | 'high';
      }>;
      competitiveAnalysis: {
        comparisonMentions: Array<{
          competitor: string;
          sentiment: 'positive' | 'negative' | 'neutral';
          context: string;
        }>;
        advantageGaps: string[];
      };
      versionTrends: {
        improvementAreas: string[];
        regressedFeatures: string[];
      };
      marketImplications: string;
      actionableRecommendations: string[];
    };
    sources: Array<{
      id: string;
      content: string;
      sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
      version: string;
      rating: number;
    }>;
  };
}

// Define interfaces for API responses
interface SearchApiResponse {
  status: string;
  data: {
    apps: Array<{
      app_id: string;
      app_name: string;
      app_icon: string;
      app_category?: string;
      rating?: number;
    }>;
  };
}

interface ReviewsApiResponse {
  status: string;
  data: {
    reviews: Review[];
  };
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

interface ReviewForAnalysis {
  id: string;
  rating: number;
  text: string;
  timestamp: number;
  date: string;
  version: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
}

const API_HOST = 'store-apps.p.rapidapi.com';
const API_KEY = process.env.NEXT_PUBLIC_PRAPID_API_KEY;
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export const searchApps = async (query: string): Promise<AppBasic[]> => {
  try {
    const url = `https://${API_HOST}/search?q=${encodeURIComponent(query)}&limit=10`;
    
    // Fix: Use Record<string, string> for headers to satisfy HeadersInit type
    const headers: Record<string, string> = {
      'x-rapidapi-key': API_KEY || '',
      'x-rapidapi-host': API_HOST
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search apps: ${response.status}`);
    }
    
    const result = await response.json() as SearchApiResponse;
    
    if (result.status !== "OK" || !result.data || !result.data.apps) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data.apps.map((app) => ({
      app_id: app.app_id,
      app_name: app.app_name,
      app_icon: app.app_icon || '',
      app_category: app.app_category,
      rating: app.rating
    }));
    
  } catch (error) {
    console.error('Error searching apps:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to search apps');
  }
};

export const getAppDetails = async (appId: string): Promise<App> => {
  try {
    const url = `https://${API_HOST}/app-details?app_id=${encodeURIComponent(appId)}`;
    
    // Fix: Use Record<string, string> for headers to satisfy HeadersInit type
    const headers: Record<string, string> = {
      'x-rapidapi-key': API_KEY || '',
      'x-rapidapi-host': API_HOST
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get app details: ${response.status}`);
    }
    
    const result = await response.json() as ApiResponse<App>;
    
    if (result.status !== "OK" || !result.data) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Error getting app details:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get app details');
  }
};

export const getAppReviews = async (
  appId: string, 
  limit: number = 20, 
  sortBy: 'MOST_RELEVANT' | 'NEWEST' = 'MOST_RELEVANT',
  rating: 'ANY' | '1' | '2' | '3' | '4' | '5' = 'ANY'
): Promise<Review[]> => {
  try {
    const url = `https://${API_HOST}/app-reviews?app_id=${encodeURIComponent(appId)}&limit=${limit}&sort_by=${sortBy}&device=PHONE&rating=${rating}&region=us&language=en`;
    
    // Fix: Use Record<string, string> for headers to satisfy HeadersInit type
    const headers: Record<string, string> = {
      'x-rapidapi-key': API_KEY || '',
      'x-rapidapi-host': API_HOST
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get app reviews: ${response.status}`);
    }
    
    const result = await response.json() as ReviewsApiResponse;
    
    if (result.status !== "OK" || !result.data || !result.data.reviews) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data.reviews;
    
  } catch (error) {
    console.error('Error getting app reviews:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get app reviews');
  }
};

export const analyzeAppReviews = async (
  appId: string, 
  appName: string,
  numberOfReviews: number = 50
): Promise<ReviewAnalysis> => {
  try {
    // Get a mix of reviews for better analysis - most relevant plus newest plus some negative reviews
    const mostRelevantReviews = await getAppReviews(appId, Math.floor(numberOfReviews * 0.4), 'MOST_RELEVANT');
    const newestReviews = await getAppReviews(appId, Math.floor(numberOfReviews * 0.3), 'NEWEST');
    
    // Get some negative reviews specifically (ratings 1-3)
    const negativeReviews1 = await getAppReviews(appId, Math.floor(numberOfReviews * 0.1), 'MOST_RELEVANT', '1');
    const negativeReviews2 = await getAppReviews(appId, Math.floor(numberOfReviews * 0.1), 'MOST_RELEVANT', '2');
    const negativeReviews3 = await getAppReviews(appId, Math.floor(numberOfReviews * 0.1), 'MOST_RELEVANT', '3');
    
    // Combine and deduplicate reviews
    const allReviews = [...mostRelevantReviews, ...newestReviews, ...negativeReviews1, ...negativeReviews2, ...negativeReviews3];
    const uniqueReviews = Array.from(new Map(allReviews.map(review => [review.review_id, review])).values());
    
    if (uniqueReviews.length === 0) {
      return {
        success: false,
        error: 'No reviews available for analysis'
      };
    }
    
    // Get app details for additional context
    let appDetails: App | null = null;
    try {
      appDetails = await getAppDetails(appId);
    } catch (error) {
      console.warn('Could not fetch app details:', error);
    }
    
    const reviewsForAnalysis: ReviewForAnalysis[] = uniqueReviews.map(review => ({
      id: review.review_id,
      rating: review.review_rating,
      text: review.review_text,
      timestamp: review.review_timestamp,
      date: review.review_datetime_utc,
      version: review.author_app_version
    }));
    
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    const groqHeaders: Record<string, string> = {
      'Authorization': `Bearer ${GROQ_API_KEY || ''}`,
      'Content-Type': 'application/json'
    };
    
    const systemPrompt = `You are an expert product analyst specializing in mobile app reviews. 
Your task is to provide deep, actionable insights from user reviews that can guide product decisions.

Guidelines:
1. Analyze reviews for patterns, themes, and sentiment trends
2. Prioritize issues by frequency and impact on user experience
3. Identify specific feature requests and improvement opportunities
4. Extract user quotes that exemplify key points
5. Note version-specific issues or improvements
6. Identify competitive advantages or disadvantages mentioned
7. Provide actionable recommendations based on the data

Be precise and data-driven in your analysis. Respond only with JSON in the exact format requested.`;

    const userPrompt = `Analyze these ${reviewsForAnalysis.length} reviews for the app "${appName}" (ID: ${appId}).
${appDetails ? `
App Category: ${appDetails.app_category}
Downloads: ${appDetails.num_downloads}
Current Version: ${appDetails.current_version || 'Unknown'}
Release Date: ${appDetails.app_first_released_at_datetime_utc}
Last Updated: ${appDetails.app_updated_at_datetime_utc}
` : ''}

I need comprehensive insights that can directly inform product decisions. Focus on:
- Clear patterns in user feedback (positive and negative)
- Specific pain points with concrete examples
- Feature requests with assessment of potential business value
- Version-specific issues or improvements
- Competitive mentions and comparative feedback
- Precise, actionable recommendations

Analyze version trends if version information is available in reviews.

Format your response exactly according to this JSON schema:
{
  "appId": "string",
  "appName": "string",
  "analysis": {
    "overview": "string - A concise executive summary of the key insights",
    "sentimentAnalysis": {
      "overall": "positive|negative|neutral|mixed",
      "score": "number - normalized sentiment score from -1 to 1",
      "distribution": {
        "positive": "number - percentage of positive reviews",
        "neutral": "number - percentage of neutral reviews",
        "negative": "number - percentage of negative reviews"
      },
      "trends": [
        {
          "topic": "string - specific aspect or feature mentioned",
          "sentiment": "positive|negative|neutral|mixed",
          "intensity": "number from 0-10 indicating strength of sentiment",
          "examples": ["string - direct user quotes illustrating this trend"]
        }
      ]
    },
    "painPoints": [
      {
        "title": "string - concise name of the issue",
        "description": "string - detailed explanation of the problem",
        "frequency": "number from 0-10 indicating how often this appears",
        "impact": "number from 0-10 indicating severity for users",
        "sentiment": "positive|negative|neutral|mixed",
        "possibleSolutions": ["string - concrete actionable solutions"],
        "reviewExamples": ["string - direct quotes from reviews mentioning this issue"]
      }
    ],
    "userExperiences": [
      {
        "scenario": "string - specific use case or user journey described",
        "sentiment": "positive|negative|neutral|mixed",
        "impact": "string - how this affects the overall user experience",
        "frequencyPattern": "string - when/how often this occurs",
        "userQuotes": ["string - direct quotes describing this experience"]
      }
    ],
    "featureRequests": [
      {
        "feature": "string - name of requested feature",
        "description": "string - detailed explanation of what users want",
        "demand": "number from 0-10 indicating frequency of requests",
        "businessValue": "number from 0-10 indicating potential value",
        "implementationComplexity": "low|medium|high"
      }
    ],
    "competitiveAnalysis": {
      "comparisonMentions": [
        {
          "competitor": "string - name of competing app mentioned",
          "sentiment": "positive|negative|neutral",
          "context": "string - context of the comparison"
        }
      ],
      "advantageGaps": ["string - areas where competitors are mentioned as better"]
    },
    "versionTrends": {
      "improvementAreas": ["string - features that have improved over versions"],
      "regressedFeatures": ["string - features that have gotten worse"]
    },
    "marketImplications": "string - broader market context and opportunity",
    "actionableRecommendations": ["string - specific, prioritized action items"]
  },
  "sources": [
    {
      "id": "string - review ID",
      "content": "string - review text",
      "sentiment": "positive|negative|neutral|mixed",
      "version": "string - app version",
      "rating": "number - star rating"
    }
  ]
}

Here are the reviews to analyze: ${JSON.stringify(reviewsForAnalysis)}`;
    
    const groqResponse = await fetch(groqUrl, {
      method: 'POST',
      headers: groqHeaders,
      body: JSON.stringify({
        model: "deepseek-r1-distill-qwen-32b", // Using the specified model
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 4500,
        response_format: { type: 'json_object' },
      })
    });
    
    if (!groqResponse.ok) {
      console.error('Groq analysis failed:', await groqResponse.text());
      throw new Error(`Failed to analyze reviews: ${groqResponse.status}`);
    }
    
    const analysisResult = await groqResponse.json() as GroqResponse;
    
    if (!analysisResult.choices || !analysisResult.choices[0]?.message?.content) {
      throw new Error('Invalid response from Groq');
    }
    
    try {
      const analysisData = JSON.parse(analysisResult.choices[0].message.content);
      
      return {
        success: true,
        data: analysisData
      };
      
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError);
      return {
        success: false,
        error: 'Failed to parse analysis results'
      };
    }
    
  } catch (error) {
    console.error('Error analyzing app reviews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze app reviews'
    };
  }
};