import { useState } from 'react';

// Types
interface GoogleResult {
  title: string;
  snippet: string;
  link: string;
}

interface ResearchTrend {
  title: string;
  analysis: string;
  impact: number;
  recommendations: string[];
}

interface ResearchInsight {
  key: string;
  details: string;
  relevance: number;
  sources: string[];
}

interface MarketOpportunity {
  title: string;
  description: string;
  potentialScore: number;
  actionItems: string[];
}

interface AnalyticsSummary {
  overview: string;
  trends: ResearchTrend[];
  research: ResearchInsight[];
  opportunities: MarketOpportunity[];
}

interface GoogleSearchData {
  success: boolean;
  data?: {
    results: GoogleResult[];
    analysis: AnalyticsSummary;
    timestamp: string;
  };
  error?: string;
}

// Configuration
const CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT: 30000, // 30 seconds
  API_KEYS: {
    GOOGLE: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    SEARCH_ENGINE_ID: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID,
    GROQ: process.env.NEXT_PUBLIC_GROQ_API_KEY
  }
} as const;

// Cache implementation
class SearchCache {
  private cache = new Map<string, GoogleSearchData>();

  get(query: string): GoogleSearchData | null {
    const cached = this.cache.get(query);
    if (!cached) return null;

    const timestamp = new Date(cached.data?.timestamp || '');
    if (Date.now() - timestamp.getTime() < CONFIG.CACHE_DURATION) {
      return cached;
    }

    this.cache.delete(query);
    return null;
  }

  set(query: string, data: GoogleSearchData): void {
    this.cache.set(query, data);
  }
}

// Analysis prompt template
const ANALYSIS_PROMPT = `You are an advanced research and market analysis specialist. Analyze these search results and provide a detailed, actionable analysis in JSON format including overview, trends, research insights, and market opportunities. Focus on key patterns, implications, and actionable recommendations.

{
  "overview": "A comprehensive HTML-formatted overview analyzing market dynamics, research findings, and strategic implications. Include key patterns and potential impact areas.",
  
  "trends": [
    {
      "title": "Major trend or pattern identified",
      "analysis": "HTML-formatted in-depth analysis of the trend, including supporting evidence and potential implications",
      "impact": number (0-100 indicating significance and potential influence),
      "recommendations": [
        "Specific, actionable recommendations based on this trend"
      ]
    }
  ],
  
  "research": [
    {
      "key": "Research insight title",
      "details": "HTML-formatted detailed analysis of research findings and their implications",
      "relevance": number (0-100 indicating relevance to current context),
      "sources": [
        "Referenced sources or supporting evidence"
      ]
    }
  ],
  
  "opportunities": [
    {
      "title": "Strategic opportunity identified",
      "description": "HTML-formatted comprehensive description of the opportunity",
      "potentialScore": number (0-100 based on potential impact and feasibility),
      "actionItems": [
        "Specific steps or actions to capitalize on this opportunity"
      ]
    }
  ]
}

Guidelines:
- Ensure all text fields use proper HTML formatting (<p>, <strong>, <em>, <ul>, <li>, etc.)
- Provide 4-5 detailed trends with concrete evidence and implications
- Include 3-4 research insights with clear sources and practical applications
- Identify 3-4 high-potential opportunities with specific action items
- Base all scores on concrete evidence and potential impact
- Focus on actionable insights and practical applications
- Consider both immediate and long-term implications
- Include specific examples and supporting evidence where possible`;

// Main service class
export class GoogleSearchService {
  private static cache = new SearchCache();
  private static activeRequests = new Map<string, Promise<GoogleSearchData>>();

  private static async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private static validateConfiguration(): void {
    if (!CONFIG.API_KEYS.GOOGLE || !CONFIG.API_KEYS.SEARCH_ENGINE_ID || !CONFIG.API_KEYS.GROQ) {
      throw new Error('API keys not configured');
    }
  }

  private static async fetchGoogleResults(query: string): Promise<GoogleResult[]> {
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', CONFIG.API_KEYS.GOOGLE || '');
    searchUrl.searchParams.append('cx', CONFIG.API_KEYS.SEARCH_ENGINE_ID || '');
    searchUrl.searchParams.append('q', `${query} research`);

    const response = await this.fetchWithTimeout(searchUrl.toString(), { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.items || !Array.isArray(data.items)) {
      throw new Error('Invalid Google Search API response format');
    }

    return data.items.map((item: any) => ({
      title: item.title || 'No title available',
      snippet: item.snippet || 'No snippet available',
      link: item.link || '#',
    }));
  }

  private static async generateAnalysis(
    query: string,
    results: GoogleResult[]
  ): Promise<AnalyticsSummary> {
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
            { role: 'system', content: ANALYSIS_PROMPT },
            { role: 'user', content: JSON.stringify(results.slice(0, 8)) },
          ],
          temperature: 0.7,
          max_tokens: 1800,
        }),
      }
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

    return JSON.parse(analysis);
  }

  public static async searchAndAnalyze(query: string): Promise<GoogleSearchData> {
    if (!query.trim()) {
      return { success: false, error: 'Query cannot be empty' };
    }

    try {
      // Check cache first
      const cachedResult = this.cache.get(query);
      if (cachedResult) {
        return cachedResult;
      }

      // Check for active requests
      const activeRequest = this.activeRequests.get(query);
      if (activeRequest) {
        return activeRequest;
      }

      this.validateConfiguration();

      const newRequest = (async () => {
        try {
          const results = await this.fetchGoogleResults(query);
          if (results.length === 0) {
            return { success: false, error: 'No search results found' };
          }

          const analysis = await this.generateAnalysis(query, results);
          const response: GoogleSearchData = {
            success: true,
            data: {
              results,
              analysis,
              timestamp: new Date().toISOString(),
            },
          };

          this.cache.set(query, response);
          return response;
        } finally {
          this.activeRequests.delete(query);
        }
      })();

      this.activeRequests.set(query, newRequest);
      return newRequest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Search and analysis error:', error);
      return { success: false, error: errorMessage };
    }
  }
}

// React hook
export const useGoogleSearch = () => {
  const [searchData, setSearchData] = useState<GoogleSearchData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await GoogleSearchService.searchAndAnalyze(query);
      setSearchData(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchData(null);
    setError(null);
  };

  return {
    searchData,
    search,
    clearSearch,
    isLoading,
    error
  };
};