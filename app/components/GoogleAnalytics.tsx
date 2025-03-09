"use client";

import React, { useEffect, useState, memo } from "react";
import { 
  TrendingUp, Calendar,
  Lightbulb, Eye, 
  KeyRound // For product triggers
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

// Define interfaces for each data type
interface Trend {
  title: string;
  description: string;
  audience: string[];
  platforms: string[];
  contentIdeas: string[];
  bestPractices: string[];
  impact: number;
}

interface Insight {
  title: string;
  keyFindings: string[];
  implications: string[];
  opportunities: string[];
  recommendations: string[];
}

interface SeasonalTopic {
  topic: string;
  description: string;
  marketingAngles: string[];
  contentSuggestions: string[];
  relevance: number;
  timing: string;
}

// Updated Trigger interface to match the new product-focused structure
interface Trigger {
  productFeature: string;
  userNeed: string;
  recommendedProductContent: string[];
  relevance: number;
}

// Removed unused MarketOverviewData interface

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

ResearchCard.displayName = 'ResearchCard';

// Specialized card components
const TrendCard = memo(({ trend }: { trend: Trend }) => (
  <ResearchCard
    title={trend.title}
    description={trend.description}
    items={[
      `<strong>Audience:</strong> ${trend.audience.join(", ")}`,
      `<strong>Platforms:</strong> ${trend.platforms.join(", ")}`,
      ...trend.contentIdeas.map((idea: string) => `<strong>Content Idea:</strong> ${idea}`),
      ...trend.bestPractices.map((practice: string) => `<strong>Best Practice:</strong> ${practice}`)
    ]}
    score={trend.impact}
    scoreLabel="Impact Score"
  />
));

TrendCard.displayName = 'TrendCard';

const InsightCard = memo(({ insight }: { insight: Insight }) => (
  <ResearchCard
    title={insight.title}
    description={insight.keyFindings.join("<br/>")}
    items={[
      ...insight.implications.map((imp: string) => `<strong>Implication:</strong> ${imp}`),
      ...insight.opportunities.map((opp: string) => `<strong>Opportunity:</strong> ${opp}`),
      ...insight.recommendations.map((rec: string) => `<strong>Recommendation:</strong> ${rec}`)
    ]}
  />
));

InsightCard.displayName = 'InsightCard';

const SeasonalCard = memo(({ topic }: { topic: SeasonalTopic }) => (
  <ResearchCard
    title={topic.topic}
    description={topic.description}
    items={[
      ...topic.marketingAngles.map((angle: string) => `<strong>Marketing Angle:</strong> ${angle}`),
      ...topic.contentSuggestions.map((sugg: string) => `<strong>Content Suggestion:</strong> ${sugg}`)
    ]}
    score={topic.relevance}
    scoreLabel="Relevance Score"
    timing={topic.timing}
  />
));

SeasonalCard.displayName = 'SeasonalCard';

// Updated Trigger Card component for product triggers
const TriggerCard = memo(({ trigger }: { trigger: Trigger }) => (
  <ResearchCard
    title={trigger.productFeature}
    description={`<strong>User Need:</strong> ${trigger.userNeed}`}
    items={[
      ...trigger.recommendedProductContent.map((content: string) => `<strong>Product Content:</strong> ${content}`)
    ]}
    score={trigger.relevance}
    scoreLabel="Relevance Score"
  />
));

TriggerCard.displayName = 'TriggerCard';

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
        <h1 className="text-3xl font-bold mb-2">Product Research Analysis</h1>
        <p className="text-lg opacity-70">Product Research for: {query}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
          <div className="mb-6" dangerouslySetInnerHTML={{ __html: analysis.executiveSummary }} />
        </section>

        {/* Top Triggers Section - Updated for product triggers */}
        <ResearchSection
          icon={<KeyRound className="w-6 h-6" />}
          title="Top 10 Product Triggers"
          items={validateArray(analysis.topTriggers)}
          renderItem={(trigger, index) => (
            <TriggerCard key={index} trigger={trigger} />
          )}
          emptyMessage="No product triggers available"
        />

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
      </div>
    </div>
  );
};

MarketResearchDashboard.displayName = 'MarketResearchDashboard';

export default memo(MarketResearchDashboard);