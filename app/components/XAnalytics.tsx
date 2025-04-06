"use client";

import React, { useEffect, useState, memo } from "react";
import { 
  BarChart, MessageCircle, 
  Lightbulb, TrendingUp, 
  Calendar, Target,
  AlertTriangle
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { useTwitterAnalysis } from "@/app/api/xAnalytics";

const validateArray = <T,>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : [];
};

// Skeleton components
const CardSkeleton = () => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-7 bg-white/20 rounded w-1/3"></div>
      <div className="h-4 bg-white/20 rounded w-16"></div>
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-white/20 rounded w-full"></div>
      <div className="h-4 bg-white/20 rounded w-5/6"></div>
      <div className="h-4 bg-white/20 rounded w-4/6"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-2 bg-white/20 rounded w-full"></div>
      <div className="h-4 bg-white/20 rounded w-1/4"></div>
    </div>
  </div>
);

interface SkeletonSectionProps {
  title: string;
  count?: number;
}

const SkeletonSection = ({ title, count = 3 }: SkeletonSectionProps) => (
  <section className="mt-8">
    <div className="flex items-center gap-2 h-8 bg-white/20 rounded w-48 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  </section>
);

// Base card component
interface AnalysisCardProps {
  title: string;
  description: string | React.ReactNode;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  timing?: string;
  icon?: React.ReactNode;
}

const AnalysisCard = memo(({ title, description, items, score, scoreLabel, timing, icon }: AnalysisCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg h-full">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h3>
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
        <Progress value={score * 10} className="h-2" />
        <span className="text-sm">
          {scoreLabel}: {score}/10
        </span>
      </div>
    )}
  </div>
));

AnalysisCard.displayName = 'AnalysisCard';

interface SentimentData {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface OverviewCardProps {
  overview: string;
  sentiment: SentimentData;
}

// Overview & Sentiment Analysis Card
const OverviewCard = memo(({ overview, sentiment }: OverviewCardProps) => {
  // Determine color based on sentiment
  const getSentimentColor = () => {
    if (sentiment.label === 'positive') return 'text-green-400';
    if (sentiment.label === 'negative') return 'text-red-400';
    return 'text-blue-400';
  };

  // Convert -1 to 1 score to percentage
  const sentimentPercentage = Math.round(((sentiment.score + 1) / 2) * 100);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Overview & Sentiment
        </h3>
      </div>
      
      <div className="space-y-4">
        <p>{overview}</p>
        
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <p className={`text-lg font-medium ${getSentimentColor()}`}>
              {sentiment.label.toUpperCase()} SENTIMENT
            </p>
            <span className="text-sm">
              Confidence: {(sentiment.confidence * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="mt-4 space-y-2">
            <Progress value={sentimentPercentage} className="h-2" />
            <span className="text-sm">
              Sentiment Score: {sentiment.score.toFixed(2)} ({sentimentPercentage}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

OverviewCard.displayName = 'OverviewCard';

interface TriggerData {
  name: string;
  description: string;
  impact_score: number;
  frequency: number;
  examples: string[];
}

interface TriggerCardProps {
  trigger: TriggerData;
}

// Trigger Card
const TriggerCard = memo(({ trigger }: TriggerCardProps) => (
  <AnalysisCard
    icon={<AlertTriangle className="w-4 h-4" />}
    title={trigger.name}
    description={trigger.description}
    items={[
      `<strong>Frequency:</strong> ${trigger.frequency} occurrences`,
      ...(trigger.examples && trigger.examples.length > 0 ? 
        [`<strong>Example:</strong> "${trigger.examples[0]}"`] : [])
    ]}
    score={trigger.impact_score}
    scoreLabel="Impact"
  />
));

TriggerCard.displayName = 'TriggerCard';

interface TrendData {
  name: string;
  description: string;
  popularity_score: number;
  growth_rate: number;
  examples: string[];
}

interface TrendCardProps {
  trend: TrendData;
}

// Current Trend Card
const TrendCard = memo(({ trend }: TrendCardProps) => (
  <AnalysisCard
    icon={<TrendingUp className="w-4 h-4" />}
    title={trend.name}
    description={trend.description}
    items={[
      `<strong>Growth Rate:</strong> ${trend.growth_rate}%`,
      ...(trend.examples && trend.examples.length > 0 ? 
        [`<strong>Example:</strong> "${trend.examples[0]}"`] : [])
    ]}
    score={trend.popularity_score}
    scoreLabel="Popularity"
  />
));

TrendCard.displayName = 'TrendCard';

interface UpcomingTrendData {
  name: string;
  description: string;
  prediction_confidence: number;
  potential_impact: number;
  early_indicators: string[];
}

interface UpcomingTrendCardProps {
  trend: UpcomingTrendData;
}

// Upcoming Trend Card
const UpcomingTrendCard = memo(({ trend }: UpcomingTrendCardProps) => (
  <AnalysisCard
    icon={<Lightbulb className="w-4 h-4" />}
    title={trend.name}
    description={trend.description}
    items={[
      "<strong>Early Indicators:</strong>",
      ...(trend.early_indicators && trend.early_indicators.length > 0 ? 
        trend.early_indicators.map(indicator => `• ${indicator}`) : []),
      `<strong>Potential Impact:</strong> ${trend.potential_impact}/10`
    ]}
    score={trend.prediction_confidence}
    scoreLabel="Confidence"
  />
));

UpcomingTrendCard.displayName = 'UpcomingTrendCard';

interface TweetData {
  content: string;
  engagement: number;
  created_at: string;
  author: string;
  hashtags: string[];
  media_url?: string;
}

interface TweetCardProps {
  tweet: TweetData;
}

// Tweet Card
const TweetCard = memo(({ tweet }: TweetCardProps) => {
  const date = new Date(tweet.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // Check for t.co links in content that might be images
  const hasImageLink = tweet.content.includes('t.co/') || tweet.media_url;
  const imageUrl = tweet.media_url || (hasImageLink ? '/api/placeholder/300/200' : undefined);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium">@{tweet.author}</span>
      </div>
      <div className="text-lg mb-3">{tweet.content}</div>
      
      {imageUrl && (
        <div className="mb-3">
          <img src={imageUrl} alt="Tweet media" className="rounded-lg w-full h-auto max-h-40 object-cover" />
        </div>
      )}
      
      {tweet.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tweet.hashtags.map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-blue-500/40 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex justify-between text-sm mt-4 pt-2 border-t border-white/20">
        <span>Engagement: {tweet.engagement}</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
});

TweetCard.displayName = 'TweetCard';

interface HashtagData {
  tag: string;
  count: number;
  relevance: number;
}

interface HashtagCardProps {
  hashtags: HashtagData[];
}

// Hashtag Card
const HashtagCard = memo(({ hashtags }: HashtagCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg h-full">
    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
      <Target className="w-5 h-5" />
      Top Hashtags
    </h3>
    <div className="space-y-3">
      {hashtags.map((hashtag, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-blue-400">{hashtag.tag}</span>
          <div className="flex items-center gap-4">
            <span className="text-sm">Count: {hashtag.count}</span>
            <div className="w-24">
              <Progress value={hashtag.relevance * 10} className="h-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

HashtagCard.displayName = 'HashtagCard';

interface DataSummaryCardProps {
  tweets: TweetData[];
}

// Data Summary Card
const DataSummaryCard = memo(({ tweets }: DataSummaryCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg h-full">
    <h3 className="text-xl font-semibold mb-4">Data Summary</h3>
    <ul className="space-y-2">
      <li className="flex justify-between">
        <span>Total tweets analyzed:</span>
        <span className="font-medium">{tweets.length}</span>
      </li>
      <li className="flex justify-between">
        <span>Average engagement:</span>
        <span className="font-medium">
          {Math.round(tweets.reduce((sum, tweet) => sum + tweet.engagement, 0) / tweets.length)}
        </span>
      </li>
      <li className="flex justify-between">
        <span>Total hashtags:</span>
        <span className="font-medium">
          {tweets.reduce((sum, tweet) => sum + tweet.hashtags.length, 0)}
        </span>
      </li>
      <li className="flex justify-between">
        <span>Analysis timestamp:</span>
        <span className="font-medium">
          {new Date().toLocaleString()}
        </span>
      </li>
      <li className="flex justify-between">
        <span>Unique authors:</span>
        <span className="font-medium">
          {new Set(tweets.map(tweet => tweet.author)).size}
        </span>
      </li>
    </ul>
  </div>
));

DataSummaryCard.displayName = 'DataSummaryCard';

interface InsightsData {
  comparisons: string[];
  actionableInsights: string[];
  demographicPatterns: string[];
}

interface InsightsCardProps {
  insights: InsightsData;
}

// Insights Card
const InsightsCard = memo(({ insights }: InsightsCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg col-span-1 md:col-span-3">
    <h3 className="text-xl font-semibold mb-4">Trend Insights</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h4 className="font-medium mb-2">Industry Comparisons</h4>
        <ul className="space-y-2">
          {insights.comparisons.map((item, idx) => (
            <li key={idx} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-medium mb-2">Actionable Insights</h4>
        <ul className="space-y-2">
          {insights.actionableInsights.map((item, idx) => (
            <li key={idx} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-medium mb-2">Demographic Patterns</h4>
        <ul className="space-y-2">
          {insights.demographicPatterns.map((item, idx) => (
            <li key={idx} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
));

InsightsCard.displayName = 'InsightsCard';

interface TwitterAnalysisDashboardProps {
  query: string;
  options?: {
    industry?: string;
    timeframe?: string;
  };
}

// Main Twitter Analysis Dashboard Component
const TwitterAnalysisDashboard = memo(({ 
  query,
  options
}: TwitterAnalysisDashboardProps) => {
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

  const renderSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="h-10 bg-white/20 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-white/20 rounded w-1/3"></div>
      </header>

      <div className="space-y-8">
        {/* Overview & Sentiment Skeleton */}
        <section>
          <div className="grid grid-cols-1 gap-6">
            <CardSkeleton />
          </div>
        </section>

        {/* Triggers Skeleton */}
        <SkeletonSection title="Key Engagement Triggers" />

        {/* Current Trends Skeleton */}
        <SkeletonSection title="Current Trends" />

        {/* Upcoming Trends Skeleton */}
        <SkeletonSection title="Upcoming Trends" />

        {/* Hashtags & Data Summary Skeleton */}
        <section className="mt-8">
          <div className="h-8 bg-white/20 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </section>

        {/* Top Tweets Skeleton */}
        <SkeletonSection title="Top Tweets" />
      </div>
    </div>
  );

  if (isLoading) {
    return renderSkeleton();
  }

  if (error || !data?.analysis) {
    return (
      <div className="text-center text-red-500 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
        <h3 className="text-xl font-bold mb-2">Analysis Error</h3>
        <p>{error || "Failed to fetch Twitter analysis data"}</p>
      </div>
    );
  }

  const { analysis, tweets, timestamp } = data;
  const topTweets = tweets.slice(0, 3); // Get top 3 tweets by engagement

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Twitter Analysis Dashboard</h1>
        <p className="text-lg opacity-70">
          Analysis for: <span className="font-medium">{query}</span>
          {options?.industry && ` in ${options.industry} industry`}
          {options?.timeframe && ` over ${options.timeframe}`}
        </p>
      </header>

      <div className="space-y-8">
        {/* Overview & Sentiment */}
        <section>
          <div className="grid grid-cols-1 gap-6">
            <OverviewCard 
              overview={analysis.overview} 
              sentiment={analysis.sentimentAnalysis} 
            />
          </div>
        </section>

        {/* Triggers */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <AlertTriangle className="w-6 h-6" />
            Key Engagement Triggers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {validateArray(analysis.triggers).map((trigger, index) => (
              <TriggerCard key={index} trigger={trigger} />
            ))}
          </div>
        </section>

        {/* Current Trends */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <TrendingUp className="w-6 h-6" />
            Current Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {validateArray(analysis.currentTrends).map((trend, index) => (
              <TrendCard key={index} trend={trend} />
            ))}
          </div>
        </section>

        {/* Upcoming Trends */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <Lightbulb className="w-6 h-6" />
            Upcoming Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {validateArray(analysis.upcomingTrends).map((trend, index) => (
              <UpcomingTrendCard key={index} trend={trend} />
            ))}
          </div>
        </section>

        {/* Insights */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <MessageCircle className="w-6 h-6" />
            Trend Insights
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <InsightsCard insights={analysis.trendInsights} />
          </div>
        </section>

        {/* Hashtags & Data Summary */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <Target className="w-6 h-6" />
            Analysis Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HashtagCard hashtags={analysis.relevantHashtags} />
            <DataSummaryCard tweets={tweets} />
          </div>
        </section>

        {/* Top Tweets */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <MessageCircle className="w-6 h-6" />
            Top Tweets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topTweets.map((tweet, index) => (
              <TweetCard key={index} tweet={tweet} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
});

TwitterAnalysisDashboard.displayName = 'TwitterAnalysisDashboard';

export default TwitterAnalysisDashboard;