import { useState } from 'react';
import debug from 'debug';

// Initialize debuggers
const logError = debug('fb-ads:error');
const logInfo = debug('fb-ads:info');
const logDebug = debug('fb-ads:debug');

// Enable debugging in development
if (process.env.NODE_ENV === 'development') {
  debug.enable('fb-ads:*');
}

// Core interfaces
export interface AdCard {
  body: string;
  caption: string | null;
  cta_text: string;
  cta_type: string;
  title: string;
  link_url: string;
  video_preview_image_url?: string;
  video_sd_url?: string;
  video_hd_url?: string;
}

export interface AdSnapshot {
  ad_creative_id: string;
  body: {
    text?: string;
  };
  caption: string;
  cards: AdCard[];
  page_name: string;
  page_like_count: number;
  page_profile_picture_url: string;
  creation_time: number;
  instagram_actor_name?: string;
  instagram_profile_pic_url?: string;
}

export interface FacebookAd {
  adid: string;
  adArchiveID: string;
  pageID: string;
  pageName: string;
  currency: string;
  startDate: number;
  endDate: number;
  entityType: string;
  snapshot: AdSnapshot;
  isActive: boolean;
}

export interface MetaAdResponse {
  data: FacebookAd[];
  total_count: number;
}

export interface AdPerformanceMetric {
  metric: string;
  description: string;
  score: number;
}

export interface CompetitorAnalysis {
  name: string;
  analysis: string;
  adCount: number;
  estimatedSpend: {
    min: number;
    max: number;
  };
}

export interface AdAnalysisSummary {
  overview: string;
  adPerformance: AdPerformanceMetric[];
  competitors: CompetitorAnalysis[];
  recommendations: string[];
}

export interface FacebookMetaData {
  rawData: MetaAdResponse;
  analysis: AdAnalysisSummary;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Singleton Service Implementation
export class FacebookMetaService {
  private static instance: FacebookMetaService;
  private static readonly BASE_URL = 'https://meta-ad-library.p.rapidapi.com/search/ads';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_RAPID_API_KEY;
  private static readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  private readonly cache: Map<string, { data: FacebookMetaData; timestamp: number }>;
  private readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

  private constructor() {
    this.cache = new Map();
    logInfo('FacebookMetaService initialized');
  }

  public static getInstance(): FacebookMetaService {
    if (!this.instance) {
      this.instance = new FacebookMetaService();
    }
    return this.instance;
  }

  private getCacheKey(query: string): string {
    return `fb-ads:${query.toLowerCase().trim()}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private validateApiKey(): void {
    if (!FacebookMetaService.API_KEY) {
      logError('API key not configured');
      throw new APIError('API key not configured', 401, 'MISSING_API_KEY');
    }
  }

  private getRequestOptions(query: string): { url: string; options: RequestInit } {
    const params = new URLSearchParams({
      query,
      active_status: 'all',
      media_types: 'all',
      platform: 'facebook,instagram',
      ad_type: 'all',
      search_type: 'keyword_unordered'
    });

    return {
      url: `${FacebookMetaService.BASE_URL}?${params}`,
      options: {
        method: 'GET',
        headers: {
          'x-rapidapi-key': FacebookMetaService.API_KEY!,
          'x-rapidapi-host': 'meta-ad-library.p.rapidapi.com'
        }
      }
    };
  }

  private transformAdData(rawAd: any): FacebookAd {
    try {
      logDebug('Transforming ad data:', rawAd.adid);
      
      // Destructure with default values
      const {
        adid = '',
        adArchiveID = '',
        pageID = '',
        pageName = '',
        currency = '',
        startDate = Date.now() / 1000,
        endDate = Date.now() / 1000,
        entityType = '',
        isActive = false,
        snapshot = {}
      } = rawAd;

      // Transform snapshot data
      const transformedSnapshot: AdSnapshot = {
        ad_creative_id: snapshot.ad_creative_id || '',
        body: {
          text: snapshot.body?.text || ''
        },
        caption: snapshot.caption || '',
        cards: Array.isArray(snapshot.cards) 
          ? snapshot.cards.map(this.transformCard)
          : [],
        page_name: snapshot.page_name || '',
        page_like_count: snapshot.page_like_count || 0,
        page_profile_picture_url: snapshot.page_profile_picture_url || '',
        creation_time: snapshot.creation_time || Date.now() / 1000,
        instagram_actor_name: snapshot.instagram_actor_name,
        instagram_profile_pic_url: snapshot.instagram_profile_pic_url
      };

      return {
        adid,
        adArchiveID,
        pageID,
        pageName,
        currency,
        startDate,
        endDate,
        entityType,
        isActive,
        snapshot: transformedSnapshot
      };
    } catch (error) {
      logError('Error transforming ad data:', error);
      throw new APIError('Failed to transform ad data', 500, 'TRANSFORM_ERROR');
    }
  }

  private transformCard(card: any): AdCard {
    return {
      body: card.body || '',
      caption: card.caption || null,
      cta_text: card.cta_text || '',
      cta_type: card.cta_type || '',
      title: card.title || '',
      link_url: card.link_url || '',
      video_preview_image_url: card.video_preview_image_url,
      video_sd_url: card.video_sd_url,
      video_hd_url: card.video_hd_url
    };
  }

  public async fetchAds(query: string): Promise<FacebookMetaData> {
    try {
      this.validateApiKey();
      
      const cacheKey = this.getCacheKey(query);
      const cachedData = this.cache.get(cacheKey);
      
      if (cachedData && this.isValidCache(cachedData.timestamp)) {
        logInfo('Cache hit for query:', query);
        return cachedData.data;
      }

      logInfo('Fetching ads for query:', query);
      const { url, options } = this.getRequestOptions(query);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          response.status,
          'API_ERROR'
        );
      }

      const rawData = await response.json();
      const ads = Array.isArray(rawData) ? rawData : [];
      
      const metaData: FacebookMetaData = {
        rawData: {
          data: ads.map(ad => this.transformAdData(ad)),
          total_count: ads.length
        },
        analysis: await this.generateAnalysis(query, ads)
      };

      this.cache.set(cacheKey, {
        data: metaData,
        timestamp: Date.now()
      });

      return metaData;

    } catch (error) {
      logError('Error fetching ads:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'UNKNOWN_ERROR'
      );
    }
  }

  private async generateAnalysis(query: string, ads: any[]): Promise<AdAnalysisSummary> {
    // Default analysis for empty or failed requests
    const defaultAnalysis: AdAnalysisSummary = {
      overview: 'No data available for analysis.',
      adPerformance: [],
      competitors: [],
      recommendations: []
    };

    if (!ads.length) {
      return defaultAnalysis;
    }

    try {
      // Simplified analysis based on available data
      const competitors = new Map<string, number>();
      ads.forEach(ad => {
        const count = competitors.get(ad.pageName) || 0;
        competitors.set(ad.pageName, count + 1);
      });

      const topCompetitors = Array.from(competitors.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          analysis: `Running ${count} ads in this category`,
          adCount: count,
          estimatedSpend: {
            min: count * 100,
            max: count * 1000
          }
        }));

      return {
        overview: `Analysis of ${ads.length} ads for "${query}"`,
        adPerformance: [
          {
            metric: 'Active Campaigns',
            description: 'Number of currently running ad campaigns',
            score: (ads.filter(ad => ad.isActive).length / ads.length) * 100
          }
        ],
        competitors: topCompetitors,
        recommendations: [
          'Review competitor ad content for insights',
          'Consider adjusting campaign timing',
          'Optimize ad creative based on top performers'
        ]
      };

    } catch (error) {
      logError('Error generating analysis:', error);
      return defaultAnalysis;
    }
  }

  public clearCache(): void {
    this.cache.clear();
    logInfo('Cache cleared');
  }
}

// React Hook
export const useFacebookMetaStore = () => {
  const [metaData, setMetaData] = useState<FacebookMetaData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getMetaData = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const service = FacebookMetaService.getInstance();
      const result = await service.fetchAds(query);
      setMetaData(result);
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? `${error.code}: ${error.message}`
        : "An unknown error occurred";
      setError(errorMessage);
      logError('Error in hook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMetaData = () => {
    setMetaData(null);
    setError(null);
    FacebookMetaService.getInstance().clearCache();
  };

  return {
    metaData,
    getMetaData,
    clearMetaData,
    isLoading,
    error
  };
};

// Helper function for direct API access
export const fetchAndProcessMetaData = async (query: string): Promise<FacebookMetaData | null> => {
  const service = FacebookMetaService.getInstance();
  return await service.fetchAds(query);
};