import axios from 'axios';

// Types for API responses
export interface MetaAdResult {
  adid: string;
  adArchiveID: string;
  pageID: string;
  pageName: string;
  entityType: string;
  currency: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
  isProfilePage: boolean;
  containsDigitallyCreatedMedia: boolean;
  containsSensitiveContent: boolean;
}

export interface MetaAPIResponse {
  query: string;
  country_code: string;
  media_types: string;
  platform: string[];
  continuation_token: string | null;
  is_result_complete: boolean;
  number_of_ads: number;
  active_status: string;
  ad_type: string;
  search_type: string;
  results: MetaAdResult[][];
}

export interface SearchAdsParams {
  query: string;
  active_status?: string;
  media_types?: string;
  platform?: string;
  ad_type?: string;
  search_type?: string;
}

const API_HOST = 'meta-ad-library.p.rapidapi.com';
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

export async function searchMetaAds(params: SearchAdsParams): Promise<MetaAPIResponse> {
  if (!API_KEY) {
    throw new Error('API key is not configured');
  }

  const options = {
    method: 'GET',
    url: `https://${API_HOST}/search/ads`,
    params: {
      query: params.query,
      active_status: params.active_status || 'all',
      media_types: params.media_types || 'all',
      platform: params.platform || 'facebook,instagram',
      ad_type: params.ad_type || 'all',
      search_type: params.search_type || 'keyword_unordered'
    },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await axios.request<MetaAPIResponse>(options);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.status} - ${error.response?.statusText}`);
    }
    throw error;
  }
}