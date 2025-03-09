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
  hashtags?: string[];
  user_mentions?: string[];
}

interface TwitterAPIResponse {
  timeline?: TwitterAPITweet[];
  status?: string;
}

// Enhanced Tweet Types for Marketing Analysis
interface EnhancedTweet {
  content: string;
  engagement: number;
  created_at: string;
  influence_score: number; // New: Combines followers + engagement
  hashtags: string[];      // New: Extracted hashtags
  mentions: string[];      // New: User mentions
}

// Expanded Analysis Result Types
interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[]; // New: Key terms driving sentiment
}

interface ContentPattern {
  pattern: string;
  description: string;
  frequency: number;
  examples: string[];
  relevance: number; // New: Marketing relevance score
}

interface TopTweet {
  content: string;
  engagement: number;
  reason: string;
  influence_score: number; // New: Influence metric
}

interface CompetitorMention {
  name: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface MarketInsights {
  userSentiment: string;
  competitorAnalysis: CompetitorMention[]; // New: Competitor analysis
  targetDemographics: string[]; // New: Inferred demographics
  actionableInsights: string[];
  marketingRecommendations: {   // New: Structured marketing recommendations
    contentStrategy: string[];
    engagementTactics: string[];
    brandPositioning: string;
  };
}

interface TemporalAnalysis {  // New: Time-based patterns
  patterns: {
    timeOfDay: string[];
    dayOfWeek: string[];
  };
  trends: {
    emerging: string[];
    fading: string[];
  };
}

interface Analysis {
  overview: string;
  sentimentAnalysis: SentimentAnalysis;
  contentPatterns: ContentPattern[];
  engagement: {
    topTweets: TopTweet[];
    hashtags: { tag: string; count: number; relevance: number }[]; // New: Hashtag analysis
  };
  marketInsights: MarketInsights;
  temporalAnalysis: TemporalAnalysis; // New: Time-based analysis
}

interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: Analysis;
    sources: EnhancedTweet[];
    timestamp: string;
  };
  error?: string;
}

export class TwitterAnalysisService {
  private static readonly CONFIG = {
    TWITTER_API_URL: 'https://twitter-api45.p.rapidapi.com/search.php',
    TIMEOUT: 30000,
    MAX_TWEETS: 50, // Increased for better sample size
    MAX_TWEETS_FOR_ANALYSIS: 30, // Increased for better analysis
    MAX_CONTENT_LENGTH: 100,
    GROQ_MODEL: 'deepseek-r1-distill-qwen-32b',
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

  // New method to extract hashtags from tweet text
  private static extractHashtags(text: string): string[] {
    const hashtags: string[] = [];
    const regex = /#[\w\u0590-\u05ff]+/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      hashtags.push(match[0].toLowerCase());
    }
    
    return hashtags;
  }
  
  // New method to extract mentions from tweet text
  private static extractMentions(text: string): string[] {
    const mentions: string[] = [];
    const regex = /@[\w]+/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[0].toLowerCase());
    }
    
    return mentions;
  }

  // New method to calculate influence score
  private static calculateInfluenceScore(followers: number = 0, engagement: number = 0): number {
    // Simple weighted formula that values both reach and engagement
    return (followers * 0.7) + (engagement * 1.3);
  }

  public static async analyzeTweets(query: string, options?: {
    competitors?: string[],
    industry?: string,
    marketSegment?: string
  }): Promise<AnalysisResult> {
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
        .map((tweet: TwitterAPITweet): EnhancedTweet => {
          const content = this.sanitizeText(tweet.text || '', this.CONFIG.MAX_CONTENT_LENGTH);
          const engagement = (tweet.retweets || 0) + (tweet.favorites || 0) + (tweet.replies || 0);
          const hashtags = tweet.hashtags || this.extractHashtags(content);
          const mentions = tweet.user_mentions || this.extractMentions(content);
          
          return {
            content,
            engagement,
            created_at: tweet.created_at || new Date().toISOString(),
            influence_score: this.calculateInfluenceScore(tweet.followers_count, engagement),
            hashtags,
            mentions
          };
        })
        .sort((a: EnhancedTweet, b: EnhancedTweet) => b.influence_score - a.influence_score)
        .slice(0, this.CONFIG.MAX_TWEETS_FOR_ANALYSIS);

      if (tweets.length === 0) {
        return { success: false, error: 'No valid tweets found' };
      }

      // Enhanced analysis context with more marketing-focused data
      const analysisContext = {
        query,
        sampleSize: tweets.length,
        industry: options?.industry || 'general',
        marketSegment: options?.marketSegment || 'general',
        competitors: options?.competitors || [],
        tweets: tweets.map(t => ({
          content: t.content,
          engagement: t.engagement,
          influence_score: t.influence_score,
          hashtags: t.hashtags,
          mentions: t.mentions,
          created_at: t.created_at
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
                content: this.getMarketingAnalysisPrompt(query, options)
              },
              {
                role: 'user',
                content: JSON.stringify(analysisContext)
              }
            ],
            temperature: 0.7, // Lower temperature for more consistent marketing insights
            max_tokens: 4000, // Increased for more detailed analysis
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

  private static getMarketingAnalysisPrompt(query: string, options?: {
    competitors?: string[],
    industry?: string,
    marketSegment?: string
  }): string {
    const competitors = options?.competitors?.join(', ') || 'unknown';
    const industry = options?.industry || 'general';
    const marketSegment = options?.marketSegment || 'general';
    
    return `You are an expert marketing analyst with deep experience in social media analytics, consumer psychology, and market research. 
    
Your task is to analyze tweets about "${query}" in the ${industry} industry, focusing on the ${marketSegment} market segment. Competitors include: ${competitors}.

Analyze the provided tweets for marketing insights. Pay special attention to:
1. Consumer sentiment and emotional responses
2. Brand perception and positioning opportunities
3. Competitive landscape and differentiators
4. Content patterns that drive engagement
5. Potential market segments and audience demographics
6. Temporal patterns and emerging trends

Provide an executive-level marketing analysis with actionable insights in the following JSON format:

{
  "overview": "Concise executive summary of key marketing findings",
  
  "sentimentAnalysis": {
    "score": "Number from -1 to 1",
    "label": "positive/negative/neutral",
    "confidence": "0-1 confidence score",
    "keywords": ["3-5 key terms driving sentiment"]
  },
  
  "contentPatterns": [
    {
      "pattern": "Pattern name",
      "description": "Marketing-relevant description",
      "frequency": "1-10 score",
      "examples": ["1-2 representative examples"],
      "relevance": "1-10 marketing relevance score"
    }
  ] (3-5 items),
  
  "engagement": {
    "topTweets": [
      {
        "content": "Tweet content",
        "engagement": "Numeric score",
        "reason": "Marketing-focused explanation",
        "influence_score": "Numeric influence score"
      }
    ] (3 items),
    "hashtags": [
      {
        "tag": "Hashtag",
        "count": "Frequency",
        "relevance": "1-10 marketing relevance"
      }
    ] (top 5)
  },
  
  "marketInsights": {
    "userSentiment": "Detailed view of customer sentiment toward the brand/product",
    "competitorAnalysis": [
      {
        "name": "Competitor name",
        "frequency": "Mention count",
        "sentiment": "positive/negative/neutral"
      }
    ],
    "targetDemographics": ["3-5 inferred audience segments"],
    "actionableInsights": ["3-5 direct actionable insights"],
    "marketingRecommendations": {
      "contentStrategy": ["3-4 specific content approaches"],
      "engagementTactics": ["3-4 ways to increase engagement"],
      "brandPositioning": "Recommended positioning statement"
    }
  },
  
  "temporalAnalysis": {
    "patterns": {
      "timeOfDay": ["When engagement peaks"],
      "dayOfWeek": ["Best days for engagement"]
    },
    "trends": {
      "emerging": ["2-3 emerging topics"],
      "fading": ["2-3 declining topics"]
    }
  }
}

Focus on marketing strategy, consumer psychology, and actionable business insights. Be specific, data-driven, and practical in your recommendations.`;
  }

  private static sanitizeText(text: string, maxLength: number = 280): string {
    if (!text) return '';
    const sanitized = text.replace(/\s+/g, ' ').trim();
    return sanitized.length <= maxLength ? sanitized : 
           sanitized.substring(0, maxLength - 3) + '...';
  }
}

export const useTwitterAnalysis = () => {
  const [data, setData] = useState<AnalysisResult['data'] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    query: string, 
    options?: {
      competitors?: string[],
      industry?: string,
      marketSegment?: string
    }
  ): Promise<AnalysisResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await TwitterAnalysisService.analyzeTweets(query, options);
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