// components/FacebookAds/index.tsx
'use client';

import React from 'react';
import { useState, useEffect } from 'react';

type AdType = 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING_ADS' | 'EMPLOYMENT_ADS' | 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS' | 'ALL';

interface FacebookAd {
  id: string;
  ad_creation_time: string;
  ad_creative_body: string | null;
  ad_creative_link_caption: string | null;
  ad_creative_link_title: string | null;
  ad_delivery_start_time: string;
  ad_snapshot_url: string;
  currency: string | null;
  page_id: string;
  page_name: string;
  publisher_platforms: string[];
  status: string;
  funding_entity: string;
}

interface FacebookAdsResponse {
  data: FacebookAd[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface Props {
  pageId?: string;
  adType?: AdType;
  limit?: number;
  searchTerms?: string;
}

function FacebookAds({ 
  pageId, 
  adType = 'ALL', 
  limit = 25, 
  searchTerms 
}: Props) {
  const [ads, setAds] = useState<FacebookAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const fetchAds = async (after?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(pageId && { pageId }),
        adType,
        limit: limit.toString(),
        ...(searchTerms && { searchTerms }),
        ...(after && { after })
      });

      const response = await fetch(`/api/facebook-ads?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ads');
      }

      const data: FacebookAdsResponse = await response.json();
      
      setAds(prev => after ? [...prev, ...data.data] : data.data);
      setNextPage(data.paging?.cursors?.after || null);
      setError(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAds([]);
    setNextPage(null);
    fetchAds();
  }, [pageId, adType, limit, searchTerms]);

  const loadMore = () => {
    if (nextPage && !loading) {
      fetchAds(nextPage);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {loading && ads.length === 0 ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid gap-4">
            {ads.map(ad => (
              <div key={ad.id} className="border p-4 rounded-lg shadow-sm">
                <h3 className="font-bold">{ad.page_name}</h3>
                {ad.ad_creative_body && (
                  <p className="mt-2 text-gray-700">{ad.ad_creative_body}</p>
                )}
                {ad.ad_creative_link_title && (
                  <p className="mt-2 text-blue-600 font-medium">
                    {ad.ad_creative_link_title}
                  </p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  <p>Created: {new Date(ad.ad_creation_time).toLocaleDateString()}</p>
                  <p>Status: {ad.status}</p>
                  <p>Funding: {ad.funding_entity}</p>
                </div>
                <a 
                  href={ad.ad_snapshot_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-500 hover:underline"
                >
                  View Ad
                </a>
              </div>
            ))}
          </div>
          {nextPage && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default FacebookAds;