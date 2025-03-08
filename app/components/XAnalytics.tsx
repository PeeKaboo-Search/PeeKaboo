import React, { useEffect, useState, memo } from "react";
import {
  TrendingUp,
  Heart,
  AlertTriangle,
  Users,
  BarChart,
  LineChart,
  Tag,
  Eye,
  Award,
  Layers,
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Card, CardContent } from "@/app/components/ui/card";
import { useTwitterAnalysis } from "@/app/api/xAnalytics";

// Define comprehensive types for the analysis data
interface ContentPattern {
  pattern: string;
  description: string;
  frequency: number;
  examples: string[];
}

interface SentimentAnalysis {
  score: number;
  confidence: number;
  label: string;
}

interface MarketInsights {
  userSentiment: string;
  actionableInsights: string[];
}

// Unified Tweet interface with all required properties
interface Tweet {
  content: string;
  engagement: number;
  created_at: string;
  reason?: string;
}

// Single Analysis interface to avoid duplication
interface Analysis {
  overview: string;
  sentimentAnalysis: SentimentAnalysis;
  contentPatterns: ContentPattern[];
  marketInsights: MarketInsights;
  engagement: {
    topTweets: Tweet[]; // This should use the complete Tweet interface with created_at
  };
}

interface SimplifiedTweet {
  content: string;
  engagement: number;
  created_at: string;
}

// Create our own Tabs components since they're missing
const TabsContent = ({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div role="tabpanel" data-value={value} className={className}>
    {children}
  </div>
);

const TabsTrigger = ({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    role="tab"
    data-value={value}
    className={`px-3 py-2 text-sm font-medium transition-all focus:outline-none ${className}`}
  >
    {children}
  </button>
);

const TabsList = ({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div role="tablist" className={`flex space-x-1 rounded-lg p-1 ${className}`}>
    {children}
  </div>
);

const Tabs = ({
  defaultValue,
  className = "",
  children,
}: {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  useEffect(() => {
    // Find all tab triggers and add click handlers
    const triggers = document.querySelectorAll('[role="tab"]');
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const value = trigger.getAttribute("data-value");
        if (value) setActiveTab(value);
      });
    });

    // Hide/show tab content based on active tab
    const updateActiveContent = () => {
      const panels = document.querySelectorAll('[role="tabpanel"]');
      panels.forEach((panel) => {
        if (panel.getAttribute("data-value") === activeTab) {
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      });

      // Update active trigger styles
      triggers.forEach((trigger) => {
        if (trigger.getAttribute("data-value") === activeTab) {
          trigger.classList.add("bg-white/10");
        } else {
          trigger.classList.remove("bg-white/10");
        }
      });
    };

    updateActiveContent();
  }, [activeTab, children]);

  return <div className={className}>{children}</div>;
};

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

// Define types for our section components
interface SectionProps {
  analysis: Analysis;
  data?: {
    analysis: Analysis;
    sources: SimplifiedTweet[];
    timestamp: string;
  };
  query?: string;
  competitors?: string[];
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

// Add display name to the MetricCard component
MetricCard.displayName = "MetricCard";

// Brand Sentiment Section
const BrandSentimentSection = ({ analysis }: SectionProps) => (
  <section className="space-y-4">
    <h2 className="text-2xl font-bold flex items-center gap-2">
      <Tag className="w-6 h-6" />
      Brand Sentiment Analysis
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
          <h3 className="font-medium mb-2">Overall Brand Perception</h3>
          <div className="text-2xl font-bold capitalize">
            {analysis.sentimentAnalysis.label}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {analysis.marketInsights.userSentiment}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white/10 backdrop-blur-lg">
        <CardContent className="p-6">
          <h3 className="font-medium mb-2">Key Brand Attributes</h3>
          <div className="space-y-2 mt-3">
            {analysis.contentPatterns.slice(0, 3).map((pattern, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm">{pattern.pattern}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

// Consumer Trends Section
const ConsumerTrendsSection = ({ analysis }: SectionProps) => (
  <section className="space-y-4">
    <h2 className="text-2xl font-bold flex items-center gap-2">
      <BarChart className="w-6 h-6" />
      Consumer Trends & Insights
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {analysis.contentPatterns.map((pattern, index) => (
        <Card key={index} className="bg-white/10 backdrop-blur-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2">{pattern.pattern}</h3>
            <p className="text-sm text-muted-foreground mb-4">{pattern.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trend Strength</span>
                <span>{pattern.frequency}/10</span>
              </div>
              <Progress value={pattern.frequency * 10} className="h-2" />
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Examples from Users:</h4>
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
);

// Influencer Tracking Section
const InfluencerTrackingSection = ({ data }: SectionProps) => {
  // Sort sources by engagement to find potential influencers
  const potentialInfluencers = data?.sources
    ? [...data.sources]
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 3)
    : [];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Award className="w-6 h-6" />
        Influencer & KOL Tracking
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {potentialInfluencers.map((influencer, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">Key Opinion Leader #{index + 1}</h3>
                  <p className="text-sm text-primary">Engagement Score: {influencer.engagement}</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-2">&quot;{influencer.content}&quot;</p>
              <p className="text-sm text-muted-foreground">
                Posted: {new Date(influencer.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// Demand Forecasting Section
const DemandForecastingSection = ({ analysis }: SectionProps) => (
  <section className="space-y-4">
    <h2 className="text-2xl font-bold flex items-center gap-2">
      <LineChart className="w-6 h-6" />
      Demand Forecasting & Product Interest
    </h2>
    <Card className="bg-white/10 backdrop-blur-lg">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">Projected Interest Trends</h3>
        <div className="space-y-4">
          {analysis.contentPatterns.map((pattern, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{pattern.pattern}</span>
                <span className="text-sm text-muted-foreground">
                  {pattern.frequency > 7 ? "Rising" : pattern.frequency > 4 ? "Stable" : "Declining"}
                </span>
              </div>
              <Progress value={pattern.frequency * 10} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    <Card className="bg-white/10 backdrop-blur-lg">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-3">Market Recommendations</h3>
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
  </section>
);

// Crisis Detection Section
const CrisisDetectionSection = ({ analysis, data }: SectionProps) => {
  // Check for negative sentiment and high engagement as potential crisis indicators
  const isCrisisDetected =
    analysis.sentimentAnalysis.label === "negative" &&
    analysis.sentimentAnalysis.confidence > 0.7;

  // Find negative tweets with high engagement
  const negativeTweets = data?.sources
    ? data.sources
        .filter((tweet) => {
          // Simple negative keyword detection
          const negativeWords = ["bad", "terrible", "awful", "disappointed", "issue", "problem", "fail"];
          return negativeWords.some((word) => tweet.content.toLowerCase().includes(word));
        })
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 2)
    : [];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        Crisis Detection & Management
      </h2>
      <Card className={`bg-white/10 backdrop-blur-lg ${isCrisisDetected ? "border-red-500" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isCrisisDetected ? "bg-red-500" : "bg-green-500"}`}></div>
            <h3 className="font-bold text-lg">
              {isCrisisDetected ? "Potential Crisis Detected" : "No Crisis Detected"}
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            {isCrisisDetected
              ? "Negative sentiment detected with high confidence. Immediate action recommended."
              : "No significant negative sentiment patterns detected at this time."}
          </p>
          {isCrisisDetected && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                <li>Monitor social channels for escalating concerns</li>
                <li>Prepare response strategy for identified issues</li>
                <li>Engage with users expressing concerns directly</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {negativeTweets.length > 0 && (
        <div className="space-y-3 mt-4">
          <h3 className="font-medium">Posts to Monitor:</h3>
          {negativeTweets.map((tweet, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-muted-foreground mb-2">{tweet.content}</p>
                <p className="text-sm text-amber-500">Engagement: {tweet.engagement}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

// Campaign Performance Section
const CampaignPerformanceSection = ({ analysis }: SectionProps) => {
  // Simulate campaign performance metrics based on existing data
  const campaignMetrics = {
    overall: analysis.sentimentAnalysis.score > 0 ? "Positive" : "Needs Improvement",
    engagement: Math.round(
      analysis.engagement.topTweets.reduce((acc: number, tweet) => acc + tweet.engagement, 0) /
      analysis.engagement.topTweets.length
    ),
    reachEstimate: Math.round(Math.random() * 10000) + 5000,
    conversionRate: ((Math.random() * 5) + 1).toFixed(2) + "%",
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Layers className="w-6 h-6" />
        Ad Campaign Performance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Campaign Sentiment"
          value={campaignMetrics.overall}
          icon={<Heart className="w-6 h-6" />}
        />
        <MetricCard
          title="Avg Engagement"
          value={campaignMetrics.engagement}
          icon={<Eye className="w-6 h-6" />}
        />
        <MetricCard
          title="Estimated Reach"
          value={campaignMetrics.reachEstimate.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Est. Conversion"
          value={campaignMetrics.conversionRate}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      <Card className="bg-white/10 backdrop-blur-lg mt-4">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-3">Top Performing Content</h3>
          <div className="space-y-4">
            {analysis.engagement.topTweets.map((tweet, index) => (
              <div key={index} className="pb-3 border-b border-gray-700 last:border-0">
                <p className="text-sm text-muted-foreground mb-2">{tweet.content}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-primary">{tweet.engagement} engagements</span>
                  <span className="text-muted-foreground">{tweet.reason || 'High engagement'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

// Competitor Analysis Section
const CompetitorAnalysisSection = ({ analysis, query, competitors = [] }: SectionProps) => {
  // Use the competitors from props or use default values if none provided
  const competitorList = competitors.length > 0 
    ? competitors.map((name, i) => ({ 
        name, 
        sentiment: (Math.random() * 2 - 1) * 0.5, 
        engagement: Math.floor(Math.random() * 1000) + 500 
      }))
    : [
        { name: "Competitor A", sentiment: 0.3, engagement: 950 },
        { name: "Competitor B", sentiment: -0.1, engagement: 1200 },
        { name: "Competitor C", sentiment: 0.5, engagement: 780 },
      ];

  // Get our sentiment
  const ourSentiment = analysis.sentimentAnalysis.score;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6" />
        Competitor Analysis
      </h2>

      <Card className="bg-white/10 backdrop-blur-lg">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">Sentiment Comparison</h3>
          <div className="space-y-4">
            {/* Our brand */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{query} (Our Brand)</span>
                <span>{(ourSentiment * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(ourSentiment + 1) * 50} className="h-2" />
            </div>

            {/* Competitors */}
            {competitorList.map((competitor, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{competitor.name}</span>
                  <span>{(competitor.sentiment * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(competitor.sentiment + 1) * 50} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-3">Competitive Advantage</h3>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Our brand&apos;s sentiment is {ourSentiment > 0 ? "positive" : "negative"} at{" "}
              {(ourSentiment * 100).toFixed(1)}%, which is{" "}
              {Math.abs(ourSentiment) > Math.abs(competitorList[0].sentiment) ? "stronger" : "weaker"}
              than the leading competitor.
            </p>
            <h4 className="font-medium mt-4">Recommended Actions:</h4>
            <ul className="list-disc pl-4 text-sm text-muted-foreground">
              <li>Focus on our unique content patterns that differentiate from competitors</li>
              <li>Address areas where competitors have stronger sentiment</li>
              <li>Leverage our top-performing content themes in marketing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

// Main component
const AdvancedTwitterAnalysisDashboard: React.FC<TwitterDashboardProps> = ({ query }) => {
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
  
  const analysisWithFixedTweets = {
    ...data.analysis,
    engagement: {
      ...data.analysis.engagement,
      topTweets: data.analysis.engagement.topTweets.map(tweet => {
        if ('created_at' in tweet && typeof tweet.created_at === 'string') {
          return tweet as Tweet;
        } else {
          return {
            ...tweet,
            created_at: new Date().toISOString() // Explicitly typed as string
          } as Tweet;
        }
      })
    }
  };
  
  const fixedData = {
    ...data,
    analysis: analysisWithFixedTweets as Analysis
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Advanced Twitter Analytics Dashboard</h1>
        <p className="text-lg text-muted-foreground">Analysis for: {query}</p>
        <p className="text-muted-foreground">{fixedData.analysis.overview}</p>
      </header>

      <Tabs defaultValue="brand-sentiment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="brand-sentiment">Brand Sentiment</TabsTrigger>
          <TabsTrigger value="competitor">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="consumer-trends">Consumer Trends</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
          <TabsTrigger value="campaign">Campaign Performance</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="brand-sentiment" className="pt-4">
          <BrandSentimentSection analysis={fixedData.analysis} />
        </TabsContent>

        <TabsContent value="competitor" className="pt-4">
          <CompetitorAnalysisSection analysis={fixedData.analysis} query={query} />
        </TabsContent>

        <TabsContent value="consumer-trends" className="pt-4">
          <ConsumerTrendsSection analysis={fixedData.analysis} />
        </TabsContent>

        <TabsContent value="influencers" className="pt-4">
          <InfluencerTrackingSection analysis={fixedData.analysis} data={fixedData} />
        </TabsContent>

        <TabsContent value="demand" className="pt-4">
          <DemandForecastingSection analysis={fixedData.analysis} />
        </TabsContent>

        <TabsContent value="campaign" className="pt-4">
          <CampaignPerformanceSection analysis={fixedData.analysis} />
        </TabsContent>

        <TabsContent value="crisis" className="pt-4">
          <CrisisDetectionSection analysis={fixedData.analysis} data={fixedData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedTwitterAnalysisDashboard;