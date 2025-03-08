import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

// Constants defined using Next.js public environment variables
const FACEBOOK_API_VERSION = process.env.NEXT_PUBLIC_FB_API_VERSION || 'v18.0';
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;
const DEFAULT_SEARCH_TERMS = process.env.NEXT_PUBLIC_DEFAULT_SEARCH_TERMS || '';
const ADS_PER_PAGE = parseInt(process.env.NEXT_PUBLIC_ADS_PER_PAGE || '25');

interface FacebookAdsParams {
  pageId?: string;
  adType?: string;
  limit?: number;
  searchTerms?: string;
  after?: string;
}

interface FacebookErrorResponse {
  error: {
    code: number;
    message: string;
    type?: string;
    fbtrace_id?: string;
  };
}

async function getFacebookAds(params: FacebookAdsParams) {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Missing Facebook Access Token in environment variables');
  }

  try {
    const response = await axios.get(
      `${FACEBOOK_API_BASE_URL}/ads_archive`,
      {
        params: {
          access_token: accessToken,
          search_terms: params.searchTerms || DEFAULT_SEARCH_TERMS,
          ad_type: params.adType || 'ALL',
          ad_reached_countries: ['IN'], // Set to India
          fields: [
            'id',
            'ad_creation_time',
            'ad_creative_body',
            'ad_creative_link_caption',
            'ad_creative_link_title',
            'ad_delivery_start_time',
            'ad_snapshot_url',
            'currency',
            'page_id',
            'page_name',
            'publisher_platforms',
            'status',
            'funding_entity',
            'demographic_distribution', // Added for Indian demographic data
            'region_distribution',      // Added for Indian region distribution
            'impressions'              // Added for reach metrics
          ].join(','),
          limit: params.limit || ADS_PER_PAGE,
          ...(params.pageId && { page_id: params.pageId }),
          ...(params.after && { after: params.after })
        },
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    return response.data;
  } catch (error) {
    // Properly type the error
    const axiosError = error as AxiosError<FacebookErrorResponse>;
    
    if (axiosError.response?.data?.error) {
      const fbError = axiosError.response.data.error;
      
      if (fbError.code === 190) {
        throw new Error('Invalid Facebook access token');
      }
      
      if (fbError.code === 10) {
        throw new Error('Application does not have required permissions');
      }
      
      if (fbError.code === 4) {
        throw new Error('Application request limit reached');
      }
      
      throw new Error(fbError.message || 'Facebook API error');
    }
    
    // Re-throw the original error if it's not an API error
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: FacebookAdsParams = {
      pageId: searchParams.get('pageId') || undefined,
      adType: searchParams.get('adType') || 'ALL',
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : ADS_PER_PAGE,
      searchTerms: searchParams.get('searchTerms') || DEFAULT_SEARCH_TERMS,
      after: searchParams.get('after') || undefined
    };
    
    const response = await getFacebookAds(params);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('API Route Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('permissions') ? 403 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}