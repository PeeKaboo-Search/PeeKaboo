"use client";
import React, { useEffect, useState, Suspense, lazy } from "react";
import { fetchRedditResults } from "@/app/api/redditAnalysis";
import { TrendingUp, Award, Lightbulb, Activity } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import "@/app/styles/reddit-analysis.css";

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

interface RedditResult {
  title: string;
  subreddit: string;
  snippet: string;
  link?: string;
}

interface RedditAnalyticsProps {
  query: string;
}

// Lazy loaded content wrapper
const AnalyticsContent = lazy(() => Promise.resolve({
  default: ({
    summary,
    results
  }: {
    summary: AnalyticsSummary;
    results: RedditResult[];
  }) => {
    const renderTrendsSection = () => (
      <section className="analytics-section trends">
        <h2>
          <TrendingUp className="section-icon" />
          Community Trends
        </h2>
        <div className="analytics-grid">
          {summary.trends.map((trend, index) => (
            <div key={index} className="analytics-card glass-card">
              <div>
                <h3 dangerouslySetInnerHTML={{ __html: trend.title }} />
                <p dangerouslySetInnerHTML={{ __html: trend.description }} />
              </div>
              <div className="analytics-progress-container">
                <Progress value={trend.percentage} className="custom-progress" />
                <span className="analytics-percentage">{trend.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

    const renderCompetitorsSection = () => (
      <section className="analytics-section competitors">
        <h2>
          <Award className="section-icon" />
          Community Discussions
        </h2>
        <div className="analytics-grid">
          {summary.competitors.map((competitor, index) => (
            <div key={index} className="analytics-card glass-card">
              <div>
                <h3 dangerouslySetInnerHTML={{ __html: competitor.name }} />
                <p dangerouslySetInnerHTML={{ __html: competitor.strength }} />
              </div>
              <div className="analytics-progress-container">
                <Progress value={competitor.score} className="custom-progress" />
                <span className="analytics-percentage">{competitor.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

    const renderOpportunitiesSection = () => (
      <section className="analytics-section opportunities">
        <h2>
          <Lightbulb className="section-icon" />
          Community Engagement Opportunities
        </h2>
        <div className="analytics-grid">
          {summary.opportunities.map((opportunity, index) => (
            <div key={index} className="analytics-card glass-card">
              <p dangerouslySetInnerHTML={{ __html: opportunity }} />
            </div>
          ))}
        </div>
      </section>
    );

    const renderSourceDataSection = () => (
      <section className="analytics-section source-data">
        <h2>
          <Activity className="section-icon" />
          Reddit Discussion Data
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
              <p className="subreddit-label">{result.subreddit}</p>
              <p dangerouslySetInnerHTML={{ __html: result.snippet }} />
            </a>
          ))}
        </div>
      </section>
    );

    return (
      <div className="analytics-content">
        <section className="analytics-overview">
          <div dangerouslySetInnerHTML={{ __html: summary.overview }} />
        </section>
        {renderTrendsSection()}
        {renderCompetitorsSection()}
        {renderOpportunitiesSection()}
        {renderSourceDataSection()}
      </div>
    );
  }
}));

const LoadingSpinner = () => (
  <div className="analytics-loader">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="analytics-loader__item" />
    ))}
  </div>
);

const RedditAnalytics: React.FC<RedditAnalyticsProps> = ({ query }) => {
  const [results, setResults] = useState<RedditResult[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim()) {
        setError("Please provide a Reddit search query");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchRedditResults(query);
        if (response) {
          setResults(response.results);
          setSummary(response.summary);
          setError(null);
        } else {
          setError("No Reddit insights found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch Reddit data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Reddit Community Insights Dashboard</h1>
        <p className="query-text">Community Analysis for: {query}</p>
      </header>
      {summary && (
        <Suspense fallback={<LoadingSpinner />}>
          <AnalyticsContent summary={summary} results={results} />
        </Suspense>
      )}
    </div>
  );
};

export default RedditAnalytics;