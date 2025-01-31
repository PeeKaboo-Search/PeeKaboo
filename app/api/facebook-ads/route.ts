// app/api/facebook-ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

// Required permissions for Ad Library API
const REQUIRED_PERMISSIONS = [
  'ads_read',
  'ads_management',
  'read_insights'
];

interface FacebookAdsParams {
  pageId?: string;
  adType?: string;
  limit?: number;
  searchTerms?: string;
  after?: string;
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
          search_terms: params.searchTerms || '',
          ad_type: params.adType || 'ALL',
          ad_reached_countries: ['US'],
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
            'funding_entity'
          ].join(','),
          limit: params.limit || 25,
          ...(params.pageId && { page_id: params.pageId }),
          ...(params.after && { after: params.after })
        },
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error: any) {
    // Handle specific Facebook API errors
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      
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
    
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Properly handle null values from searchParams
    const params: FacebookAdsParams = {
      pageId: searchParams.get('pageId') || undefined,
      adType: searchParams.get('adType') || 'ALL',
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 25,
      searchTerms: searchParams.get('searchTerms') || undefined,
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