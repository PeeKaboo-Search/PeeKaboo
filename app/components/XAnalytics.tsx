"use client";

import React, { useEffect, useState, memo } from "react";
import { 
  BarChart, MessageCircle, 
  Lightbulb, TrendingUp, 
  Calendar, Target
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { useTwitterAnalysis } from "@/app/api/xAnalytics";

const validateArray = <T,>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : [];
};

// Base card component
const AnalysisCard = memo(({ title, description, items, score, scoreLabel, timing }: {
  title: string;
  description: string | React.ReactNode;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  timing?: string;
}) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {timing && <span className="text-sm opacity-70">{timing}</span>}
    </div>
    <div className="space-y-4">
      {typeof description === 'string' ? (
        <p dangerouslySetInnerHTML={{ __html: description }} />
      ) : (
        description
      )}
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

AnalysisCard.displayName = 'AnalysisCard';

// Sentiment Analysis Card
const SentimentCard = memo(({ sentiment }: { 
  sentiment: { 
    score: number; 
    label: string; 
    confidence: number;
    keywords: string[];
  } 
}) => {
  // Convert sentiment score (-1 to 1) to percentage (0 to 100)
  const sentimentPercentage = ((sentiment.score + 1) / 2) * 100;
  
  // Determine color based on sentiment
  const getSentimentColor = () => {
    if (sentiment.label === 'positive') return 'text-green-400';
    if (sentiment.label === 'negative') return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <AnalysisCard
      title="Sentiment Analysis"
      description={
        <div>
          <p className={`text-lg font-medium ${getSentimentColor()}`}>
            {sentiment.label.toUpperCase()} SENTIMENT
          </p>
          <p className="mt-2">Confidence: {(sentiment.confidence * 100).toFixed(1)}%</p>
          <div className="mt-3">
            <p className="font-medium">Key sentiment drivers:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {sentiment.keywords.map((keyword, idx) => (
                <span key={idx} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      }
      score={sentimentPercentage}
      scoreLabel="Sentiment Score"
    />
  );
});

SentimentCard.displayName = 'SentimentCard';

// Content Pattern Card
const PatternCard = memo(({ pattern }: { 
  pattern: {
    pattern: string;
    description: string;
    frequency: number;
    examples: string[];
    relevance: number;
  }
}) => (
  <AnalysisCard
    title={pattern.pattern}
    description={pattern.description}
    items={[
      `<strong>Examples:</strong> ${pattern.examples.join(", ")}`,
      `<strong>Frequency:</strong> ${pattern.frequency}/10`,
      `<strong>Marketing Relevance:</strong> ${pattern.relevance}/10`
    ]}
    score={pattern.relevance * 10}
    scoreLabel="Relevance"
  />
));

PatternCard.displayName = 'PatternCard';

// Top Tweet Card
const TweetCard = memo(({ tweet }: { 
  tweet: {
    content: string;
    engagement: number;
    reason: string;
    influence_score: number;
  }
}) => (
  <AnalysisCard
    title="High Impact Tweet"
    description={`"${tweet.content}"`}
    items={[
      `<strong>Engagement:</strong> ${tweet.engagement}`,
      `<strong>Influence Score:</strong> ${tweet.influence_score.toFixed(1)}`,
      `<strong>Why It Works:</strong> ${tweet.reason}`
    ]}
    score={(tweet.influence_score / 100) * 100}
    scoreLabel="Influence"
  />
));

TweetCard.displayName = 'TweetCard';

// Marketing Insight Card
const InsightCard = memo(({ insights }: { 
  insights: {
    userSentiment: string;
    actionableInsights: string[];
    marketingRecommendations: {
      contentStrategy: string[];
      engagementTactics: string[];
      brandPositioning: string;
    };
  }
}) => (
  <AnalysisCard
    title="Marketing Insights"
    description={insights.userSentiment}
    items={[
      "<strong>Content Strategy:</strong>",
      ...insights.marketingRecommendations.contentStrategy.map(strategy => `• ${strategy}`),
      "<strong>Engagement Tactics:</strong>",
      ...insights.marketingRecommendations.engagementTactics.map(tactic => `• ${tactic}`),
      "<strong>Brand Positioning:</strong>",
      `• ${insights.marketingRecommendations.brandPositioning}`,
      "<strong>Actionable Insights:</strong>",
      ...insights.actionableInsights.map(insight => `• ${insight}`)
    ]}
  />
));

InsightCard.displayName = 'InsightCard';

// Competitor Analysis Card
const CompetitorCard = memo(({ competitors }: { 
  competitors: Array<{
    name: string;
    frequency: number;
    sentiment: string;
  }>
}) => (
  <AnalysisCard
    title="Competitor Analysis"
    description="Competitor mentions and sentiment analysis:"
    items={competitors.map(comp => 
      `<strong>${comp.name}:</strong> Mentioned ${comp.frequency} times with ${comp.sentiment} sentiment`
    )}
  />
));

CompetitorCard.displayName = 'CompetitorCard';

// Temporal Analysis Card
const TemporalCard = memo(({ temporal }: { 
  temporal: {
    patterns: {
      timeOfDay: string[];
      dayOfWeek: string[];
    };
    trends: {
      emerging: string[];
      fading: string[];
    };
  }
}) => (
  <AnalysisCard
    title="Timing & Trends"
    description="Optimal posting times and trending topics:"
    items={[
      "<strong>Best Times:</strong> " + temporal.patterns.timeOfDay.join(", "),
      "<strong>Best Days:</strong> " + temporal.patterns.dayOfWeek.join(", "),
      "<strong>Emerging Trends:</strong>",
      ...temporal.trends.emerging.map(trend => `• ${trend}`),
      "<strong>Fading Trends:</strong>",
      ...temporal.trends.fading.map(trend => `• ${trend}`)
    ]}
  />
));

TemporalCard.displayName = 'TemporalCard';

// Generic section component
const AnalysisSection = <T,>({
  icon,
  title,
  items,
  renderItem,
  emptyMessage
}: {
  icon: React.ReactNode;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
}) => (
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

// Main Twitter Analysis Dashboard Component
const TwitterAnalysisDashboard = memo(({ 
  query,
  options
}: { 
  query: string;
  options?: {
    competitors?: string[];
    industry?: string;
    marketSegment?: string;
  };
}) => {
  const { data, isLoading, error, analyze } = useTwitterAnalysis();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || hasSearched) return;
      await analyze(query, options);
      setHasSearched(true);
    };

    fetchData();
  }, [query, options, analyze, hasSearched]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !data?.analysis) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || "Failed to fetch Twitter analysis data"}
      </div>
    );
  }

  const { analysis } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Twitter Analysis Dashboard</h1>
        <p className="text-lg opacity-70">Analysis for: {query}</p>
        <div className="mt-4 p-4 bg-white/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Executive Summary</h2>
          <p>{analysis.overview}</p>
        </div>
      </header>

      <div className="space-y-8">
        {/* Sentiment Analysis */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <BarChart className="w-6 h-6" />
            Sentiment Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SentimentCard sentiment={analysis.sentimentAnalysis} />
          </div>
        </section>

        {/* Content Patterns */}
        <AnalysisSection
          icon={<MessageCircle className="w-6 h-6" />}
          title="Content Patterns"
          items={validateArray(analysis.contentPatterns)}
          renderItem={(pattern, index) => (
            <PatternCard key={index} pattern={pattern} />
          )}
          emptyMessage="No content patterns available"
        />

        {/* Top Tweets */}
        <AnalysisSection
          icon={<TrendingUp className="w-6 h-6" />}
          title="High Impact Tweets"
          items={validateArray(analysis.engagement?.topTweets)}
          renderItem={(tweet, index) => (
            <TweetCard key={index} tweet={tweet} />
          )}
          emptyMessage="No top tweets available"
        />

        {/* Marketing Insights */}
        <AnalysisSection
          icon={<Target className="w-6 h-6" />}
          title="Marketing Strategy"
          items={[analysis.marketInsights]}
          renderItem={(insights, index) => (
            <InsightCard key={index} insights={insights} />
          )}
          emptyMessage="No marketing insights available"
        />

        {/* Competitor Analysis */}
        {analysis.marketInsights?.competitorAnalysis && 
        analysis.marketInsights.competitorAnalysis.length > 0 && (
          <AnalysisSection
            icon={<Lightbulb className="w-6 h-6" />}
            title="Competitor Analysis"
            items={[analysis.marketInsights.competitorAnalysis]}
            renderItem={(competitors, index) => (
              <CompetitorCard key={index} competitors={competitors} />
            )}
            emptyMessage="No competitor data available"
          />
        )}

        {/* Temporal Analysis */}
        <AnalysisSection
          icon={<Calendar className="w-6 h-6" />}
          title="Timing & Trends"
          items={[analysis.temporalAnalysis]}
          renderItem={(temporal, index) => (
            <TemporalCard key={index} temporal={temporal} />
          )}
          emptyMessage="No temporal analysis available"
        />
      </div>
    </div>
  );
});

TwitterAnalysisDashboard.displayName = 'TwitterAnalysisDashboard';

export default TwitterAnalysisDashboard;