// @/app/api/facebookAds.ts

import axios from 'axios';

export type AdType = 
  | 'ALL'
  | 'POLITICAL_AND_ISSUE_ADS'
  | 'HOUSING_ADS'
  | 'EMPLOYMENT_ADS'
  | 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS';

export interface FacebookAd {
  id: string;
  ad_creation_time: string;
  ad_creative_body: string;
  ad_creative_link_caption?: string;
  ad_creative_link_title?: string;
  ad_delivery_start_time: string;
  ad_snapshot_url: string;
  currency?: string;
  page_id: string;
  page_name: string;
  publisher_platforms: string[];
  status: string;
  funding_entity: string;
}

export interface FacebookAdLibraryResponse {
  data: FacebookAd[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface FetchAdsParams {
  pageId?: string;
  adType?: AdType;
  limit?: number;
  searchTerms?: string;
}

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export const getFacebookAds = async ({
  pageId,
  adType = 'ALL',
  limit = 25,
  searchTerms
}: FetchAdsParams): Promise<FacebookAdLibraryResponse> => {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const clientToken = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_TOKEN;

  if (!appId || !clientToken) {
    throw new Error('Missing Facebook App ID or Client Token in environment variables');
  }

  const accessToken = `${appId}|${clientToken}`;

  try {
    const response = await axios.get(
      `${FACEBOOK_API_BASE_URL}/ads_archive`,
      {
        params: {
          access_token: accessToken,
          search_terms: searchTerms || '',
          ad_type: adType,
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
          limit: limit,
          page_id: pageId || undefined,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Facebook Ads Library API Error:', error.response?.data ?? error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch Facebook ads data');
  }
};

// Default export for the API route handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageId, adType, limit, searchTerms } = req.query;
    const response = await getFacebookAds({
      pageId,
      adType: adType as AdType,
      limit: limit ? parseInt(limit) : undefined,
      searchTerms
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error('API Route Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}