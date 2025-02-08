"use client";

import React, { Suspense, lazy } from "react";
import { TrendingUp, Building, Lightbulb, Activity, DollarSign, Calendar } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { 
  FacebookAd, 
  AdPerformanceMetric, 
  CompetitorAnalysis, 
  AdAnalysisSummary,
  useFacebookMetaStore 
} from "@/app/api/facebookAds";

interface FacebookMetaAnalyticsProps {
  query: string;
}

const AnalyticsContent = lazy(() => Promise.resolve({
  default: ({
    analysis,
    rawData
  }: {
    analysis: AdAnalysisSummary;
    rawData: FacebookAd[];
  }) => {
    const renderPerformanceSection = () => (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Ad Performance Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.adPerformance.map((metric: AdPerformanceMetric, index: number) => (
            <div key={index} className="p-4 rounded-lg bg-white/10 backdrop-blur">
              <div>
                <h3 className="text-lg font-medium mb-2" 
                    dangerouslySetInnerHTML={{ __html: metric.metric }} />
                <p className="text-sm text-gray-300 mb-4" 
                   dangerouslySetInnerHTML={{ __html: metric.description }} />
              </div>
              <div className="space-y-2">
                <Progress value={metric.score} className="h-2" />
                <span className="text-sm font-medium">{metric.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

    const renderCompetitorsSection = () => (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Competitor Analysis</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.competitors.map((competitor: CompetitorAnalysis, index: number) => (
            <div key={index} className="p-4 rounded-lg bg-white/10 backdrop-blur">
              <div>
                <h3 className="text-lg font-medium mb-2" 
                    dangerouslySetInnerHTML={{ __html: competitor.name }} />
                <p className="text-sm text-gray-300 mb-4" 
                   dangerouslySetInnerHTML={{ __html: competitor.analysis }} />
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    ${competitor.estimatedSpend.min.toLocaleString()} - 
                    ${competitor.estimatedSpend.max.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Progress 
                  value={(competitor.adCount / Math.max(...analysis.competitors.map(c => c.adCount))) * 100} 
                  className="h-2"
                />
                <span className="text-sm font-medium">{competitor.adCount} ads</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

    const renderRecommendationsSection = () => (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Campaign Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.recommendations.map((recommendation: string, index: number) => (
            <div key={index} className="p-4 rounded-lg bg-white/10 backdrop-blur">
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: recommendation }} />
            </div>
          ))}
        </div>
      </section>
    );

    const renderAdsSection = () => (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Active Ad Campaigns</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rawData.map((ad: FacebookAd, index: number) => (
            <div key={index} className="p-4 rounded-lg bg-white/10 backdrop-blur">
              <h3 className="text-lg font-medium mb-2">{ad.pageName}</h3>
              <p className="text-sm text-gray-300 mb-4">
                {ad.snapshot.body.text || ad.snapshot.cards[0]?.title || 'No content available'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(ad.startDate * 1000).toLocaleDateString()} - 
                    {new Date(ad.endDate * 1000).toLocaleDateString()}
                  </span>
                </div>
                {ad.currency && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{ad.currency}</span>
                  </div>
                )}
                {ad.snapshot.instagram_actor_name && (
                  <div className="text-xs text-gray-400">
                    Instagram: {ad.snapshot.instagram_actor_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );

    return (
      <div className="space-y-8">
        <section className="p-4 rounded-lg bg-white/10 backdrop-blur">
          <div dangerouslySetInnerHTML={{ __html: analysis.overview }} />
        </section>
        {analysis.adPerformance.length > 0 && renderPerformanceSection()}
        {analysis.competitors.length > 0 && renderCompetitorsSection()}
        {analysis.recommendations.length > 0 && renderRecommendationsSection()}
        {rawData.length > 0 && renderAdsSection()}
      </div>
    );
  }
}));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center space-x-2 p-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
           style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const FacebookMetaAnalytics: React.FC<FacebookMetaAnalyticsProps> = ({ query }) => {
  const { metaData, getMetaData, isLoading, error } = useFacebookMetaStore();

  React.useEffect(() => {
    if (query.trim()) {
      getMetaData(query);
    }
  }, [query, getMetaData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-400/10 rounded-lg">
        {error}
      </div>
    );
  }

  if (!metaData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Facebook Ad Insights Dashboard</h1>
        <p className="text-gray-400">Campaign Analysis for: {query}</p>
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsContent 
          analysis={metaData.analysis} 
          rawData={metaData.rawData.data} 
        />
      </Suspense>
    </div>
  );
};

export default FacebookMetaAnalytics;