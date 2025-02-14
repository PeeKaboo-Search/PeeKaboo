import { useState } from 'react';

// Types for processed tweets
interface ProcessedTweet {
  id: string;
  text: string;
  created_at: string;
  user: {
    name: string;
    username: string;
  };
  metrics: {
    retweets: number;
    likes: number;
    replies: number;
  };
}

interface AnalysisResult {
  overallSentiment: {
    score: number;
    label: string;
    confidence: number;
    keyPhrases: string[];
  };
  trends: {
    trend: string;
    frequency: number;
    sentiment: number;
    relatedHashtags: string[];
  }[];
  topHashtags: string[];
  engagementMetrics: {
    averageRetweets: number;
    averageLikes: number;
    averageReplies: number;
  };
}

// Configuration
const CONFIG = {
  TWITTER_API_URL: 'https://twitter-api45.p.rapidapi.com/search.php',
  REQUEST_TIMEOUT: 30000,
  MAX_TWEETS: 50,
  MAX_CHARS_PER_TWEET: 280,
  MAX_TOTAL_CHARS: 8000,
  API_KEYS: {
    RAPID_API: process.env.NEXT_PUBLIC_RAPID_API_KEY,
    GROQ: process.env.NEXT_PUBLIC_GROQ_API_KEY
  }
};

export class TwitterAnalysisService {
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = CONFIG.REQUEST_TIMEOUT
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
      throw error;
    }
  }

  private static processTweetText(tweets: any[]): {
    processedTweets: ProcessedTweet[];
    stats: {
      totalTweets: number;
      processedTweets: number;
      totalChars: number;
    };
  } {
    const processedTweets: ProcessedTweet[] = [];
    let totalChars = 0;
    const maxTweets = Math.min(tweets.length, CONFIG.MAX_TWEETS);

    for (let i = 0; i < maxTweets; i++) {
      const tweet = tweets[i];
      
      // Skip if tweet is invalid
      if (!tweet || !tweet.text) continue;

      // Truncate tweet text if needed
      let tweetText = tweet.text;
      if (tweetText.length > CONFIG.MAX_CHARS_PER_TWEET) {
        tweetText = tweetText.substring(0, CONFIG.MAX_CHARS_PER_TWEET) + '...';
      }

      // Check total character limit
      if (totalChars + tweetText.length > CONFIG.MAX_TOTAL_CHARS) {
        break;
      }

      totalChars += tweetText.length;

      // Process tweet into standard format
      processedTweets.push({
        id: tweet.tweet_id || `tweet_${i}`,
        text: tweetText,
        created_at: tweet.created_at || new Date().toISOString(),
        user: {
          name: tweet.screen_name || 'Unknown',
          username: tweet.screen_name || 'unknown'
        },
        metrics: {
          retweets: 0, // Not provided in the response
          likes: tweet.favorites || 0,
          replies: 0 // Not provided in the response
        }
      });
    }

    return {
      processedTweets,
      stats: {
        totalTweets: tweets.length,
        processedTweets: processedTweets.length,
        totalChars
      }
    };
  }

  private static async searchTweets(query: string): Promise<any> {
    if (!CONFIG.API_KEYS.RAPID_API) {
      throw new Error('RapidAPI key not configured');
    }

    const searchUrl = new URL(CONFIG.TWITTER_API_URL);
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('count', CONFIG.MAX_TWEETS.toString());

    try {
      const response = await this.fetchWithTimeout(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': CONFIG.API_KEYS.RAPID_API,
          'x-rapidapi-host': new URL(CONFIG.TWITTER_API_URL).hostname
        }
      });

      const responseText = await response.text();
      
      // Log the raw response for debugging
      console.log('Twitter API Response:', {
        status: response.status,
        text: responseText.substring(0, 200) + '...'
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Twitter API error: ${response.status} ${response.statusText}`,
          rawResponse: responseText
        };
      }

      // Try to parse the response
      try {
        const data = JSON.parse(responseText);

        // Handle the new response format
        if (data.status === 'ok' && Array.isArray(data.timeline)) {
          return { success: true, data: data.timeline };
        } else {
          return { 
            success: false, 
            error: 'Unexpected response format',
            rawResponse: responseText
          };
        }
      } catch (e) {
        return {
          success: false,
          error: 'Failed to parse Twitter API response',
          rawResponse: responseText
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        details: error
      };
    }
  }

  private static async analyzeWithGroq(
    tweets: ProcessedTweet[],
    stats: { totalTweets: number; processedTweets: number; totalChars: number }
  ): Promise<AnalysisResult | null> {
    if (!CONFIG.API_KEYS.GROQ) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Analyze these ${stats.processedTweets} tweets (from a total of ${stats.totalTweets}):

${JSON.stringify(tweets, null, 2)}

Provide a comprehensive analysis including:
1. Overall sentiment (positive/negative/neutral)
2. Key trends and patterns
3. Most engaging topics
4. Common hashtags

Format the response as a JSON object with:
- overallSentiment (score, label, confidence, keyPhrases)
- trends (array of trends with frequency and sentiment)
- topHashtags (array of most used hashtags)
- engagementMetrics (average retweets, likes, replies)`;

    try {
      const response = await this.fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.API_KEYS.GROQ}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
          }),
        }
      );

      const data = await response.json();
      
      try {
        return data?.choices?.[0]?.message?.content
          ? JSON.parse(data.choices[0].message.content)
          : null;
      } catch (e) {
        console.error('Failed to parse Groq response:', data);
        return null;
      }
    } catch (error) {
      console.error('Groq API Error:', error);
      return null;
    }
  }

  public static async analyzeTweets(query: string) {
    try {
      // Validate input
      if (!query?.trim()) {
        return { 
          success: false, 
          error: 'Please provide a search query' 
        };
      }

      // Search tweets
      const searchResult = await this.searchTweets(query);
      
      // If search failed, return the error
      if (!searchResult.success) {
        return searchResult;
      }

      // Process tweets
      const { processedTweets, stats } = this.processTweetText(searchResult.data);

      // If no valid tweets found
      if (processedTweets.length === 0) {
        return {
          success: false,
          error: 'No valid tweets found',
          rawResponse: searchResult
        };
      }

      // Analyze processed tweets
      const analysis = await this.analyzeWithGroq(processedTweets, stats);

      return {
        success: true,
        data: {
          query,
          tweets: processedTweets,
          stats,
          analysis,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        details: error
      };
    }
  }
}

// React hook (unchanged)
export const useTwitterAnalysis = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await TwitterAnalysisService.analyzeTweets(query);
      setData(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        details: error
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    analyze
  };
};