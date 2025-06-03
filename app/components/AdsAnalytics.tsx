"use client";
import React, { useEffect, useState } from "react";
import { fetchAdsSpendingAnalytics } from "@/api/adApi";
import { 
  TrendingUp, 
  BarChart2, 
  Target, 
  Activity 
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import "@/app/styles/AdsSpending.css";

interface AdSpendingTrend {
  platform: string;
  description: string;
  spendingPercentage: number;
  averageCPC: number;
}

interface TopAdvertiser {
  name: string;
  industryShare: string;
  adSpendingScore: number;
}

interface AdsSpendingAnalyticsSummary {
  overview: string;
  adSpendingTrends: AdSpendingTrend[];
  topAdvertisers: TopAdvertiser[];
  marketInsights: string[];
}

interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
}

interface AdsSpendingAnalyticsProps {
  query: string;
}

const AdsSpendingAnalytics: React.FC<AdsSpendingAnalyticsProps> = ({ query }) => {
  const [results, setResults] = useState<GoogleResult[]>([]);
  const [summary, setSummary] = useState<AdsSpendingAnalyticsSummary | null>(null);
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
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return (
      <div className="analytics-loader">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="analytics-loader__item" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  const renderAdSpendingTrendsSection = () => (
    <section className="analytics-section trends">
      <h2>
        <TrendingUp className="section-icon" />
        Ad Spending Trends
      </h2>
      <div className="analytics-grid">
        {summary?.adSpendingTrends.map((trend, index) => (
          <div key={index} className="analytics-card glass-card">
            <div>
              <h3>{trend.platform}</h3>
              <p dangerouslySetInnerHTML={{ __html: trend.description }} />
            </div>
            <div className="analytics-progress-container">
              <Progress value={trend.spendingPercentage} className="custom-progress" />
              <span className="analytics-percentage">{trend.spendingPercentage}%</span>
            </div>
            <div className="text-sm text-white/60 mt-2">
              Avg. CPC: ${trend.averageCPC.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderTopAdvertisersSection = () => (
    <section className="analytics-section competitors">
      <h2>
        <BarChart2 className="section-icon" />
        Top Advertisers
      </h2>
      <div className="analytics-grid">
        {summary?.topAdvertisers.map((advertiser, index) => (
          <div key={index} className="analytics-card glass-card">
            <div>
              <h3>{advertiser.name}</h3>
              <p>{advertiser.industryShare}</p>
            </div>
            <div className="analytics-progress-container">
              <Progress value={advertiser.adSpendingScore} className="custom-progress" />
              <span className="analytics-percentage">{advertiser.adSpendingScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderMarketInsightsSection = () => (
    <section className="analytics-section opportunities">
      <h2>
        <Target className="section-icon" />
        Market Insights
      </h2>
      <div className="analytics-grid">
        {summary?.marketInsights.map((insight, index) => (
          <div key={index} className="analytics-card glass-card">
            <p dangerouslySetInnerHTML={{ __html: insight }} />
          </div>
        ))}
      </div>
    </section>
  );

  const renderSourceDataSection = () => (
    <section className="analytics-section source-data">
      <h2>
        <Activity className="section-icon" />
        Source Data
      </h2>
      <div className="analytics-grid">
        {results.map((result, index) => (
          <a
            key={index}
            href={result.link}
            className="analytics-card glass-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 dangerouslySetInnerHTML={{ __html: result.title }} />
            <p dangerouslySetInnerHTML={{ __html: result.snippet }} />
          </a>
        ))}
      </div>
    </section>
  );

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Ads Spending Analytics</h1>
        <p className="query-text">Analysis for: {query}</p>
      </header>

      {summary && (
        <div className="analytics-content">
          <section className="analytics-overview">
            <div dangerouslySetInnerHTML={{ __html: summary.overview }} />
          </section>
          {renderAdSpendingTrendsSection()}
          {renderTopAdvertisersSection()}
          {renderMarketInsightsSection()}
          {renderSourceDataSection()}
        </div>
      )}
    </div>
  );
};

export default AdsSpendingAnalytics;