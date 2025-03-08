"use client";

import React, { useState, useEffect, memo } from 'react';
import { FacebookAdsAnalysisService } from '@/app/api/facebookAds';
import { 
  BarChart, Brain, 
  Target, MessageCircle, Image as ImageIcon
} from 'lucide-react';
import { Progress } from "@/app/components/ui/progress"; 
import Image from 'next/image';

// Types
interface ExtractedAdData {
  id: string;
  pageId: string;
  pageName: string;
  text: string;
  images: string[];
  videos: {
    preview: string;
    sdUrl?: string;
    hdUrl?: string;
  }[];
  title?: string;
  caption?: string;
  startDate: Date;
  endDate: Date;
}

interface AnalysisResult {
  overview: string;
  emotionalTone: string;
  targetAudience: string;
  keyMessages: string[];
  effectiveness: number;
  suggestions: string[];
}

interface AnalysisData {
  ads: ExtractedAdData[];
  analysis: AnalysisResult;
  timestamp: string;
}

interface FacebookAdsAnalyticsProps {
  query: string;
  className?: string;
}

// Helper Components
const AnalysisCard = memo(({ 
  title, 
  content, 
  metric,
  metricLabel,
  items 
}: { 
  title: string;
  content: string;
  metric?: number;
  metricLabel?: string;
  items?: string[];
}) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="mb-4">{content}</p>
    {metric !== undefined && (
      <div className="space-y-2">
        <Progress value={metric * 10} className="h-2" />
        <span className="text-sm">
          {metricLabel}: {metric}/10
        </span>
      </div>
    )}
    {items && (
      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm">{item}</li>
        ))}
      </ul>
    )}
  </div>
));

AnalysisCard.displayName = 'AnalysisCard';

const SectionHeader = memo(({ 
  icon, 
  title 
}: { 
  icon: React.ReactNode; 
  title: string;
}) => (
  <div className="flex items-center gap-2 text-2xl font-bold mb-4">
    {icon}
    {title}
  </div>
));

SectionHeader.displayName = 'SectionHeader';

const AdMediaGallery = memo(({ ad }: { ad: ExtractedAdData }) => {
  const hasImages = ad.images && ad.images.length > 0;
  const hasVideos = ad.videos && ad.videos.length > 0;
  
  if (!hasImages && !hasVideos) return null;
  
  return (
    <div className="mt-4">
      {hasImages && (
        <div className="grid grid-cols-2 gap-2">
          {ad.images.slice(0, 4).map((imageUrl, index) => (
            <div key={`img-${index}`} className="relative w-full h-32">
              <Image 
                src={imageUrl}
                alt={`Ad image ${index + 1}`}
                className="object-cover rounded"
                fill
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/api/placeholder/200/150";
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {hasVideos && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ad.videos.slice(0, 2).map((video, index) => (
            <div key={`video-${index}`} className="relative h-32">
              <Image 
                src={video.preview || "/api/placeholder/200/150"}
                alt={`Video preview ${index + 1}`}
                className="object-cover rounded"
                fill
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

AdMediaGallery.displayName = 'AdMediaGallery';

// Main Component
const FacebookAdsAnalyticsDashboard: React.FC<FacebookAdsAnalyticsProps> = ({ query, className = '' }) => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    data?: AnalysisData;
  }>({
    loading: true
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!query) return;

      setState(prev => ({ ...prev, loading: true }));

      try {
        const result = await FacebookAdsAnalysisService.analyzeFacebookAds(query);
        
        if (result.success && result.data) {
          setState({
            loading: false,
            data: result.data
          });
        } else {
          setState({
            loading: false,
            error: result.error || 'Unknown error occurred'
          });
        }
      } catch (error) {
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to analyze Facebook ads'
        });
      }
    };

    fetchAnalysis();
  }, [query]);

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="text-center text-red-500 p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Error
        </div>
        {state.error}
      </div>
    );
  }

  if (!state.data) {
    return null;
  }

  const { data } = state;

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${className}`}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Facebook Ads Analysis</h1>
        <p className="text-lg opacity-70">Analysis for: {query}</p>
      </header>

      <div className="space-y-8">
        {/* Overview Section */}
        <section>
          <SectionHeader 
            icon={<Target className="w-6 h-6" />} 
            title="Overview" 
          />
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="prose max-w-none">
              {data.analysis.overview}
            </div>
          </div>
        </section>

        {/* Emotional Tone & Target Audience */}
        <section>
          <SectionHeader 
            icon={<Brain className="w-6 h-6" />} 
            title="Audience Insights" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalysisCard
              title="Emotional Tone"
              content={data.analysis.emotionalTone}
            />
            <AnalysisCard
              title="Target Audience"
              content={data.analysis.targetAudience}
            />
          </div>
        </section>

        {/* Key Messages */}
        <section>
          <SectionHeader 
            icon={<MessageCircle className="w-6 h-6" />} 
            title="Key Messages" 
          />
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <ul className="space-y-4">
              {data.analysis.keyMessages.map((message, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">{index + 1}.</span>
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Effectiveness & Suggestions */}
        <section>
          <SectionHeader 
            icon={<BarChart className="w-6 h-6" />} 
            title="Performance Analysis" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalysisCard
              title="Effectiveness Score"
              content="Analysis of overall campaign effectiveness based on ad content and targeting"
              metric={data.analysis.effectiveness}
              metricLabel="Effectiveness"
            />
            <AnalysisCard
              title="Improvement Suggestions"
              content="Recommendations for enhancing ad performance"
              items={data.analysis.suggestions}
            />
          </div>
        </section>

        {/* Ad Examples */}
        <section>
          <SectionHeader 
            icon={<ImageIcon className="w-6 h-6" />} 
            title="Analyzed Ads" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.ads.map((ad, index) => (
              <div key={`ad-${index}`} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{ad.pageName}</div>
                  <div className="text-sm opacity-70">
                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                  </div>
                </div>
                {ad.title && <h4 className="text-lg font-semibold mb-2">{ad.title}</h4>}
                <div className="mb-4">{ad.text}</div>
                <AdMediaGallery ad={ad} />
                <div className="mt-4 text-sm">
                  <a 
                    href={`https://www.facebook.com/ads/library/?id=${ad.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View in Facebook Ad Library →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="text-sm opacity-70 text-right mt-8">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

FacebookAdsAnalyticsDashboard.displayName = 'FacebookAdsAnalyticsDashboard';

export default memo(FacebookAdsAnalyticsDashboard);