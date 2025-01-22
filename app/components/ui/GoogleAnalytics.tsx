"use client";
import React, { useEffect, useState } from "react";
import { fetchGoogleResults } from "app/api/googleAnalyticsApi";
import { Alert } from "@/app/components/ui/alert";
import { TrendingUp, Award, Lightbulb, Activity } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import "app/styles/GoogleAnalytics.css";

interface Trend {
  title: string;
  description: string;
  percentage: number;
}

interface Competitor {
  name: string;
  strength: string;
  score: number;
}

interface AnalyticsSummary {
  overview: string;
  trends: Trend[];
  competitors: Competitor[];
  opportunities: string[];
}

interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleAnalyticsProps {
  query: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ query }) => {
  const [results, setResults] = useState<GoogleResult[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
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
        const response = await fetchGoogleResults(query);
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
    return <Alert className="analytics-error">{error}</Alert>;
  }

  const renderTrendsSection = () => (
    <section className="analytics-section trends">
      <h2>
        <TrendingUp className="icon" />
        Market Trends
      </h2>
      <div className="analytics-grid">
        {summary?.trends.map((trend, index) => (
          <div key={index} className="analytics-card">
            <h3>{trend.title}</h3>
            <p>{trend.description}</p>
            <div className="analytics-progress">
              <Progress value={trend.percentage} />
            </div>
            <span className="analytics-percentage">{trend.percentage}%</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderCompetitorsSection = () => (
    <section className="analytics-section competitors">
      <h2>
        <Award className="icon" />
        Competitor Analysis
      </h2>
      <div className="analytics-grid">
        {summary?.competitors.map((competitor, index) => (
          <div key={index} className="analytics-card">
            <h3>{competitor.name}</h3>
            <p>{competitor.strength}</p>
            <div className="analytics-progress">
              <Progress value={competitor.score} />
            </div>
            <span className="analytics-percentage">{competitor.score}%</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderOpportunitiesSection = () => (
    <section className="analytics-section opportunities">
      <h2>
        <Lightbulb className="icon" />
        Market Opportunities
      </h2>
      <div className="analytics-grid">
        {summary?.opportunities.map((opportunity, index) => (
          <div key={index} className="analytics-card">
            <p>{opportunity}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSourceDataSection = () => (
    <section className="analytics-section">
      <h2>
        <Activity className="icon" />
        Source Data
      </h2>
      <div className="analytics-grid">
        {results.map((result, index) => (
          <a
            key={index}
            href={result.link}
            className="analytics-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>{result.title}</h3>
            <p>{result.snippet}</p>
          </a>
        ))}
      </div>
    </section>
  );

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p className="text-secondary">Analysis for: {query}</p>
      </header>

      {summary && (
        <div className="analytics-content">
          <section className="analytics-overview">
            <div dangerouslySetInnerHTML={{ __html: summary.overview }} />
          </section>
          {renderTrendsSection()}
          {renderCompetitorsSection()}
          {renderOpportunitiesSection()}
          {renderSourceDataSection()}
        </div>
      )}
    </div>
  );
};

export default GoogleAnalytics;