import { useState } from 'react';

// Twitter API Response Types
interface TwitterAPITweet {
  tweet_id?: string;
  text?: string;
  created_at?: string;
  screen_name?: string;
  followers_count?: number;
  profile_url?: string;
  retweets?: number;
  favorites?: number;
  replies?: number;
}

interface TwitterAPIResponse {
  timeline?: TwitterAPITweet[];
  status?: string;
}

// Simplified Tweet Types for Analysis
interface SimplifiedTweet {
  content: string;
  engagement: number;
  created_at: string;
}

// Analysis Result Types
interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface ContentPattern {
  pattern: string;
  description: string;
  frequency: number;
  examples: string[];
}

interface TopTweet {
  content: string;
  engagement: number;
  reason: string;
}

interface MarketInsights {
  userSentiment: string;
  actionableInsights: string[];
}

interface Analysis {
  overview: string;
  sentimentAnalysis: SentimentAnalysis;
  contentPatterns: ContentPattern[];
  engagement: {
    topTweets: TopTweet[];
  };
  marketInsights: MarketInsights;
}

interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: Analysis;
    sources: SimplifiedTweet[];
    timestamp: string;
  };
  error?: string;
}

export class TwitterAnalysisService {
  private static readonly CONFIG = {
    TWITTER_API_URL: 'https://twitter-api45.p.rapidapi.com/search.php',
    TIMEOUT: 30000,
    MAX_TWEETS: 20,
    MAX_TWEETS_FOR_ANALYSIS: 10,
    MAX_CONTENT_LENGTH: 100,
    GROQ_MODEL: 'mixtral-8x7b-32768',
    API_KEYS: {
      RAPID_API: process.env.NEXT_PUBLIC_XRAPID_API_KEY,
      GROQ: process.env.NEXT_PUBLIC_GROQ_API_KEY
    },
    RETRY: {
      MAX_ATTEMPTS: 3,
      INITIAL_BACKOFF: 2000,
      MAX_BACKOFF: 15000,
    }
  };

  private static async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number = this.CONFIG.TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private static async makeRequest(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await this.fetchWithTimeout(url, options);
      
      if (response.status === 429 && attempt < this.CONFIG.RETRY.MAX_ATTEMPTS) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        const backoff = Math.max(
          retryAfter * 1000,
          Math.min(
            this.CONFIG.RETRY.INITIAL_BACKOFF * Math.pow(2, attempt - 1),
            this.CONFIG.RETRY.MAX_BACKOFF
          )
        );
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.makeRequest(url, options, attempt + 1);
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error && 
          error.name === 'AbortError' && 
          attempt < this.CONFIG.RETRY.MAX_ATTEMPTS) {
        await new Promise(resolve => 
          setTimeout(resolve, this.CONFIG.RETRY.INITIAL_BACKOFF * Math.pow(2, attempt - 1))
        );
        return this.makeRequest(url, options, attempt + 1);
      }
      throw error;
    }
  }

  public static async analyzeTweets(query: string): Promise<AnalysisResult> {
    try {
      if (!query?.trim()) {
        return { success: false, error: 'Query cannot be empty' };
      }

      if (!this.CONFIG.API_KEYS.RAPID_API || !this.CONFIG.API_KEYS.GROQ) {
        return { success: false, error: 'API keys not configured' };
      }

      const searchUrl = new URL(this.CONFIG.TWITTER_API_URL);
      searchUrl.searchParams.append('query', query);
      searchUrl.searchParams.append('count', this.CONFIG.MAX_TWEETS.toString());

      const twitterResponse = await this.makeRequest(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.CONFIG.API_KEYS.RAPID_API,
          'x-rapidapi-host': new URL(this.CONFIG.TWITTER_API_URL).hostname
        }
      });

      if (!twitterResponse.ok) {
        throw new Error(`Twitter API error: ${twitterResponse.status}`);
      }

      const data: TwitterAPIResponse = await twitterResponse.json();
      
      if (!data?.timeline || !Array.isArray(data.timeline)) {
        throw new Error('Invalid Twitter API response format');
      }

      const tweets = data.timeline
        .filter((tweet: TwitterAPITweet): tweet is Required<Pick<TwitterAPITweet, 'text'>> => 
          Boolean(tweet?.text))
        .map((tweet: TwitterAPITweet): SimplifiedTweet => ({
          content: this.sanitizeText(tweet.text || '', this.CONFIG.MAX_CONTENT_LENGTH),
          engagement: (tweet.retweets || 0) + (tweet.favorites || 0) + (tweet.replies || 0),
          created_at: tweet.created_at || new Date().toISOString()
        }))
        .sort((a: SimplifiedTweet, b: SimplifiedTweet) => b.engagement - a.engagement)
        .slice(0, this.CONFIG.MAX_TWEETS_FOR_ANALYSIS);

      if (tweets.length === 0) {
        return { success: false, error: 'No valid tweets found' };
      }

      const analysisContext = {
        query,
        sampleSize: tweets.length,
        tweets: tweets.map(t => ({
          content: t.content,
          engagement: t.engagement
        }))
      };

      const groqResponse = await this.makeRequest(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.CONFIG.API_KEYS.GROQ}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.CONFIG.GROQ_MODEL,
            messages: [
              {
                role: 'system',
                content: this.getAnalysisPrompt(query)
              },
              {
                role: 'user',
                content: JSON.stringify(analysisContext)
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          })
        }
      );

      if (!groqResponse.ok) {
        throw new Error(`Groq API error: ${groqResponse.status}`);
      }

      const result = await groqResponse.json();
      const analysis = result.choices[0].message.content;

      return {
        success: true,
        data: {
          analysis: JSON.parse(analysis),
          sources: tweets,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Analysis error:', error);
      return { success: false, error: errorMessage };
    }
  }

  private static getAnalysisPrompt(query: string): string {
    return `Analyze these tweets about "${query}" and provide a concise analysis as JSON:
{
  "overview": "Brief executive summary",
  "sentimentAnalysis": {
    "score": "Number -1 to 1",
    "label": "positive/negative/neutral",
    "confidence": "0-1"
  },
  "contentPatterns": [
    {
      "pattern": "Pattern name",
      "description": "Brief description",
      "frequency": "1-10",
      "examples": ["1-2 examples"]
    }
  ] (2 items),
  "engagement": {
    "topTweets": [
      {
        "content": "Tweet content",
        "engagement": "Number",
        "reason": "Brief reason"
      }
    ] (2 items)
  },
  "marketInsights": {
    "userSentiment": "Brief sentiment analysis",
    "actionableInsights": ["2-3 recommendations"]
  }
}`;
  }

  private static sanitizeText(text: string, maxLength: number = 280): string {
    if (!text) return '';
    let sanitized = text.replace(/\s+/g, ' ').trim();
    return sanitized.length <= maxLength ? sanitized : 
           sanitized.substring(0, maxLength - 3) + '...';
  }
}

export const useTwitterAnalysis = () => {
  const [data, setData] = useState<AnalysisResult['data'] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (query: string): Promise<AnalysisResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await TwitterAnalysisService.analyzeTweets(query);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Analysis failed');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, analyze };
};