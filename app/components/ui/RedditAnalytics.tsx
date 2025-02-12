"use client";
import React, { useEffect, useState, Suspense, lazy } from "react";
import { fetchMarketingInsights } from "@/app/api/redditAnalysis";
import { TrendingUp, Award, Lightbulb, Activity, Brain, Heart, Target } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import  Separator  from "@/app/components/ui/separator";
import "@/app/styles/reddit-analysis.css";

interface RedditAnalyticsProps {
  query: string;
}

const DescriptionCard = ({ title, description, metrics }: { 
  title: string;
  description: string;
  metrics?: { label: string; value: string | number }[];
}) => (
  <Card className="analytics-card">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
    {metrics && (
      <CardContent>
        <Separator className="my-4" />
        <dl className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex justify-between items-center">
              <dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="text-sm font-medium">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    )}
  </Card>
);

// Lazy loaded content wrapper
const AnalyticsContent = lazy(() => Promise.resolve({
  default: ({
    insights,
    results
  }: {
    insights: MarketingInsight;
    results: RedditResult[];
  }) => {
    const renderPainPointsSection = () => (
      <section className="analytics-section pain-points">
        <h2 className="flex items-center gap-2 mb-6">
          <Target className="h-6 w-6" />
          <span>Recurring Pain Points</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.recurring_pain_points.map((point, index) => (
            <Card key={index} className="analytics-card">
              <CardHeader>
                <CardTitle>{point.issue}</CardTitle>
                <CardDescription>
                  Impact Score: {point.impact_score}/100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Frequency</span>
                    <span>{point.frequency}%</span>
                  </div>
                  <Progress value={point.frequency} />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Quotes</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {point.verbatim_quotes.map((quote, i) => (
                      <li key={i}>{quote}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Solutions</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {point.suggested_solutions.map((solution, i) => (
                      <li key={i}>{solution}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );

    const renderNicheCommunitiesSection = () => (
      <section className="analytics-section communities">
        <h2 className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6" />
          <span>Niche Communities</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.niche_communities.map((community, index) => (
            <Card key={index} className="analytics-card">
              <CardHeader>
                <CardTitle>{community.segment}</CardTitle>
                <CardDescription>
                  Engagement Level: {community.engagement_level}/100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Influence</span>
                    <span>{community.influence_score}%</span>
                  </div>
                  <Progress value={community.influence_score} />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Demographics</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {community.demographic_indicators.map((indicator, i) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Discussion Themes</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {community.discussion_themes.map((theme, i) => (
                      <li key={i}>{theme}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );

    const renderSourceDataSection = () => (
      <section className="analytics-section source-data">
        <h2 className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6" />
          <span>Reddit Discussions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, index) => (
            <Card key={index} className="analytics-card">
              <CardHeader>
                <CardTitle className="text-base">{result.title}</CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>r/{result.subreddit}</span>
                  {result.engagement_metrics && (
                    <span className="text-xs">
                      ↑ {(result.engagement_metrics.upvote_ratio * 100).toFixed()}%
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {result.snippet}
                  </div>
                  
                  {result.engagement_metrics && (
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Comments</dt>
                        <dd className="font-medium">
                          {result.engagement_metrics.comment_count}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Awards</dt>
                        <dd className="font-medium">
                          {result.engagement_metrics.awards}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );

    return (
      <div className="space-y-8">
        <Card className="analytics-overview">
          <CardHeader>
          <h2 className="flex items-center gap-2 mb-6">
          <Target className="h-6 w-6" />
            <span>Market Analysis Overview</span>
            </h2>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: insights.overview }} 
            />
          </CardContent>
        </Card>
        {renderPainPointsSection()}
        {renderNicheCommunitiesSection()}
        {renderSourceDataSection()}
      </div>
    );
  }
}));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <div className="analytics-loader">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="analytics-loader__item" />
      ))}
    </div>
  </div>
);

const RedditAnalytics: React.FC<RedditAnalyticsProps> = ({ query }) => {
  const [data, setData] = useState<{ results: RedditResult[]; insights: MarketingInsight } | null>(null);
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
        const response = await fetchMarketingInsights(query);
        if (response) {
          setData(response);
          setError(null);
        } else {
          setError("No insights found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Reddit Marketing Insights</h1>
        <p className="text-xl text-muted-foreground">Analysis for: {query}</p>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <Suspense fallback={<LoadingSpinner />}>
          <AnalyticsContent insights={data.insights} results={data.results} />
        </Suspense>
      ) : null}
    </div>
  );
};

export default RedditAnalytics;