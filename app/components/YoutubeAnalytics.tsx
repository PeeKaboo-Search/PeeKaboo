"use client";

import React, { useEffect, useState, useRef, memo } from 'react';
import Image from 'next/image';
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronRight,
  AlertTriangle,
  BarChart2,
  ArrowLeft
} from 'lucide-react';
import { 
  YouTubeVideo, 
  VideoStatistics,
  CommentThreadResponse,
  CommentAnalysis as CommentAnalysisType
} from '@/types/youtube';
import { 
  searchYouTubeVideos, 
  getVideoComments,
  analyzeVideoComments
} from '@/app/api/youtubeAnalytics';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import "@/styles/YouTubeAnalytics.css";

interface ErrorState {
  message: string;
  code: string;
}

interface YouTubeVideosProps {
  query: string;
}

interface PainPoint {
  title: string;
  description: string;
  possibleSolutions: string[];
  frequency: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

interface UserExperience {
  scenario: string;
  impact: string;
  frequencyPattern: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

interface EmotionalTrigger {
  trigger: string;
  context: string;
  responsePattern: string;
  dominantEmotion: string;
  intensity: number;
}

interface CommentItemType {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: {
        authorProfileImageUrl?: string;
        authorDisplayName: string;
        textDisplay: string;
        likeCount: number;
      }
    };
    totalReplyCount: number;
  }
}

interface AnalysisCardProps {
  title: string;
  description: string;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

interface CommentAnalysisData {
  success: boolean;
  data?: {
    analysis: {
      overview: string;
      painPoints: PainPoint[];
      userExperiences: UserExperience[];
      emotionalTriggers: EmotionalTrigger[];
      marketImplications: string;
    };
  };
  error?: string;
}

interface CommentAnalysisProps {
  commentAnalysis: CommentAnalysisData | null;
  isAnalyzing: boolean;
  onBackToComments: () => void;
}

// CommentAnalysis component
const CommentAnalysis: React.FC<CommentAnalysisProps> = ({ 
  commentAnalysis, 
  isAnalyzing, 
  onBackToComments 
}) => {
  const [activeTab, setActiveTab] = useState<string>("pain-points");

  const validateArray = <T,>(data: T[] | undefined | null): T[] => {
    return Array.isArray(data) ? data : [];
  };

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | undefined): string => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'mixed': return 'text-amber-500';
      default: return 'text-gray-400';
    }
  };

  const AnalysisCard: React.FC<AnalysisCardProps> = ({ 
    title, 
    description, 
    items, 
    score, 
    scoreLabel, 
    sentiment 
  }) => (
    <div className="bg-black/10 backdrop-blur-lg rounded-lg p-4 shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {sentiment && (
          <Badge className={`${getSentimentColor(sentiment)} bg-opacity-20`}>
            {sentiment}
          </Badge>
        )}
      </div>
      <div className="space-y-3 flex-grow text-sm">
        <p dangerouslySetInnerHTML={{ __html: description }} />
        {items && items.length > 0 && (
          <ul className="space-y-1 mt-2">
            {items.map((item: string, idx: number) => (
              <li key={idx} className="text-xs" dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        )}
      </div>
      {score !== undefined && (
        <div className="mt-3 space-y-1">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full transition-all ${
                score > 75 ? "bg-green-500" : 
                score > 50 ? "bg-amber-500" : 
                score > 25 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs">
            {scoreLabel}: {score}%
          </span>
        </div>
      )}
    </div>
  );

  const PainPointCard: React.FC<{ point: PainPoint }> = ({ point }) => (
    <AnalysisCard
      title={point.title}
      description={point.description}
      items={[
        `<strong>Possible Solutions:</strong> ${point.possibleSolutions.join(", ")}`
      ]}
      score={point.frequency * 10}
      scoreLabel="Frequency Score"
      sentiment={point.sentiment}
    />
  );

  const ExperienceCard: React.FC<{ exp: UserExperience }> = ({ exp }) => (
    <AnalysisCard
      title={`${exp.scenario.substring(0, 40)}...`}
      description={exp.scenario}
      items={[
        `<strong>Impact:</strong> ${exp.impact}`,
        `<strong>Pattern:</strong> ${exp.frequencyPattern}`
      ]}
      sentiment={exp.sentiment}
    />
  );

  const TriggerCard: React.FC<{ trigger: EmotionalTrigger }> = ({ trigger }) => (
    <AnalysisCard
      title={trigger.trigger}
      description={trigger.context}
      items={[
        `<strong>Response:</strong> ${trigger.responsePattern}`,
        `<strong>Emotion:</strong> ${trigger.dominantEmotion}`
      ]}
      score={trigger.intensity * 10}
      scoreLabel="Intensity"
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Comments Analysis</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBackToComments}
          className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-600/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Video
        </Button>
      </div>

      {commentAnalysis?.success && commentAnalysis.data ? (
        <>
          <section>
            <div className="bg-black/10 backdrop-blur-lg rounded-lg p-4">
              <p className="text-sm whitespace-pre-line">{commentAnalysis.data.analysis.overview}</p>
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-black/20">
              <TabsTrigger value="pain-points" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Pain Points</TabsTrigger>
              <TabsTrigger value="user-experiences" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">User Experiences</TabsTrigger>
              <TabsTrigger value="emotional-triggers" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Emotional Triggers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pain-points" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validateArray(commentAnalysis.data.analysis.painPoints).map((point: PainPoint, index: number) => (
                  <PainPointCard key={index} point={point} />
                ))}
                {validateArray(commentAnalysis.data.analysis.painPoints).length === 0 && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-muted-foreground">No pain points identified.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="user-experiences" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validateArray(commentAnalysis.data.analysis.userExperiences).map((exp: UserExperience, index: number) => (
                  <ExperienceCard key={index} exp={exp} />
                ))}
                {validateArray(commentAnalysis.data.analysis.userExperiences).length === 0 && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-muted-foreground">No user experiences identified.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="emotional-triggers" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validateArray(commentAnalysis.data.analysis.emotionalTriggers).map((triggerData: EmotionalTrigger, index: number) => {
                  const enhancedTrigger: EmotionalTrigger = {
                    trigger: triggerData.trigger,
                    context: triggerData.context,
                    responsePattern: triggerData.responsePattern,
                    intensity: triggerData.intensity,
                    dominantEmotion: 'dominantEmotion' in triggerData ? 
                      triggerData.dominantEmotion : 
                      "Unknown"
                  };
                  return <TriggerCard key={index} trigger={enhancedTrigger} />;
                })}
                {validateArray(commentAnalysis.data.analysis.emotionalTriggers).length === 0 && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-muted-foreground">No emotional triggers identified.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <section>
            <h2 className="text-lg font-bold mb-3">Market Implications</h2>
            <div className="bg-black/10 backdrop-blur-lg rounded-lg p-4">
              <p className="text-sm whitespace-pre-line">{commentAnalysis.data.analysis.marketImplications}</p>
            </div>
          </section>
        </>
      ) : (
        <div className="py-12 text-center">
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-lg">Analyzing comments...</p>
              <p className="text-sm text-muted-foreground">This may take a moment for videos with many comments</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
              <p className="text-lg">
                {commentAnalysis?.error || "Failed to generate analysis. Please try again."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentAnalysis;