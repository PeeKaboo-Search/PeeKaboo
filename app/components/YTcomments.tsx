"use client";

import React, { useEffect, useState, memo, useRef } from 'react';
import Image from 'next/image';
import { 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  BarChart2,
  X,
  TrendingUp,
  Target,
  Lightbulb,
  Users,
  AlertTriangle
} from 'lucide-react';
import { 
  CommentThreadResponse,
  CommentAnalysis as CommentAnalysisType
} from '@/app/types/youtube';
import { 
  getVideoComments,
  analyzeVideoComments
} from '@/app/api/youtubeAnalytics';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogPortal
} from "@/app/components/ui/dialog"; 
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";

interface ErrorState {
  message: string;
  code: string;
}

interface AnalysisCardProps {
  title: string;
  description: string;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

interface PainPoint {
  title: string;
  description: string;
  possibleSolutions: string[];
  frequency: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
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

interface CommentAnalysisProps {
  videoId: string;
  videoTitle: string;
}

const validateArray = <T,>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : [];
};

const getSentimentColor = (sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed') => {
  switch (sentiment) {
    case 'positive': return 'text-green-500';
    case 'negative': return 'text-red-500';
    case 'mixed': return 'text-amber-500';
    default: return 'text-gray-400';
  }
};

const AnalysisCard = memo(({ title, description, items, score, scoreLabel, sentiment }: AnalysisCardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {sentiment && (
        <Badge className={`${getSentimentColor(sentiment)} bg-opacity-20`}>
          {sentiment}
        </Badge>
      )}
    </div>
    <div className="space-y-4 flex-grow">
      <p dangerouslySetInnerHTML={{ __html: description }} />
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
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className={`h-full transition-all ${
              score > 75 ? "bg-green-500" : 
              score > 50 ? "bg-amber-500" : 
              score > 25 ? "bg-orange-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm">
          {scoreLabel}: {score}%
        </span>
      </div>
    )}
  </div>
));
AnalysisCard.displayName = 'AnalysisCard';

const PainPointCard = memo(({ point }: { point: PainPoint }) => (
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
));
PainPointCard.displayName = 'PainPointCard';

const ExperienceCard = memo(({ exp }: { exp: UserExperience }) => (
  <AnalysisCard
    title={`${exp.scenario.substring(0, 40)}...`}
    description={exp.scenario}
    items={[
      `<strong>Impact:</strong> ${exp.impact}`,
      `<strong>Pattern:</strong> ${exp.frequencyPattern}`
    ]}
    sentiment={exp.sentiment}
  />
));
ExperienceCard.displayName = 'ExperienceCard';

const TriggerCard = memo(({ trigger }: { trigger: EmotionalTrigger }) => (
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
));
TriggerCard.displayName = 'TriggerCard';

const CommentItemComponent = memo(({ comment }: { comment: CommentItemType }) => (
  <div className="p-4 border rounded-lg transition-all hover:bg-white/5">
    <div className="flex items-start gap-3">
      {comment.snippet.topLevelComment.snippet.authorProfileImageUrl && (
        <div className="relative w-10 h-10 overflow-hidden rounded-full flex-shrink-0">
          <Image
            src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
            alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <p className="font-medium">{comment.snippet.topLevelComment.snippet.authorDisplayName}</p>
        <p className="mt-1 text-sm whitespace-pre-line">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>{comment.snippet.topLevelComment.snippet.likeCount}</span>
          </div>
          {comment.snippet.totalReplyCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{comment.snippet.totalReplyCount} replies</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));
CommentItemComponent.displayName = 'CommentItemComponent';

const CommentAnalysis: React.FC<CommentAnalysisProps> = ({ videoId, videoTitle }) => {
  const [comments, setComments] = useState<CommentThreadResponse | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("pain-points");
  const [error, setError] = useState<ErrorState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleAnalyzeComments = async () => {
    if (!videoId) return;
    
    setIsAnalyzing(true);
    setShowAnalysis(true);
    
    try {
      const analysis = await analyzeVideoComments(videoId, videoTitle);
      setCommentAnalysis(analysis as CommentAnalysisType);
    } catch (err) {
      console.error('Failed to analyze comments:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to analyze comments',
        code: 'ANALYSIS_ERROR'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (!videoId) return;
      
      setCommentsLoading(true);
      setComments(null);
      
      try {
        const commentsData = await getVideoComments(videoId);
        setComments(commentsData as CommentThreadResponse);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch comments',
          code: 'COMMENTS_ERROR'
        });
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [videoId]);

  const handleDialogChange = (open: boolean) => {
    setShowAnalysis(open);
    if (!open) {
      setActiveTab("pain-points");
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Comments</h3>
        <Button
          onClick={handleAnalyzeComments}
          disabled={isAnalyzing || !comments || comments.items.length === 0}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart2 className="h-4 w-4" />
              Analyze Comments
            </>
          )}
        </Button>
      </div>
      
      {commentsLoading ? (
        <div className="mt-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !comments ? (
        <p className="text-muted-foreground">Error loading comments. Please try again.</p>
      ) : comments.items.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-lg">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">No comments found for this video.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {comments.items.slice(0, 10).map((comment) => (
            <CommentItemComponent key={comment.id} comment={comment} />
          ))}
          {comments.items.length > 10 && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              Showing 10 of {comments.items.length} comments
            </p>
          )}
        </div>
      )}

      <Dialog open={showAnalysis} onOpenChange={handleDialogChange}>
        <DialogPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
            <DialogContent 
              ref={dialogRef}
              className="bg-black/90 border border-white/20 rounded-xl w-11/12 max-w-5xl max-h-[90vh] shadow-xl flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeader className="border-b border-white/10 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl font-bold">Comment Analysis Dashboard</DialogTitle>
                    <DialogDescription className="text-white/70 mt-1">
                      {videoTitle}
                    </DialogDescription>
                  </div>
                  <DialogClose className="rounded-full p-2 hover:bg-white/10 transition-colors">
                    <X className="h-5 w-5" />
                  </DialogClose>
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {commentAnalysis?.success && commentAnalysis.data ? (
                  <div className="space-y-8">
                    <section>
                      <h2 className="text-2xl font-bold mb-4">Overview</h2>
                      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <p className="text-lg whitespace-pre-line">{commentAnalysis.data.analysis.overview}</p>
                      </div>
                    </section>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid grid-cols-3 mb-8">
                        <TabsTrigger value="pain-points" className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Pain Points
                        </TabsTrigger>
                        <TabsTrigger value="user-experiences" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User Experiences
                        </TabsTrigger>
                        <TabsTrigger value="emotional-triggers" className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Emotional Triggers
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="pain-points">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {validateArray(commentAnalysis.data.analysis.painPoints).map((point, index) => (
                            <PainPointCard key={index} point={point} />
                          ))}
                          {validateArray(commentAnalysis.data.analysis.painPoints).length === 0 && (
                            <div className="col-span-full text-center py-8">
                              <p className="text-muted-foreground">No pain points identified.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="user-experiences">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {validateArray(commentAnalysis.data.analysis.userExperiences).map((exp, index) => (
                            <ExperienceCard key={index} exp={exp} />
                          ))}
                          {validateArray(commentAnalysis.data.analysis.userExperiences).length === 0 && (
                            <div className="col-span-full text-center py-8">
                              <p className="text-muted-foreground">No user experiences identified.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="emotional-triggers">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {validateArray(commentAnalysis.data.analysis.emotionalTriggers).map((triggerData, index) => {
                            const enhancedTrigger: EmotionalTrigger = {
                              trigger: triggerData.trigger,
                              context: triggerData.context,
                              responsePattern: triggerData.responsePattern,
                              intensity: triggerData.intensity,
                              dominantEmotion: 'dominantEmotion' in triggerData ? 
                                triggerData.dominantEmotion as string : 
                                "Unknown"
                            };
                            return <TriggerCard key={index} trigger={enhancedTrigger} />;
                          })}
                          {validateArray(commentAnalysis.data.analysis.emotionalTriggers).length === 0 && (
                            <div className="col-span-full text-center py-8">
                              <p className="text-muted-foreground">No emotional triggers identified.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                    <section>
                      <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                        <Target className="w-6 h-6" />
                        Market Implications
                      </h2>
                      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <div className="prose max-w-none">
                          <p className="whitespace-pre-line">{commentAnalysis.data.analysis.marketImplications}</p>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="py-16 text-center">
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
                          {commentAnalysis?.error || error?.message || "Failed to generate analysis. Please try again."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </div>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default CommentAnalysis;