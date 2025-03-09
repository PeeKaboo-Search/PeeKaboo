interface MetaAdItem {
  adid: string;
  adArchiveID: string;
  pageID: string;
  pageName: string;
  snapshot: {
    cards?: Array<{
      body?: string;
      title?: string;
      link_url?: string;
      video_preview_image_url?: string;
    }>;
    body?: {
      markup?: {
        __html?: string;
      };
    };
    title?: string;
    link_description?: string;
    creation_time?: number;
  };
  isActive: boolean;
  startDate?: number;
  endDate?: number;
}

interface MetaAdAPIResponse {
  query: string;
  country_code: string;
  number_of_ads: number;
  results: Array<Array<MetaAdItem>>;
  continuation_token?: string;
  is_result_complete: boolean;
}

// Enhanced interface for structured ad analysis
interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: AnalysisData;
    sources: MetaAdContent[];
    timestamp: string;
  };
  error?: string;
  rawResponse?: unknown; // Changed from any to unknown
}

// Content extracted from ads for analysis
interface MetaAdContent {
  adId: string;
  pageId: string;
  pageName: string;
  content: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  active: boolean;
  creationTime?: string;
}

// Structure for analysis data
interface AnalysisData {
  overview: string;
  messagingStrategies: Array<{
    strategy: string;
    description: string;
    prevalence: number;
    effectiveness: number;
    examples: string[];
  }>;
  visualTactics: Array<{
    tactic: string;
    implementation: string;
    impact: string;
    frequencyOfUse: number;
  }>;
  audienceTargeting: Array<{
    segment: string;
    approach: string;
    intensity: number;
    engagementPotential: string;
  }>;
  competitiveAdvantage: string;
  callToActionEffectiveness: Array<{
    cta: string;
    context: string;
    strength: number;
    conversionPotential: string;
  }>;
  recommendedCounterStrategies: string;
}

export class MetaAdAnalysisService {
  private static readonly TIMEOUT = 60000; // Increased timeout to 60 seconds
  private static readonly RAPIDAPI_KEY = process.env.NEXT_PUBLIC_FRAPIDAPI_KEY;
  private static readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  // Fetch with timeout to prevent hanging requests
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

  // Main analysis method - entry point
  public static async analyzeCompetitorAds(
    query: string,
    countryCode: string = 'IN',
    platform: string = 'facebook,instagram',
    adType: string = 'all',
    limit: number = 50
  ): Promise<AnalysisResult> {
    try {
      if (!query || !query.trim()) {
        return { success: false, error: 'Query cannot be empty' };
      }
      
      if (!this.RAPIDAPI_KEY) {
        return { success: false, error: 'RapidAPI key not configured' };
      }

      if (!this.GROQ_API_KEY) {
        return { success: false, error: 'Groq API key not configured' };
      }

      // Search for ads based on query
      const ads = await this.searchMetaAds(query, countryCode, platform, adType, limit);
      
      if (!ads || ads.length === 0) {
        return { success: false, error: 'No relevant ads found for the query' };
      }

      // Extract content from ads for analysis
      const adContent = this.extractContentFromAds(ads);
      
      if (adContent.length === 0) {
        return { success: false, error: 'Failed to extract content from ads' };
      }

      // Generate the analysis using AI
      try {
        const analysis = await this.generateAdAnalysis(query, adContent);
        let parsedAnalysis: AnalysisData;
        
        try {
          parsedAnalysis = JSON.parse(analysis) as AnalysisData;
        } catch (_) {
          // Changed from parseError to _ to indicate unused variable
          return { 
            success: false, 
            error: 'Failed to parse analysis result', 
            rawResponse: analysis 
          };
        }

        return {
          success: true,
          data: {
            analysis: parsedAnalysis,
            sources: adContent,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (analysisError) {
        return { 
          success: false, 
          error: `Analysis generation failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
          rawResponse: { adContent }
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Analysis error:', error);
      return { success: false, error: errorMessage };
    }
  }

  // Search Meta Ad Library for ads and remove duplicates
  private static async searchMetaAds(
    query: string,
    countryCode: string,
    platform: string,
    adType: string,
    limit: number
  ): Promise<MetaAdItem[]> {
    // Prepare the API URL with query parameters
    const url = new URL('https://meta-ad-library.p.rapidapi.com/search/ads');
    url.searchParams.append('query', query);
    url.searchParams.append('country_code', countryCode);
    url.searchParams.append('active_status', 'all');
    url.searchParams.append('media_types', 'all');
    url.searchParams.append('platform', platform);
    url.searchParams.append('ad_type', adType);
    url.searchParams.append('search_type', 'keyword_exact_phrase');

    try {
      console.log(`Fetching Meta ads for query: ${query}`);
      
      const response = await this.fetchWithTimeout(
        url.toString(),
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.RAPIDAPI_KEY || '',
            'x-rapidapi-host': 'meta-ad-library.p.rapidapi.com',
          },
        },
        this.TIMEOUT
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => null);
        throw new Error(`Meta Ad API error: ${response.status} - ${errorText || response.statusText}`);
      }

      const data: MetaAdAPIResponse = await response.json();
      
      if (!data) {
        throw new Error('Empty response from Meta Ad API');
      }
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid Meta Ad API response format');
      }

      // Flatten the nested arrays
      const allAds: MetaAdItem[] = [];
      for (const adGroup of data.results) {
        if (Array.isArray(adGroup)) {
          allAds.push(...adGroup);
        }
      }

      // Remove duplicate ads by adArchiveID
      const uniqueAds = this.removeDuplicateAds(allAds);
      
      console.log(`Found ${allAds.length} ads, filtered to ${uniqueAds.length} unique ads, limiting to ${limit}`);
      return uniqueAds.slice(0, limit);

    } catch (error) {
      console.error('Meta Ad search error:', error);
      throw new Error(
        `Failed to fetch Meta ads: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Remove duplicate ads based on content similarity
  private static removeDuplicateAds(ads: MetaAdItem[]): MetaAdItem[] {
    if (!ads || !Array.isArray(ads) || ads.length === 0) {
      return [];
    }

    // First, deduplicate by adArchiveID
    const uniqueByIdMap = new Map<string, MetaAdItem>();
    
    for (const ad of ads) {
      if (ad && ad.adArchiveID && !uniqueByIdMap.has(ad.adArchiveID)) {
        uniqueByIdMap.set(ad.adArchiveID, ad);
      }
    }
    
    const uniqueByIdAds = Array.from(uniqueByIdMap.values());
    
    // Next, check for content similarity to catch ads that have the same content but different IDs
    const uniqueAds: MetaAdItem[] = [];
    const contentSignatures = new Set<string>();
    
    for (const ad of uniqueByIdAds) {
      // Create a content signature using available text fields
      const contentParts: string[] = [];
      
      if (ad.snapshot?.title) contentParts.push(ad.snapshot.title);
      
      if (ad.snapshot?.body?.markup?.__html) {
        // Extract text and remove HTML tags for comparison
        const htmlText = ad.snapshot.body.markup.__html.replace(/<[^>]*>/g, '').trim();
        if (htmlText) contentParts.push(htmlText);
      }
      
      if (ad.snapshot?.link_description) contentParts.push(ad.snapshot.link_description);
      
      // Process cards content
      if (ad.snapshot?.cards && Array.isArray(ad.snapshot.cards)) {
        for (const card of ad.snapshot.cards) {
          if (card.title) contentParts.push(card.title);
          if (card.body) contentParts.push(card.body);
        }
      }
      
      // Create a simplified signature for content comparison
      // We're only using the first 100 chars to compare core message, not minor differences
      const contentSignature = contentParts
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .slice(0, 100);
      
      // Only add the ad if we haven't seen very similar content before
      if (contentSignature && contentSignature.length > 10) {
        if (!contentSignatures.has(contentSignature)) {
          contentSignatures.add(contentSignature);
          uniqueAds.push(ad);
        }
      } else {
        // If we can't create a good content signature, include the ad anyway
        uniqueAds.push(ad);
      }
    }
    
    return uniqueAds;
  }

  // Extract relevant content from ad objects
  private static extractContentFromAds(ads: MetaAdItem[]): MetaAdContent[] {
    if (!ads || !Array.isArray(ads)) {
      console.error('Invalid ads data provided to extractContentFromAds');
      return [];
    }

    return ads.map(ad => {
      if (!ad) return null;
      
      // Initialize content with any available text fields
      let content = '';
      
      // Extract text from cards if available
      if (ad.snapshot?.cards && Array.isArray(ad.snapshot.cards)) {
        ad.snapshot.cards.forEach(card => {
          if (card.body) content += card.body + ' ';
          if (card.title) content += card.title + ' ';
        });
      }
      
      // Extract from main body if available
      if (ad.snapshot?.body?.markup?.__html) {
        // Remove HTML tags
        const htmlContent = ad.snapshot.body.markup.__html;
        content += htmlContent.replace(/<[^>]*>/g, ' ') + ' ';
      }
      
      // Add title and description if available
      if (ad.snapshot?.title) content += ad.snapshot.title + ' ';
      if (ad.snapshot?.link_description) content += ad.snapshot.link_description + ' ';
      
      // Create timestamp from creation_time if available
      let creationTime: string | undefined;
      if (ad.snapshot?.creation_time) {
        creationTime = new Date(ad.snapshot.creation_time * 1000).toISOString();
      }
      
      // Find first available image URL
      let imageUrl: string | undefined;
      if (ad.snapshot?.cards && Array.isArray(ad.snapshot.cards)) {
        for (const card of ad.snapshot.cards) {
          if (card.video_preview_image_url) {
            imageUrl = card.video_preview_image_url;
            break;
          }
        }
      }
      
      // Find first available link URL
      let linkUrl: string | undefined;
      if (ad.snapshot?.cards && Array.isArray(ad.snapshot.cards)) {
        for (const card of ad.snapshot.cards) {
          if (card.link_url) {
            linkUrl = card.link_url;
            break;
          }
        }
      }
      
      return {
        adId: ad.adArchiveID,
        pageId: ad.pageID,
        pageName: ad.pageName,
        content: this.sanitizeText(content),
        title: ad.snapshot?.title,
        imageUrl,
        linkUrl,
        active: ad.isActive,
        creationTime
      };
    }).filter(Boolean) as MetaAdContent[];
  }

  // Generate analysis using Groq API
  private static async generateAdAnalysis(query: string, adContent: MetaAdContent[]): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    if (!adContent || adContent.length === 0) {
      throw new Error('No ad content available for analysis');
    }
    
    // Limit content length to keep within API limits
    const combinedContent = adContent
      .map(ad => `AD #${ad.adId} from ${ad.pageName}: "${ad.content}"`)
      .join('\n\n')
      .slice(0, 8000); // Ensure we don't exceed token limits
    
    if (!combinedContent.trim()) {
      throw new Error('Empty content after processing ad data');
    }
    
    console.log(`Generating analysis for query: ${query} with ${adContent.length} ads`);
    
    const analysisPrompt = {
      role: 'system',
      content: `You are an expert in competitive ad analysis specializing in digital marketing strategy. Analyze the provided Meta (Facebook/Instagram) ads about "${query}" and generate a comprehensive analysis in the following JSON format:

{
  "overview": "Executive summary of the competitor ad strategies using professional marketing terminology",
  "messagingStrategies": [
    {
      "strategy": "Clear, descriptive name of the messaging strategy",
      "description": "Detailed analysis of how this strategy is implemented",
      "prevalence": "Numerical value 1-10 indicating how common this approach is",
      "effectiveness": "Numerical value 1-10 indicating estimated effectiveness",
      "examples": ["Array of 2-3 brief example phrases from the ads"]
    }
  ] (exactly 4 items),
  "visualTactics": [
    {
      "tactic": "Name of the visual or design approach",
      "implementation": "How the tactic is executed in the ads",
      "impact": "Analysis of the intended emotional/psychological effect",
      "frequencyOfUse": "Numerical value 1-10 indicating prevalence"
    }
  ] (exactly 3 items),
  "audienceTargeting": [
    {
      "segment": "Identified target audience segment",
      "approach": "How the ads speak to this audience",
      "intensity": "Numerical value 1-10 indicating targeting focus",
      "engagementPotential": "Assessment of likely engagement from this segment"
    }
  ] (exactly 3 items),
  "competitiveAdvantage": "Analysis of the unique selling propositions and competitive positioning",
  "callToActionEffectiveness": [
    {
      "cta": "The specific call to action text or approach",
      "context": "How it's presented in the ad",
      "strength": "Numerical value 1-10 indicating potential effectiveness",
      "conversionPotential": "Assessment of conversion likelihood"
    }
  ] (exactly 2 items),
  "recommendedCounterStrategies": "Strategic insights for countering these competitor approaches"
}

Ensure the analysis is data-driven, uses professional marketing terminology, and provides actionable intelligence for developing competitive ad strategies. Do not repeat the same point across different sections - each insight should be unique and specific.

IMPORTANT: Return VALID JSON only with no additional text before or after the JSON object.`
    };

    const payload = {
      model: 'deepseek-r1-distill-qwen-32b',
      messages: [
        analysisPrompt,
        {
          role: 'user',
          content: combinedContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    };

    try {
      console.log('Sending request to Groq API');
      
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
        let errorMessage = `Groq API error (${response.status}): ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch (_) {
          // Changed from "e" to "_" to indicate unused variable
          // Unable to parse error JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from Groq API');
      }
      
      const analysis = data.choices[0].message.content;

      if (!analysis) {
        throw new Error('No analysis content in Groq API response');
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

  // Utility function to sanitize and limit text length
  private static sanitizeText(text: string, maxLength: number = 500): string {
    if (!text) return '';
    
    // Remove excessive whitespace and special characters
    const sanitized = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()"']/g, '')
      .trim();
    
    // Truncate if necessary
    if (sanitized.length <= maxLength) return sanitized;
    
    const truncated = sanitized.substring(0, maxLength);
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  }

  // Utility function to parse numeric values
  private static parseNumber(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^0-9-]/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}