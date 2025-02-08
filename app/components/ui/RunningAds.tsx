import React, { useState, useEffect } from "react";
import { searchMetaAds, MetaAdResult } from "@/app/api/facebookAds";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";

interface MetaAdsProps {
  query: string;
  className?: string;
  heading?: string;
  limit?: number;
}

const MetaAds: React.FC<MetaAdsProps> = ({
  query,
  className = "",
  heading = "Advertisement Search Results",
  limit = 10,
}) => {
  const [ads, setAds] = useState<MetaAdResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchMetaAds({
          query: query,
          active_status: 'all',
          media_types: 'all',
          platform: 'facebook,instagram',
          ad_type: 'all',
          search_type: 'keyword_unordered'
        });

        // Flatten and slice the nested results array
        const flattenedAds = response.results.flat().slice(0, limit);
        setAds(flattenedAds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch ads");
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchAdsData();
    }
  }, [query, limit]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">{heading}</CardTitle>
        <div className="flex items-center space-x-2">
          <button
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Scroll left"
            onClick={() => {
              const scrollArea = document.querySelector(".scroll-area");
              if (scrollArea) {
                scrollArea.scrollBy({ left: -300, behavior: "smooth" });
              }
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Scroll right"
            onClick={() => {
              const scrollArea = document.querySelector(".scroll-area");
              if (scrollArea) {
                scrollArea.scrollBy({ left: 300, behavior: "smooth" });
              }
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : ads.length > 0 ? (
          <ScrollArea className="scroll-area w-full whitespace-nowrap">
            <div className="flex space-x-4">
              {ads.map((ad) => (
                <Card key={ad.adArchiveID} className="w-80 flex-none">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">{ad.pageName}</h3>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {ad.entityType}
                        </span>
                        {ad.containsDigitallyCreatedMedia && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                            Digital Media
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>Status: {ad.isActive ? 'Active' : 'Inactive'}</p>
                        {ad.containsSensitiveContent && (
                          <p className="text-yellow-600">Contains sensitive content</p>
                        )}
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          Started: {new Date(ad.startDate * 1000).toLocaleDateString()}
                        </span>
                        {ad.endDate && (
                          <span>
                            Ends: {new Date(ad.endDate * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        ID: {ad.adArchiveID}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-center text-gray-500">No ads found for "{query}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetaAds;