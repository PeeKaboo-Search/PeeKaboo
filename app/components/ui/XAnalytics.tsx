import React, { useEffect, useState, memo } from "react";
import {
  MessageCircle,
  TrendingUp,
  Heart,
  Zap
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { useTwitterAnalysis } from "@/app/api/xAnalytics";

// Types
interface TwitterDashboardProps {
  query: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

// Helper Components
const MetricCard = memo(({ title, value, icon, description }: MetricCardProps) => (
  <Card className="bg-white/10 backdrop-blur-lg">
    <CardContent className="p-6 flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="text-primary">{icon}</div>
    </CardContent>
  </Card>
));

const TwitterAnalysisDashboard: React.FC<TwitterDashboardProps> = ({ query }) => {
  const { data, analyze, isLoading, error } = useTwitterAnalysis();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || "Failed to fetch Twitter data"}
      </div>
    );
  }

  const { analysis } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Twitter Analysis Dashboard</h1>
        <p className="text-lg text-muted-foreground">Analysis for: {query}</p>
        <p className="text-muted-foreground">{analysis.overview}</p>
      </header>

      {/* Sentiment Analysis */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Sentiment Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Sentiment Score"
            value={`${(analysis.sentimentAnalysis.score * 100).toFixed(1)}%`}
            icon={<Heart className="w-6 h-6" />}
            description={`Confidence: ${(analysis.sentimentAnalysis.confidence * 100).toFixed(1)}%`}
          />
          <Card className="bg-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <h3 className="font-medium mb-2">Overall Sentiment</h3>
              <div className="text-2xl font-bold capitalize">
                {analysis.sentimentAnalysis.label}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content Patterns */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Content Patterns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.contentPatterns.map((pattern, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">{pattern.pattern}</h3>
                <p className="text-sm text-muted-foreground mb-4">{pattern.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Frequency</span>
                    <span>{pattern.frequency}/10</span>
                  </div>
                  <Progress value={pattern.frequency * 10} className="h-2" />
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Examples:</h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground">
                    {pattern.examples.map((example, i) => (
                      <li key={i}>{example}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Tweets */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Top Performing Tweets
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {analysis.engagement.topTweets.map((tweet, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">Engagement Score: {tweet.engagement}</p>
                </div>
                <p className="text-muted-foreground mb-2">{tweet.content}</p>
                <p className="text-sm text-primary">{tweet.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Market Insights */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Market Insights</h2>
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">User Sentiment</h3>
              <p className="text-muted-foreground">{analysis.marketInsights.userSentiment}</p>
            </CardContent>
          </Card>
          <Card className="col-span-full bg-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Actionable Insights</h3>
              <ul className="space-y-2">
                {analysis.marketInsights.actionableInsights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default memo(TwitterAnalysisDashboard);