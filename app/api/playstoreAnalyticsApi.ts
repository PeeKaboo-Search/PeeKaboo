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
        }>;
      };
      painPoints: Array<{
        title: string;
        description: string;
        frequency: number;
        impact: number;
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        possibleSolutions: string[];
      }>;
      userExperiences: Array<{
        scenario: string;
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        impact: string;
        frequencyPattern: string;
      }>;
      marketImplications: string;
    };
    sources: Array<{
      id: string;
      content: string;
      sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    }>;
  };
}

const API_HOST = 'store-apps.p.rapidapi.com';
const API_KEY = '3fe4222f05mshee7786231fb68c8p1cae9bjsnaeb6f8469718';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || 'your-groq-api-key';

export const searchApps = async (query: string): Promise<AppBasic[]> => {
  try {
    const url = `https://${API_HOST}/search?q=${encodeURIComponent(query)}&limit=10`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search apps: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status !== "OK" || !result.data || !result.data.apps) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data.apps.map((app: any) => ({
      app_id: app.app_id,
      app_name: app.app_name,
      app_icon: app.app_icon || '', // Using direct app_icon field from the response
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get app details: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status !== "OK" || !result.data) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data as App;
    
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get app reviews: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status !== "OK" || !result.data || !result.data.reviews) {
      throw new Error('Invalid response format from API');
    }
    
    return result.data.reviews as Review[];
    
  } catch (error) {
    console.error('Error getting app reviews:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get app reviews');
  }
};

export const analyzeAppReviews = async (
  appId: string, 
  appName: string,
  numberOfReviews: number = 10
): Promise<ReviewAnalysis> => {
  try {
    const reviews = await getAppReviews(appId, numberOfReviews);
    
    if (reviews.length === 0) {
      return {
        success: false,
        error: 'No reviews available for analysis'
      };
    }
    
    const reviewsForAnalysis = reviews.map(review => ({
      id: review.review_id,
      rating: review.review_rating,
      text: review.review_text,
      timestamp: review.review_timestamp,
      date: review.review_datetime_utc,
      version: review.author_app_version
    }));
    
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    const groqResponse = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-qwen-32b",
        messages: [
          {
            role: "system",
            content: `You are an expert app review analyst. You will analyze app reviews to provide insights about user sentiment, pain points, and product opportunities. Reply with JSON only.`
          },
          {
            role: "user",
            content: `Analyze these reviews for the app "${appName}" (ID: ${appId}). Extract key insights, sentiment, and pain points. Format your analysis exactly according to this JSON schema:
            {
              "appId": "string",
              "appName": "string",
              "analysis": {
                "overview": "string",
                "sentimentAnalysis": {
                  "overall": "positive|negative|neutral|mixed",
                  "score": number,
                  "distribution": {
                    "positive": number,
                    "neutral": number,
                    "negative": number
                  },
                  "trends": [
                    {
                      "topic": "string",
                      "sentiment": "positive|negative|neutral|mixed",
                      "intensity": number
                    }
                  ]
                },
                "painPoints": [
                  {
                    "title": "string",
                    "description": "string",
                    "frequency": number,
                    "impact": number,
                    "sentiment": "positive|negative|neutral|mixed",
                    "possibleSolutions": ["string"]
                  }
                ],
                "userExperiences": [
                  {
                    "scenario": "string",
                    "sentiment": "positive|negative|neutral|mixed",
                    "impact": "string",
                    "frequencyPattern": "string"
                  }
                ],
                "marketImplications": "string"
              },
              "sources": [
                {
                  "id": "string",
                  "content": "string",
                  "sentiment": "positive|negative|neutral|mixed"
                }
              ]
            }
            
            Reviews: ${JSON.stringify(reviewsForAnalysis)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4500,
        response_format: { type: 'json_object' },
      })
    });
    
    if (!groqResponse.ok) {
      console.error('Groq analysis failed:', await groqResponse.text());
      throw new Error(`Failed to analyze reviews: ${groqResponse.status}`);
    }
    
    const analysisResult = await groqResponse.json();
    
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