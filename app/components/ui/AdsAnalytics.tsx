"use client";
import React, { useEffect, useState } from "react";
import { fetchAdsSpendingAnalytics, GoogleResult, AdSpendingAnalyticsSummary } from "@/app/api/adApi";
import { 
  TrendingUp, 
  BarChart2, 
  Target, 
  Activity 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import "@/app/styles/AdsSpending.css";

interface AdsSpendingAnalyticsProps {
  query: string;
}

const AdsSpendingAnalytics: React.FC<AdsSpendingAnalyticsProps> = ({ query }) => {
  const [results, setResults] = useState<GoogleResult[]>([]);
  const [summary, setSummary] = useState<AdSpendingAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim()) {
        setError("Please provide a search query");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchAdsSpendingAnalytics(query);
        if (response) {
          setResults(response.results);
          setSummary(response.summary);
          setError(null);
        } else {
          setError("No results found");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return (
      <div className="ads-spending-loader">
        {Array.from({ length: 4 }).map((_, i: number) => (
          <div key={i} className="ads-spending-loader__item" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="ads-spending-error">
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  const renderAdSpendingTrends = () => {
    // Add a null check and provide a fallback
    const trends = summary?.adSpendingTrends || [];

    return (
      <Card className="ads-spending-section">
        <CardHeader>
          <CardTitle>
            <TrendingUp className="mr-2 inline-block" />
            Ad Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends.length > 0 ? (
              trends.map((trend, index: number) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{trend.platform}</h3>
                  <p 
                    className="text-sm text-gray-600 mb-3" 
                    dangerouslySetInnerHTML={{ __html: trend.description }}
                  />
                  <div className="flex items-center">
                    <div className="flex-grow mr-2">
                      <Progress 
                        value={Math.min(Math.max(trend.spendingPercentage, 0), 100)} 
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {trend.spendingPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Avg. CPC: ${trend.averageCPC.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 w-full">
                No ad spending trends available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTopAdvertisers = () => {
    // Add a null check and provide a fallback
    const advertisers = summary?.topAdvertisers || [];

    return (
      <Card className="ads-spending-section">
        <CardHeader>
          <CardTitle>
            <BarChart2 className="mr-2 inline-block" />
            Top Advertisers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advertisers.length > 0 ? (
              advertisers.map((advertiser, index: number) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{advertiser.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {advertiser.industryShare}
                  </p>
                  <div className="flex items-center">
                    <div className="flex-grow mr-2">
                      <Progress 
                        value={Math.min(Math.max(advertiser.adSpendingScore, 0), 100)} 
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {advertiser.adSpendingScore}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 w-full">
                No advertiser data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMarketInsights = () => {
    // Add a null check and provide a fallback
    const insights = summary?.marketInsights || [];

    return (
      <Card className="ads-spending-section">
        <CardHeader>
          <CardTitle>
            <Target className="mr-2 inline-block" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <ul className="space-y-3">
              {insights.map((insight: string, index: number) => (
                <li 
                  key={index} 
                  className="bg-gray-50 p-3 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: insight }}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500">
              No market insights available
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="ads-spending-container">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Ads Spending Analytics</h1>
        <p className="text-gray-600">Analysis for: {query}</p>
      </header>

      {summary ? (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div 
                className="text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: summary.overview || "No overview available" }} 
              />
            </CardContent>
          </Card>

          {renderAdSpendingTrends()}
          {renderTopAdvertisers()}
          {renderMarketInsights()}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Unable to generate analysis
        </div>
      )}
    </div>
  );
};

export default AdsSpendingAnalytics;