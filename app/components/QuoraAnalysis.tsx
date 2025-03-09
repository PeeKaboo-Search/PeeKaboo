"use client";

import React, { useState, useEffect, memo } from 'react';
import { QuoraAnalysisService } from '@/app/api/quoraAnalytics';
import { 
  AlertCircle, Brain, Heart, 
  TrendingUp, Target, Users 
} from 'lucide-react';
import { Progress } from "@/app/components/ui/progress";
import "@/app/styles/QuoraAnalytics.css"


// Types
interface QuoraAnswer {
  content: string;
  author: {
    name: string;
    profile_url: string;
    credentials: string;
  };
  post_url: string;
  upvotes: number;
  timestamp: string;
}

interface PainPoint {
  title: string;
  description: string;
  frequency: number;
  impact: number;
  possibleSolutions: string[];
}

interface UserExperience {
  scenario: string;
  impact: string;
  frequencyPattern: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface EmotionalTrigger {
  trigger: string;
  context: string;
  intensity: number;
  responsePattern: string;
}

interface AnalysisData {
  analysis: {
    overview: string;
    painPoints: PainPoint[];
    userExperiences: UserExperience[];
    emotionalTriggers: EmotionalTrigger[];
    marketImplications: string;
  };
  sources: QuoraAnswer[];
  timestamp: string;
}

interface QuoraAnalyticsProps {
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

// Main Component
const QuoraAnalyticsDashboard: React.FC<QuoraAnalyticsProps> = ({ query, className = '' }) => {
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
        const result = await QuoraAnalysisService.analyzeQuoraData(query);
        
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
          error: error instanceof Error ? error.message : 'Failed to analyze Quora data'
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
        <h1 className="text-3xl font-bold mb-2">Quora Discussion Analysis</h1>
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

        {/* Pain Points Grid */}
        <section>
          <SectionHeader 
            icon={<AlertCircle className="w-6 h-6" />} 
            title="Pain Points" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.analysis.painPoints.map((point, index) => (
              <AnalysisCard
                key={`pain-${index}`}
                title={point.title}
                content={point.description}
                metric={point.impact}
                metricLabel="Impact Score"
                items={point.possibleSolutions}
              />
            ))}
          </div>
        </section>

        {/* User Experiences */}
        <section>
          <SectionHeader 
            icon={<Users className="w-6 h-6" />} 
            title="User Experiences" 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.analysis.userExperiences.map((exp, index) => (
              <AnalysisCard
                key={`exp-${index}`}
                title={exp.scenario}
                content={exp.impact}
                items={[
                  `Pattern: ${exp.frequencyPattern}`,
                  `Sentiment: ${exp.sentiment}`
                ]}
              />
            ))}
          </div>
        </section>

        {/* Emotional Triggers */}
        <section>
          <SectionHeader 
            icon={<Heart className="w-6 h-6" />} 
            title="Emotional Triggers" 
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.analysis.emotionalTriggers.map((trigger, index) => (
              <AnalysisCard
                key={`trigger-${index}`}
                title={trigger.trigger}
                content={trigger.context}
                metric={trigger.intensity}
                metricLabel="Intensity"
                items={[`Response: ${trigger.responsePattern}`]}
              />
            ))}
          </div>
        </section>

        {/* Market Implications */}
        <section>
          <SectionHeader 
            icon={<Brain className="w-6 h-6" />} 
            title="Market Implications" 
          />
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="prose max-w-none">
              {data.analysis.marketImplications}
            </div>
          </div>
        </section>

        {/* Source Answers */}
        <section>
          <SectionHeader 
            icon={<TrendingUp className="w-6 h-6" />} 
            title="Source Answers" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.sources.map((answer, index) => (
              <div key={`answer-${index}`} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="mb-4">{answer.content}</div>
                <div className="flex justify-between items-center text-sm">
                  <a 
                    href={answer.author.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {answer.author.name}
                  </a>
                  <div className="flex items-center gap-4">
                    <span>👍 {answer.upvotes}</span>
                    <a 
                      href={answer.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View on Quora →
                    </a>
                  </div>
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

QuoraAnalyticsDashboard.displayName = 'QuoraAnalyticsDashboard';

export default memo(QuoraAnalyticsDashboard);