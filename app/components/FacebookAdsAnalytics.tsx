"use client";

import React, { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { MetaAdAnalysisService } from '@/app/api/facebookAnalytics';
import { 
  MessageSquare, Eye, Target, 
  Users, Award, ArrowRight, Sparkles,
  ImageIcon, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Progress } from "@/app/components/ui/progress"; 

// Updated Types to support multiple images
interface MetaAdContent {
  adId: string;
  pageId: string;
  pageName: string;
  content: string;
  title?: string;
  images: string[]; // Changed from imageUrl to images array
  linkUrl?: string;
  active: boolean;
  creationTime?: string;
}

interface MessagingStrategy {
  strategy: string;
  description: string;
  prevalence: number;
  effectiveness: number;
  examples: string[];
}

interface VisualTactic {
  tactic: string;
  implementation: string;
  impact: string;
  frequencyOfUse: number;
}

interface AudienceTargeting {
  segment: string;
  approach: string;
  intensity: number;
  engagementPotential: string;
}

interface CallToActionEffectiveness {
  cta: string;
  context: string;
  strength: number;
  conversionPotential: string;
}

interface AnalysisData {
  overview: string;
  messagingStrategies: MessagingStrategy[];
  visualTactics: VisualTactic[];
  audienceTargeting: AudienceTargeting[];
  competitiveAdvantage: string;
  callToActionEffectiveness: CallToActionEffectiveness[];
  recommendedCounterStrategies: string;
}

interface AnalysisResult {
  analysis: AnalysisData;
  sources: MetaAdContent[];
  timestamp: string;
}

interface MetaAdAnalysisProps {
  keyword: string;
  countryCode?: string;
  platform?: string;
  adType?: string;
  limit?: number;
  className?: string;
}

// Image Carousel Component
const ImageCarousel = memo(({ 
  images,
  adTitle,
  pageName 
}: { 
  images: string[];
  adTitle?: string;
  pageName: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-64 bg-gray-800 flex items-center justify-center rounded-md">
        <ImageIcon className="w-12 h-12 opacity-40" />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden group">
      <Image 
        src={images[currentIndex]} 
        alt={adTitle || `Ad from ${pageName}`} 
        fill
        style={{ objectFit: 'cover' }}
        className="rounded-md"
      />
      
      {images.length > 1 && (
        <>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, idx) => (
              <button 
                key={idx} 
                className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      
      <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  );
});
ImageCarousel.displayName = 'ImageCarousel';

// Helper Components
const AnalysisCard = memo(({ 
  title, 
  content, 
  metric,
  metricLabel,
  secondMetric,
  secondMetricLabel,
  items 
}: { 
  title: string;
  content: string;
  metric?: number;
  metricLabel?: string;
  secondMetric?: number;
  secondMetricLabel?: string;
  items?: string[];
}) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="mb-4">{content}</p>
    
    {metric !== undefined && (
      <div className="space-y-2 mb-3">
        <Progress value={metric * 10} className="h-2" />
        <span className="text-sm">
          {metricLabel}: {metric}/10
        </span>
      </div>
    )}
    
    {secondMetric !== undefined && (
      <div className="space-y-2 mb-3">
        <Progress value={secondMetric * 10} className="h-2" />
        <span className="text-sm">
          {secondMetricLabel}: {secondMetric}/10
        </span>
      </div>
    )}
    
    {items && items.length > 0 && (
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

// Main Component
const MetaAdAnalysisDashboard: React.FC<MetaAdAnalysisProps> = ({ 
  keyword,
  countryCode = 'US',
  platform = 'facebook,instagram',
  adType = 'all',
  limit = 10,
  className = '' 
}) => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    data?: AnalysisResult;
  }>({
    loading: true
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!keyword) return;

      setState(prev => ({ ...prev, loading: true }));

      try {
        const result = await MetaAdAnalysisService.analyzeCompetitorAds(
          keyword,
          countryCode,
          platform,
          adType,
          limit
        );
        
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
          error: error instanceof Error ? error.message : 'Failed to analyze Meta ads'
        });
      }
    };

    fetchAnalysis();
  }, [keyword, countryCode, platform, adType, limit]);

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
        <h1 className="text-3xl font-bold mb-2">Meta Ad Competitor Analysis</h1>
        <p className="text-lg opacity-70">Analysis for: {keyword}</p>
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

        {/* Messaging Strategies */}
        <section>
          <SectionHeader 
            icon={<MessageSquare className="w-6 h-6" />} 
            title="Messaging Strategies" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.analysis.messagingStrategies.map((strategy, index) => (
              <AnalysisCard
                key={`strategy-${index}`}
                title={strategy.strategy}
                content={strategy.description}
                metric={strategy.prevalence}
                metricLabel="Prevalence"
                secondMetric={strategy.effectiveness}
                secondMetricLabel="Effectiveness"
                items={strategy.examples}
              />
            ))}
          </div>
        </section>

        {/* Visual Tactics */}
        <section>
          <SectionHeader 
            icon={<Eye className="w-6 h-6" />} 
            title="Visual Tactics" 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.analysis.visualTactics.map((tactic, index) => (
              <AnalysisCard
                key={`tactic-${index}`}
                title={tactic.tactic}
                content={tactic.implementation}
                metric={tactic.frequencyOfUse}
                metricLabel="Frequency of Use"
                items={[`Impact: ${tactic.impact}`]}
              />
            ))}
          </div>
        </section>

        {/* Audience Targeting */}
        <section>
          <SectionHeader 
            icon={<Users className="w-6 h-6" />} 
            title="Audience Targeting" 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.analysis.audienceTargeting.map((audience, index) => (
              <AnalysisCard
                key={`audience-${index}`}
                title={audience.segment}
                content={audience.approach}
                metric={audience.intensity}
                metricLabel="Targeting Intensity"
                items={[`Engagement Potential: ${audience.engagementPotential}`]}
              />
            ))}
          </div>
        </section>

        {/* Competitive Advantage */}
        <section>
          <SectionHeader 
            icon={<Award className="w-6 h-6" />} 
            title="Competitive Advantage" 
          />
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="prose max-w-none">
              {data.analysis.competitiveAdvantage}
            </div>
          </div>
        </section>

        {/* Call to Action Effectiveness */}
        <section>
          <SectionHeader 
            icon={<ArrowRight className="w-6 h-6" />} 
            title="Call to Action Effectiveness" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.analysis.callToActionEffectiveness.map((cta, index) => (
              <AnalysisCard
                key={`cta-${index}`}
                title={cta.cta}
                content={cta.context}
                metric={cta.strength}
                metricLabel="Strength"
                items={[`Conversion Potential: ${cta.conversionPotential}`]}
              />
            ))}
          </div>
        </section>

        {/* Recommended Counter Strategies */}
        <section>
          <SectionHeader 
            icon={<Sparkles className="w-6 h-6" />} 
            title="Recommended Counter Strategies" 
          />
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="prose max-w-none">
              {data.analysis.recommendedCounterStrategies}
            </div>
          </div>
        </section>

        {/* Source Ads */}
        <section>
          <SectionHeader 
            icon={<Target className="w-6 h-6" />} 
            title="Source Ads" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.sources.map((ad, index) => (
              <div key={`ad-${index}`} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                {/* Image carousel for multiple images */}
                {ad.images && ad.images.length > 0 && (
                  <div className="mb-4">
                    <ImageCarousel 
                      images={ad.images} 
                      adTitle={ad.title} 
                      pageName={ad.pageName} 
                    />
                  </div>
                )}
                
                {ad.title && (
                  <h4 className="font-medium mb-2">{ad.title}</h4>
                )}
                <div className="mb-4">{ad.content}</div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-400">
                    {ad.pageName}
                  </span>
                  <div className="flex items-center gap-4">
                    <span>{ad.active ? "Active" : "Inactive"}</span>
                    {ad.linkUrl && (
                      <a 
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View Landing Page →
                      </a>
                    )}
                  </div>
                </div>
                {ad.creationTime && (
                  <div className="text-xs opacity-70 mt-2">
                    Created: {new Date(ad.creationTime).toLocaleDateString()}
                  </div>
                )}
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

MetaAdAnalysisDashboard.displayName = 'MetaAdAnalysisDashboard';

export default memo(MetaAdAnalysisDashboard);