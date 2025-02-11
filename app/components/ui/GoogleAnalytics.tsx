"use client";

import React, { useEffect, useState, memo } from "react";
import { TrendingUp, Search, Lightbulb, Activity } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { useGoogleSearch, GoogleSearchData } from "@/app/api/googleAnalyticsApi";
import "@/app/styles/GoogleAnalytics.css";

// Types
interface AdvertisingAnalyticsProps {
  query: string;
}

interface CardProps {
  title: string;
  content: string;
  items: string[];
  score: number;
  scoreLabel: string;
}

interface SectionProps<T> {
  icon: React.ReactNode;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
}

// Helper functions
const validateArray = <T,>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : [];
};

// Base card component
const AnalyticsCard = memo(({ title, content, items, score, scoreLabel }: CardProps) => (
  <div className="analytics-card glass-card">
    <div>
      <h3>{title}</h3>
      <p dangerouslySetInnerHTML={{ __html: content }} />
      {items.length > 0 && (
        <div className="items-list">
          <h4>{scoreLabel}s:</h4>
          <ul>
            {items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
    {score !== undefined && (
      <div className="analytics-progress-container">
        <Progress value={score} className="custom-progress" />
        <span className="analytics-percentage">
          {scoreLabel}: {score}%
        </span>
      </div>
    )}
  </div>
));

// Specialized card components
const TrendCard = memo(({ trend }: { trend: any }) => (
  <AnalyticsCard
    title={trend.title}
    content={trend.analysis}
    items={validateArray(trend.recommendations)}
    score={trend.impact}
    scoreLabel="Impact"
  />
));

const ResearchCard = memo(({ insight }: { insight: any }) => (
  <AnalyticsCard
    title={insight.key}
    content={insight.details}
    items={validateArray(insight.sources)}
    score={insight.relevance}
    scoreLabel="Relevance"
  />
));

const OpportunityCard = memo(({ opportunity }: { opportunity: any }) => (
  <AnalyticsCard
    title={opportunity.title}
    content={opportunity.description}
    items={validateArray(opportunity.actionItems)}
    score={opportunity.potentialScore}
    scoreLabel="Potential"
  />
));

const SourceCard = memo(({ result }: { result: any }) => (
  <a
    href={result.link}
    className="analytics-card glass-card"
    target="_blank"
    rel="noopener noreferrer"
  >
    <h3>{result.title}</h3>
    <p>{result.snippet}</p>
  </a>
));

// Generic section component
const AnalyticsSection = <T,>({
  icon,
  title,
  items,
  renderItem,
  emptyMessage
}: SectionProps<T>) => (
  <section className="analytics-section">
    <h2>
      {icon}
      {title}
    </h2>
    <div className="analytics-grid">
      {items.length > 0 ? (
        items.map((item, index) => renderItem(item, index))
      ) : (
        <div className="analytics-card glass-card">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  </section>
);

// Loading component
const LoadingSpinner = memo(() => (
  <div className="analytics-loader">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="analytics-loader__item" />
    ))}
  </div>
));

// Main component
const AdvertisingAnalytics: React.FC<AdvertisingAnalyticsProps> = ({ query }) => {
  const { searchData, search, isLoading, error } = useGoogleSearch();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || hasSearched) return;
      await search(query);
      setHasSearched(true);
    };

    fetchData();
  }, [query, search, hasSearched]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !searchData?.success) {
    return (
      <div className="analytics-error">
        {error || searchData?.error || "Failed to fetch research data"}
      </div>
    );
  }

  if (!searchData?.data?.analysis || !searchData?.data?.results) {
    return (
      <div className="analytics-error">
        No analysis data available
      </div>
    );
  }

  const { results, analysis } = searchData.data;

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Market Research Dashboard</h1>
        <p className="query-text">Research Analysis for: {query}</p>
      </header>

      <div className="analytics-content">
        <section className="analytics-overview">
          <div dangerouslySetInnerHTML={{ __html: analysis.overview }} />
        </section>

        <AnalyticsSection
          icon={<TrendingUp className="section-icon" />}
          title="Market Trends Analysis"
          items={validateArray(analysis.trends)}
          renderItem={(trend, index) => <TrendCard key={index} trend={trend} />}
          emptyMessage="No trend data available"
        />

        <AnalyticsSection
          icon={<Search className="section-icon" />}
          title="Research Insights"
          items={validateArray(analysis.research)}
          renderItem={(insight, index) => <ResearchCard key={index} insight={insight} />}
          emptyMessage="No research insights available"
        />

        <AnalyticsSection
          icon={<Lightbulb className="section-icon" />}
          title="Market Opportunities"
          items={validateArray(analysis.opportunities)}
          renderItem={(opportunity, index) => (
            <OpportunityCard key={index} opportunity={opportunity} />
          )}
          emptyMessage="No market opportunities available"
        />

        <AnalyticsSection
          icon={<Activity className="section-icon" />}
          title="Source Data"
          items={validateArray(results)}
          renderItem={(result, index) => <SourceCard key={index} result={result} />}
          emptyMessage="No source data available"
        />
      </div>
    </div>
  );
};

export default memo(AdvertisingAnalytics);