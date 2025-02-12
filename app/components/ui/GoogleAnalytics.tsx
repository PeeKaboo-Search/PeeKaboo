"use client";

import React, { useEffect, useState, memo } from "react";
import { 
  TrendingUp, Target, Calendar,
  Lightbulb, Users, Eye
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { useMarketResearch } from "@/app/api/googleAnalyticsApi";
import "@/app/styles/GoogleAnalytics.css"

// Types
interface MarketResearchProps {
  query: string;
}

interface CardProps {
  title: string;
  description: string;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  timing?: string;
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
const ResearchCard = memo(({ title, description, items, score, scoreLabel, timing }: CardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {timing && <span className="text-sm opacity-70">{timing}</span>}
    </div>
    <div className="space-y-4">
      <p dangerouslySetInnerHTML={{ __html: description }} />
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )}
    </div>
    {score !== undefined && (
      <div className="mt-4 space-y-2">
        <Progress value={score} className="h-2" />
        <span className="text-sm">
          {scoreLabel}: {score}%
        </span>
      </div>
    )}
  </div>
));

// Specialized card components
const TrendCard = memo(({ trend }: { trend: any }) => (
  <ResearchCard
    title={trend.title}
    description={trend.description}
    items={[
      `<strong>Audience:</strong> ${trend.audience.join(", ")}`,
      `<strong>Platforms:</strong> ${trend.platforms.join(", ")}`,
      ...trend.contentIdeas.map(idea => `<strong>Content Idea:</strong> ${idea}`),
      ...trend.bestPractices.map(practice => `<strong>Best Practice:</strong> ${practice}`)
    ]}
    score={trend.impact}
    scoreLabel="Impact Score"
  />
));

const InsightCard = memo(({ insight }: { insight: any }) => (
  <ResearchCard
    title={insight.title}
    description={insight.keyFindings.join("<br/>")}
    items={[
      ...insight.implications.map(imp => `<strong>Implication:</strong> ${imp}`),
      ...insight.opportunities.map(opp => `<strong>Opportunity:</strong> ${opp}`),
      ...insight.recommendations.map(rec => `<strong>Recommendation:</strong> ${rec}`)
    ]}
  />
));

const SeasonalCard = memo(({ topic }: { topic: any }) => (
  <ResearchCard
    title={topic.topic}
    description={topic.description}
    items={[
      ...topic.marketingAngles.map(angle => `<strong>Marketing Angle:</strong> ${angle}`),
      ...topic.contentSuggestions.map(sugg => `<strong>Content Suggestion:</strong> ${sugg}`)
    ]}
    score={topic.relevance}
    scoreLabel="Relevance Score"
    timing={topic.timing}
  />
));

// Market overview component
const MarketOverview = memo(({ overview }: { overview: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
      <h3 className="text-lg font-semibold">Target Audience</h3>
      <p className="text-sm mt-2">{overview.targetAudience.join(", ")}</p>
    </div>
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
      <h3 className="text-lg font-semibold">Demographics</h3>
      <p className="text-sm mt-2">{overview.demographics.join(", ")}</p>
    </div>
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
      <h3 className="text-lg font-semibold">Psychographics</h3>
      <p className="text-sm mt-2">{overview.psychographics.join(", ")}</p>
    </div>
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
      <h3 className="text-lg font-semibold">Key Channels</h3>
      <p className="text-sm mt-2">{overview.channels.join(", ")}</p>
    </div>
  </div>
));

// Generic section component
const ResearchSection = <T,>({
  icon,
  title,
  items,
  renderItem,
  emptyMessage
}: SectionProps<T>) => (
  <section className="mt-8">
    <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
      {icon}
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length > 0 ? (
        items.map((item, index) => renderItem(item, index))
      ) : (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  </section>
);

// Main component
const MarketResearchDashboard: React.FC<MarketResearchProps> = ({ query }) => {
  const { researchData, research, isLoading, error } = useMarketResearch();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || hasSearched) return;
      await research(query);
      setHasSearched(true);
    };

    fetchData();
  }, [query, research, hasSearched]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !researchData?.success) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || researchData?.error || "Failed to fetch research data"}
      </div>
    );
  }

  if (!researchData?.data?.analysis) {
    return (
      <div className="text-center p-4">
        No analysis data available
      </div>
    );
  }

  const { analysis } = researchData.data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketing Research Analysis</h1>
        <p className="text-lg opacity-70">Campaign Research for: {query}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
          <div className="mb-6" dangerouslySetInnerHTML={{ __html: analysis.executiveSummary }} />
          <MarketOverview overview={analysis.marketOverview} />
        </section>

        <ResearchSection
          icon={<TrendingUp className="w-6 h-6" />}
          title="Current Trends"
          items={validateArray(analysis.trends)}
          renderItem={(trend, index) => (
            <TrendCard key={index} trend={trend} />
          )}
          emptyMessage="No trends available"
        />

        <ResearchSection
          icon={<Eye className="w-6 h-6" />}
          title="Consumer Insights"
          items={validateArray(analysis.consumerInsights)}
          renderItem={(insight, index) => (
            <InsightCard key={index} insight={insight} />
          )}
          emptyMessage="No consumer insights available"
        />

        <ResearchSection
          icon={<Lightbulb className="w-6 h-6" />}
          title="Industry Insights"
          items={validateArray(analysis.industryInsights)}
          renderItem={(insight, index) => (
            <InsightCard key={index} insight={insight} />
          )}
          emptyMessage="No industry insights available"
        />

        <ResearchSection
          icon={<Calendar className="w-6 h-6" />}
          title="Seasonal & Emerging Topics"
          items={validateArray(analysis.seasonalTopics)}
          renderItem={(topic, index) => (
            <SeasonalCard key={index} topic={topic} />
          )}
          emptyMessage="No seasonal topics available"
        />

        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <Target className="w-6 h-6" />
            Strategic Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ResearchCard
              title="Content Strategy"
              description="Content Creation Guidelines"
              items={analysis.recommendations.contentStrategy}
            />
            <ResearchCard
              title="Timing"
              description="Optimal Publishing Schedule"
              items={analysis.recommendations.timing}
            />
            <ResearchCard
              title="Platforms"
              description="Channel Strategy"
              items={analysis.recommendations.platforms}
            />
            <ResearchCard
              title="Messaging"
              description="Key Messages"
              items={analysis.recommendations.messaging}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default memo(MarketResearchDashboard);