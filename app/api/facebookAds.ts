import { useState } from 'react';

// Official Facebook Ad API Interfaces
export interface FacebookAdCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  object_story_spec?: {
    page_id: string;
    link_data?: {
      link: string;
      message: string;
      caption?: string;
      description?: string;
    };
  };
  thumbnail_url?: string;
  image_url?: string;
  video_id?: string;
  call_to_action_type?: string;
}

export interface FacebookAdInsights {
  impressions: string;
  spend: string;
  clicks: string;
  reach: string;
  frequency: string;
  cpc: string;
  cpm: string;
  ctr: string;
  date_start: string;
  date_stop: string;
}

export interface FacebookAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  campaign_id: string;
  adset_id: string;
  creative: FacebookAdCreative;
  insights?: FacebookAdInsights;
  created_time: string;
  updated_time: string;
  bid_amount?: number;
  budget_remaining?: number;
  campaign?: {
    id: string;
    name: string;
  };
  adset?: {
    id: string;
    name: string;
  };
}

export interface FacebookAdResponse {
  data: FacebookAd[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

// Analysis interfaces
export interface AdPerformanceMetric {
  metric: string;
  description: string;
  score: number;
  value: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface CompetitorAnalysis {
  name: string;
  analysis: string;
  adCount: number;
  estimatedSpend: {
    min: number;
    max: number;
  };
  performance: {
    ctr: number;
    cpc: number;
    reach: number;
  };
}

export interface AdAnalysisSummary {
  overview: string;
  adPerformance: AdPerformanceMetric[];
  competitors: CompetitorAnalysis[];
  recommendations: string[];
  totalSpend: number;
  totalReach: number;
  averageCTR: number;
}

export interface FacebookAdsData {
  rawData: FacebookAdResponse;
  analysis: AdAnalysisSummary;
}

// Singleton Facebook Ads Service
export class FacebookAdsService {
  private static instance: FacebookAdsService;
  private static readonly API_VERSION = 'v18.0';
  private accessToken: string | null = null;
  private cache: Map<string, FacebookAdsData>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): FacebookAdsService {
    if (!FacebookAdsService.instance) {
      FacebookAdsService.instance = new FacebookAdsService();
    }
    return FacebookAdsService.instance;
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i === retries - 1) break;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw lastError!;
  }

  private buildGraphAPIUrl(path: string, params: Record<string, string>): string {
    const baseUrl = `https://graph.facebook.com/${FacebookAdsService.API_VERSION}`;
    const searchParams = new URLSearchParams({
      access_token: this.accessToken!,
      ...params
    });
    return `${baseUrl}${path}?${searchParams}`;
  }

  public async getAdAccountAds(adAccountId: string): Promise<FacebookAdsData> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const cacheKey = `account_${adAccountId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const fields = [
        'id',
        'name',
        'status',
        'effective_status',
        'created_time',
        'updated_time',
        'campaign_id',
        'adset_id',
        'creative{id,name,title,body,object_story_spec,thumbnail_url,image_url,video_id,call_to_action_type}',
        'insights{impressions,spend,clicks,reach,frequency,cpc,cpm,ctr}'
      ].join(',');

      const adsResponse = await this.fetchWithRetry<FacebookAdResponse>(
        this.buildGraphAPIUrl(`/act_${adAccountId}/ads`, {
          fields,
          limit: '500',
          status: '["ACTIVE", "PAUSED"]'
        }),
        { method: 'GET' }
      );

      const analysis = await this.generateAnalysis(adsResponse);
      const result = { rawData: adsResponse, analysis };
      
      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching Facebook ads:', error);
      throw error;
    }
  }

  private async generateAnalysis(response: FacebookAdResponse): Promise<AdAnalysisSummary> {
    const ads = response.data;
    
    if (!ads.length) {
      return {
        overview: 'No active ads found for analysis.',
        adPerformance: [],
        competitors: [],
        recommendations: [],
        totalSpend: 0,
        totalReach: 0,
        averageCTR: 0
      };
    }

    // Calculate total spend and reach
    let totalSpend = 0;
    let totalReach = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    ads.forEach(ad => {
      if (ad.insights) {
        totalSpend += parseFloat(ad.insights.spend) || 0;
        totalReach += parseFloat(ad.insights.reach) || 0;
        totalClicks += parseFloat(ad.insights.clicks) || 0;
        totalImpressions += parseFloat(ad.insights.impressions) || 0;
      }
    });

    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Generate performance metrics
    const adPerformance: AdPerformanceMetric[] = [
      {
        metric: 'Click-Through Rate',
        description: `Average CTR across all ads: ${averageCTR.toFixed(2)}%`,
        score: Math.min(averageCTR * 20, 100), // Scale CTR to 0-100
        value: `${averageCTR.toFixed(2)}%`
      },
      {
        metric: 'Total Reach',
        description: `Total number of unique users reached: ${totalReach.toLocaleString()}`,
        score: Math.min((totalReach / 10000) * 100, 100), // Scale based on reach
        value: totalReach.toLocaleString()
      },
      {
        metric: 'Cost Efficiency',
        description: `Average cost per click: $${(totalSpend / totalClicks).toFixed(2)}`,
        score: Math.min(100 - ((totalSpend / totalClicks) * 20), 100), // Lower CPC = higher score
        value: `$${(totalSpend / totalClicks).toFixed(2)}`
      }
    ];

    // Group ads by campaign for competitor analysis
    const campaignGroups = ads.reduce((groups, ad) => {
      const campaignId = ad.campaign?.id || 'unknown';
      if (!groups[campaignId]) {
        groups[campaignId] = [];
      }
      groups[campaignId].push(ad);
      return groups;
    }, {} as Record<string, FacebookAd[]>);

    // Generate competitor analysis
    const competitors = Object.entries(campaignGroups)
      .map(([_, campaignAds]) => {
        const campaign = campaignAds[0].campaign;
        if (!campaign) return null;

        const campaignSpend = campaignAds.reduce((sum, ad) => 
          sum + (parseFloat(ad.insights?.spend || '0')), 0);
        const campaignClicks = campaignAds.reduce((sum, ad) => 
          sum + (parseFloat(ad.insights?.clicks || '0')), 0);
        const campaignImpressions = campaignAds.reduce((sum, ad) => 
          sum + (parseFloat(ad.insights?.impressions || '0')), 0);

        return {
          name: campaign.name,
          analysis: `Campaign performance analysis for ${campaign.name}`,
          adCount: campaignAds.length,
          estimatedSpend: {
            min: campaignSpend * 0.9,
            max: campaignSpend * 1.1
          },
          performance: {
            ctr: campaignImpressions > 0 ? (campaignClicks / campaignImpressions) * 100 : 0,
            cpc: campaignClicks > 0 ? campaignSpend / campaignClicks : 0,
            reach: parseFloat(campaignAds[0].insights?.reach || '0')
          }
        };
      })
      .filter((c): c is CompetitorAnalysis => c !== null)
      .sort((a, b) => b.estimatedSpend.max - a.estimatedSpend.max)
      .slice(0, 3);

    return {
      overview: `Analysis of ${ads.length} ads across ${Object.keys(campaignGroups).length} campaigns`,
      adPerformance,
      competitors,
      recommendations: [
        'Optimize campaigns with high CTR but low reach',
        'Review and adjust bidding strategy for underperforming ads',
        'Consider expanding budget for best performing campaigns'
      ],
      totalSpend,
      totalReach,
      averageCTR
    };
  }

  public clearCache() {
    this.cache.clear();
  }
}

// React Hook for using the service
export const useFacebookAdsStore = () => {
  const [adsData, setAdsData] = useState<FacebookAdsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAdsData = async (adAccountId: string, accessToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const service = FacebookAdsService.getInstance();
      service.setAccessToken(accessToken);
      const result = await service.getAdAccountAds(adAccountId);
      setAdsData(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAdsData = () => {
    setAdsData(null);
    setError(null);
    FacebookAdsService.getInstance().clearCache();
  };

  return {
    adsData,
    getAdsData,
    clearAdsData,
    isLoading,
    error
  };
};

// Helper function for direct API access
export const fetchAndProcessAdsData = async (
  adAccountId: string, 
  accessToken: string
): Promise<FacebookAdsData | null> => {
  const service = FacebookAdsService.getInstance();
  service.setAccessToken(accessToken);
  return await service.getAdAccountAds(adAccountId);
};