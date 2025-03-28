"use client";

import React, { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import { 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  BarChart2,
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
    case 'positive': return '#22c55e';
    case 'negative': return '#ef4444';
    case 'mixed': return '#f59e0b';
    default: return '#94a3b8';
  }
};

const AnalysisCard = memo(({ title, description, items, score, scoreLabel, sentiment }: AnalysisCardProps) => {
  const sentimentColor = getSentimentColor(sentiment);
  
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600
        }}>{title}</h3>
        {sentiment && (
          <Badge style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: sentimentColor
          }}>
            {sentiment}
          </Badge>
        )}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexGrow: 1
      }}>
        <p dangerouslySetInnerHTML={{ __html: description }} />
        {items?.map((item, idx) => (
          <p key={idx} style={{ fontSize: '0.875rem' }} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </div>
      {score !== undefined && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            position: 'relative',
            height: '0.125rem',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              height: '100%',
              transition: 'width 0.3s ease',
              width: `${score}%`,
              backgroundColor: 
                score > 75 ? '#22c55e' :
                score > 50 ? '#f59e0b' :
                score > 25 ? '#f97316' : '#ef4444'
            }} />
          </div>
          <span style={{ fontSize: '0.875rem' }}>
            {scoreLabel}: {score}%
          </span>
        </div>
      )}
    </div>
  );
});
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
  <div style={{
    padding: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem'
    }}>
      {comment.snippet.topLevelComment.snippet.authorProfileImageUrl && (
        <div style={{
          position: 'relative',
          width: '2.5rem',
          height: '2.5rem',
          overflow: 'hidden',
          borderRadius: '50%',
          flexShrink: 0
        }}>
          <Image
            src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
            alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
            fill
            sizes="40px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 500 }}>
          {comment.snippet.topLevelComment.snippet.authorDisplayName}
        </p>
        <p style={{ 
          marginTop: '0.25rem',
          fontSize: '0.875rem',
          whiteSpace: 'pre-line'
        }}>
          {comment.snippet.topLevelComment.snippet.textDisplay}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ThumbsUp size={14} />
            <span>{comment.snippet.topLevelComment.snippet.likeCount}</span>
          </div>
          {comment.snippet.totalReplyCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MessageSquare size={14} />
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
  const [activeTab, setActiveTab] = useState("pain-points");
  const [error, setError] = useState<ErrorState | null>(null);

  const handleAnalyzeComments = async () => {
    if (!videoId) return;
    
    setIsAnalyzing(true);
    
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

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600
        }}>Comments</h3>
        <Button
          onClick={handleAnalyzeComments}
          disabled={isAnalyzing || !comments || comments.items.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart2 size={16} />
              Analyze Comments
            </>
          )}
        </Button>
      </div>
      
      {commentsLoading ? (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    width: '8rem',
                    height: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.25rem'
                  }} />
                  <div style={{
                    width: '100%',
                    height: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.25rem'
                  }} />
                  <div style={{
                    width: '75%',
                    height: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.25rem'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !comments ? (
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Error loading comments. Please try again.
        </p>
      ) : comments.items.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '0.5rem'
        }}>
          <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            No comments found for this video.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxHeight: '24rem',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          {comments.items.slice(0, 10).map((comment) => (
            <CommentItemComponent key={comment.id} comment={comment} />
          ))}
          {comments.items.length > 10 && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              paddingTop: '0.5rem'
            }}>
              Showing 10 of {comments.items.length} comments
            </p>
          )}
        </div>
      )}

      {commentAnalysis && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            Comment Analysis Dashboard
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem' }}>
            {videoTitle}
          </p>

          {commentAnalysis.success && commentAnalysis.data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '1rem'
                }}>Overview</h3>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem'
                }}>
                  <p style={{ fontSize: '1.125rem', whiteSpace: 'pre-line' }}>
                    {commentAnalysis.data.analysis.overview}
                  </p>
                </div>
              </section>

              <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
                <TabsList style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '2rem'
                }}>
                  <TabsTrigger value="pain-points" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    transition: 'background-color 0.2s'
                  }}>
                    <TrendingUp size={16} />
                    Pain Points
                  </TabsTrigger>
                  <TabsTrigger value="user-experiences" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    transition: 'background-color 0.2s'
                  }}>
                    <Users size={16} />
                    User Experiences
                  </TabsTrigger>
                  <TabsTrigger value="emotional-triggers" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    transition: 'background-color 0.2s'
                  }}>
                    <Lightbulb size={16} />
                    Emotional Triggers
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pain-points">
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(1, 1fr)'
                  }}>
                    {validateArray(commentAnalysis.data.analysis.painPoints).map((point, index) => (
                      <PainPointCard key={index} point={point} />
                    ))}
                    {validateArray(commentAnalysis.data.analysis.painPoints).length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '2rem'
                      }}>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          No pain points identified.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="user-experiences">
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(1, 1fr)'
                  }}>
                    {validateArray(commentAnalysis.data.analysis.userExperiences).map((exp, index) => (
                      <ExperienceCard key={index} exp={exp} />
                    ))}
                    {validateArray(commentAnalysis.data.analysis.userExperiences).length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '2rem'
                      }}>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          No user experiences identified.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="emotional-triggers">
                  <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(1, 1fr)'
                  }}>
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
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '2rem'
                      }}>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          No emotional triggers identified.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <section>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '1rem'
                }}>
                  <Target size={20} />
                  Market Implications
                </h3>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem'
                }}>
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {commentAnalysis.data.analysis.marketImplications}
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div style={{ 
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem'
            }}>
              <AlertTriangle size={48} style={{ 
                color: '#f59e0b',
                margin: '0 auto 1rem'
              }} />
              <p style={{ fontSize: '1.125rem' }}>
                {commentAnalysis.error || error?.message || "Failed to generate analysis."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentAnalysis;