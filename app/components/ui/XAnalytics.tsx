import React, { useEffect, useState, memo } from "react";
import {
  MessageCircle,
  TrendingUp,
  BarChart2,
  ThumbsUp,
  Award,
  Hash,
  Clock
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { useTwitterAnalysis } from "@/app/api/xAnalytics";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Types
interface TwitterDashboardProps {
  query: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
}

// Helper Components
const MetricCard = memo(({ title, value, icon, change }: MetricCardProps) => (
  <Card className="bg-white/10 backdrop-blur-lg">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
        </div>
        <div className="text-primary">{icon}</div>
      </div>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </p>
      )}
    </CardContent>
  </Card>
));

const SentimentCard = memo(({ sentiment }: { sentiment: any }) => (
  <Card className="bg-white/10 backdrop-blur-lg">
    <CardHeader>
      <CardTitle>Overall Sentiment</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span>Sentiment Score</span>
            <span>{(sentiment.score * 100).toFixed(1)}%</span>
          </div>
          <Progress 
            value={(sentiment.score + 1) * 50} 
            className="h-2"
          />
        </div>
        <div>
          <p className="font-medium">Label: {sentiment.label}</p>
          <p className="text-sm">Confidence: {(sentiment.confidence * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="font-medium">Key Phrases:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {sentiment.keyPhrases.map((phrase: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-primary/20 rounded-full text-xs">
                {phrase}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

const TrendCard = memo(({ trend }: { trend: any }) => (
  <Card className="bg-white/10 backdrop-blur-lg">
    <CardHeader>
      <CardTitle>{trend.trend}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span>Sentiment</span>
            <span>{(trend.sentiment * 100).toFixed(1)}%</span>
          </div>
          <Progress 
            value={(trend.sentiment + 1) * 50} 
            className="h-2"
          />
        </div>
        <div>
          <p className="text-sm">Frequency: {trend.frequency} mentions</p>
          <p className="text-sm">Peak: {trend.peakEngagementTime}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {trend.relatedHashtags.map((tag: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-primary/20 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
));

const FactCard = memo(({ fact }: { fact: any }) => (
  <Card className="bg-white/10 backdrop-blur-lg">
    <CardHeader>
      <CardTitle>Fact Check</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <p>{fact.claim}</p>
        <div>
          <div className="flex justify-between mb-1">
            <span>Reliability</span>
            <span>{(fact.reliability * 100).toFixed(1)}%</span>
          </div>
          <Progress value={fact.reliability * 100} className="h-2" />
        </div>
        <div className="text-sm space-y-1">
          <p>Sources: {fact.sourceCount}</p>
          <p>Mentions: {fact.frequency}</p>
        </div>
      </div>
    </CardContent>
  </Card>
));

// Main Component
const TwitterAnalysisDashboard: React.FC<TwitterDashboardProps> = ({ query }) => {
  const { analysisData, analyze, isLoading, error } = useTwitterAnalysis();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || hasSearched) return;
      await analyze(query);
      setHasSearched(true);
    };

    fetchData();
  }, [query, analyze, hasSearched]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !analysisData?.success) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || analysisData?.error || "Failed to fetch Twitter data"}
      </div>
    );
  }

  if (!analysisData?.data?.analysis) {
    return (
      <div className="text-center p-4">
        No analysis data available
      </div>
    );
  }

  const { analysis, tweets } = analysisData.data;
  const { engagementMetrics } = analysis;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Twitter Analysis Dashboard</h1>
        <p className="text-lg opacity-70">Analysis for: {query}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Average Retweets"
          value={engagementMetrics.averageRetweets.toFixed(1)}
          icon={<MessageCircle className="w-6 h-6" />}
        />
        <MetricCard
          title="Average Likes"
          value={engagementMetrics.averageLikes.toFixed(1)}
          icon={<ThumbsUp className="w-6 h-6" />}
        />
        <MetricCard
          title="Average Replies"
          value={engagementMetrics.averageReplies.toFixed(1)}
          icon={<MessageCircle className="w-6 h-6" />}
        />
        <MetricCard
          title="Total Views"
          value={engagementMetrics.totalViews.toLocaleString()}
          icon={<BarChart2 className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SentimentCard sentiment={analysis.overallSentiment} />
        <Card className="bg-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Engagement Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tweets}>
                  <XAxis dataKey="created_at" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="retweets" stroke="#8884d8" />
                  <Line type="monotone" dataKey="favorites" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Trending Topics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysis.trends.map((trend: any, index: number) => (
            <TrendCard key={index} trend={trend} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Key Facts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysis.facts.map((fact: any, index: number) => (
            <FactCard key={index} fact={fact} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Hash className="w-6 h-6" />
          Top Hashtags
        </h2>
        <div className="flex flex-wrap gap-4">
          {analysis.topHashtags.map((hashtag: string, index: number) => (
            <span key={index} className="px-4 py-2 bg-primary/20 rounded-full">
              #{hashtag}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default memo(TwitterAnalysisDashboard);