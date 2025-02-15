// Define interfaces for the Facebook Ads API response structure
interface FacebookAdImage {
  image_url: string;
}

interface FacebookAdVideo {
  video_sd_url: string;
  video_hd_url: string;
  video_preview_image_url: string;
}

interface FacebookAdBody {
  text: string;
}

interface FacebookAdSnapshot {
  body: FacebookAdBody;
  images: FacebookAdImage[];
  videos: FacebookAdVideo[];
  title?: string;
  caption?: string;
}

interface FacebookAd {
  ad_archive_id: string;
  page_id: string;
  page_name: string;
  snapshot: FacebookAdSnapshot;
  start_date: number;
  end_date: number;
}

interface FacebookAdsResponse {
  ads: FacebookAd[];
}

// Define interfaces for the structured ad data we want to extract
interface ExtractedAdData {
  id: string;
  pageId: string;
  pageName: string;
  text: string;
  images: string[];
  videos: {
    preview: string;
    sdUrl?: string;
    hdUrl?: string;
  }[];
  title?: string;
  caption?: string;
  startDate: Date;
  endDate: Date;
}

// Define interface for the analysis result from Groq
interface AnalysisResult {
  overview: string;
  emotionalTone: string;
  targetAudience: string;
  keyMessages: string[];
  effectiveness: number;
  suggestions: string[];
}

interface FacebookAdsAnalysisResult {
  success: boolean;
  data?: {
    ads: ExtractedAdData[];
    analysis: AnalysisResult;
    timestamp: string;
  };
  error?: string;
}

export class FacebookAdsAnalysisService {
  private static readonly TIMEOUT = 30000;
  private static readonly RAPIDAPI_KEY = process.env.NEXT_PUBLIC_FRAPIDAPI_KEY;
  private static readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  
  // Cache for storing results by query
  private static cache: Map<string, Promise<FacebookAdsAnalysisResult>> = new Map();

  private static async fetchWithTimeout(
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

  public static async analyzeFacebookAds(query: string): Promise<FacebookAdsAnalysisResult> {
    // Normalize the query to ensure consistent caching
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check if we have a cached result or ongoing promise for this query
    if (this.cache.has(normalizedQuery)) {
      return this.cache.get(normalizedQuery)!;
    }
    
    // Create a new promise for this query and store it in the cache
    const resultPromise = this.performAnalysis(normalizedQuery);
    this.cache.set(normalizedQuery, resultPromise);
    
    try {
      // Wait for the promise to resolve
      const result = await resultPromise;
      return result;
    } catch (error) {
      // If there's an error, remove this query from the cache so it can be retried
      this.cache.delete(normalizedQuery);
      throw error;
    }
  }
  
  private static async performAnalysis(query: string): Promise<FacebookAdsAnalysisResult> {
    try {
      if (!query) {
        return { success: false, error: 'Query cannot be empty' };
      }
      
      if (!this.RAPIDAPI_KEY || !this.GROQ_API_KEY) {
        return { success: false, error: 'API keys not configured' };
      }

      const adsData = await this.fetchFacebookAds(query);
      if (adsData.length === 0) {
        return { success: false, error: 'No relevant Facebook ads found' };
      }

      // Combine all ad texts for analysis
      const adTexts = adsData
        .map(ad => ad.text)
        .filter(Boolean)
        .join('\n\n');

      if (!adTexts) {
        return { success: false, error: 'No valid content to analyze' };
      }

      const analysis = await this.generateAnalysis(query, adTexts);

      return {
        success: true,
        data: {
          ads: adsData,
          analysis: JSON.parse(analysis),
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Analysis error:', error);
      return { success: false, error: errorMessage };
    }
  }

  private static async fetchFacebookAds(query: string): Promise<ExtractedAdData[]> {
    const url = new URL('https://meta-facebook-ad-library.p.rapidapi.com/getKeywordAds');
    url.searchParams.append('keyword', query);
    url.searchParams.append('media_type', 'all');
    url.searchParams.append('active_status', 'active');
    url.searchParams.append('ad_type', 'all');

    try {
      const response = await this.fetchWithTimeout(
        url.toString(),
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.RAPIDAPI_KEY || '',
            'x-rapidapi-host': 'meta-facebook-ad-library.p.rapidapi.com',
          },
        },
        this.TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`Facebook Ads API error: ${response.status}`);
      }

      const data: FacebookAdsResponse = await response.json();
      
      if (!data?.ads || !Array.isArray(data.ads)) {
        throw new Error('Invalid Facebook Ads API response format');
      }

      return data.ads.map(this.extractAdData);

    } catch (error) {
      console.error('Facebook Ads fetch error:', error);
      throw new Error(
        `Failed to fetch Facebook ads: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private static extractAdData(ad: FacebookAd): ExtractedAdData {
    return {
      id: ad.ad_archive_id,
      pageId: ad.page_id,
      pageName: ad.page_name,
      text: ad.snapshot.body?.text || '',
      images: (ad.snapshot.images || []).map(img => img.image_url).filter(Boolean),
      videos: (ad.snapshot.videos || []).map(video => ({
        preview: video.video_preview_image_url,
        sdUrl: video.video_sd_url,
        hdUrl: video.video_hd_url
      })).filter(v => v.preview || v.sdUrl || v.hdUrl),
      title: ad.snapshot.title,
      caption: ad.snapshot.caption,
      startDate: new Date(ad.start_date * 1000),
      endDate: new Date(ad.end_date * 1000)
    };
  }

  private static async generateAnalysis(query: string, content: string): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const analysisPrompt = {
      role: 'system',
      content: `You are an expert marketing and advertising analyst. Analyze the provided Facebook ads about "${query}" and generate a comprehensive analysis in the following JSON format:

{
  "overview": "Executive summary of the ad analysis",
  "emotionalTone": "Analysis of the emotional appeal used in the ads",
  "targetAudience": "Who these ads appear to be targeting",
  "keyMessages": ["Array of 3-5 main messages/themes found in the ads"],
  "effectiveness": "Numerical rating 1-10 of likely effectiveness",
  "suggestions": ["Array of 2-3 potential improvements"]
}

Ensure the analysis is data-driven and provides actionable insights.`
    };

    const payload = {
      model: 'deepseek-r1-distill-qwen-32b',
      messages: [
        analysisPrompt,
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    };

    try {
      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        this.TIMEOUT
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
  
  // Optional: Method to clear the cache if needed
  public static clearCache(): void {
    this.cache.clear();
  }
}