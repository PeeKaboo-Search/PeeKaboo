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
import "@/app/styles/YouTubeAnalytics.css";

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

const ensureVideoStatistics = (stats: Partial<VideoStatistics>): VideoStatistics => ({
  viewCount: stats.viewCount || '0',
  likeCount: stats.likeCount || '0',
  commentCount: stats.commentCount || '0'
});

const formatNumber = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n)) return 'N/A';
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
};

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
          {items.map((item, idx) => (
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

const VideoCard = memo(({ 
  video, 
  statistics, 
  isSelected, 
  onClick 
}: { 
  video: YouTubeVideo, 
  statistics: VideoStatistics,
  isSelected: boolean,
  onClick: () => void
}) => (
  <Card
    className={`youtube-video-card flex-shrink-0 w-72 cursor-pointer snap-start transition-all hover:shadow-lg
      ${isSelected ? 'ring-2 ring-red-600 shadow-md' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-0">
      <div className="relative w-full h-40">
        <Image
          src={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-lg"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2">{video.snippet.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{video.snippet.channelTitle}</p>
        <div className="flex gap-4 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.viewCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Views: {parseInt(statistics.viewCount).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.likeCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Likes: {parseInt(statistics.likeCount || '0').toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">{formatNumber(statistics.commentCount || '0')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comments: {parseInt(statistics.commentCount || '0').toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
));
VideoCard.displayName = 'VideoCard';

const CommentItemComponent = memo(({ comment }: { comment: CommentItemType }) => (
  <div className="p-3 border rounded-lg transition-all hover:bg-black/5">
    <div className="flex items-start gap-3">
      {comment.snippet.topLevelComment.snippet.authorProfileImageUrl && (
        <div className="relative w-8 h-8 overflow-hidden rounded-full flex-shrink-0">
          <Image
            src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
            alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">{comment.snippet.topLevelComment.snippet.authorDisplayName}</p>
        <p className="mt-1 text-xs whitespace-pre-line">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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

const YouTubeVideos: React.FC<YouTubeVideosProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, VideoStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [comments, setComments] = useState<CommentThreadResponse | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("pain-points");
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  
  const videosSliderRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videosSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - videosSliderRef.current.offsetLeft);
    setScrollLeft(videosSliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videosSliderRef.current) return;
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - videosSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      videosSliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken || loadingMore) return;
    try {
      setLoadingMore(true);
      const data = await searchYouTubeVideos(query, nextPageToken);
      const newVideos = [...videos, ...data.items];
      setVideos(newVideos);
      setNextPageToken(data.nextPageToken);

      const newStats: Record<string, VideoStatistics> = { ...statistics };
      data.items.forEach(video => {
        const videoId = video.id.videoId;
        if (video.statistics) {
          newStats[videoId] = ensureVideoStatistics(video.statistics);
        }
      });
      
      setStatistics(newStats);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load more videos',
        code: 'LOAD_MORE_ERROR'
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
    setShowAnalysis(false);
    fetchComments(videoId);
  };

  const fetchComments = async (videoId: string) => {
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

  const handleAnalyzeComments = async () => {
    if (!selectedVideo) return;
    
    setIsAnalyzing(true);
    setShowAnalysis(true);
    
    try {
      const videoTitle = videos.find(v => v.id.videoId === selectedVideo)?.snippet.title || '';
      const analysis = await analyzeVideoComments(selectedVideo, videoTitle);
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

  const handleBackToComments = () => {
    setShowAnalysis(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedVideo(null);
        setShowAnalysis(false);
        
        const data = await searchYouTubeVideos(query, undefined);
        setVideos(data.items);
        setNextPageToken(data.nextPageToken);

        const newStats: Record<string, VideoStatistics> = {};
        data.items.forEach(video => {
          const videoId = video.id.videoId;
          if (video.statistics) {
            newStats[videoId] = ensureVideoStatistics(video.statistics);
          }
        });
        
        setStatistics(newStats);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch data',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchData();
    }
  }, [query]);

  if (loading && !videos.length) {
    return (
      <div className="youtube-videos-container space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">YouTube Videos</h2>
          <p className="text-sm text-muted-foreground">Searching for &quot;{query}&quot;...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-black/5 rounded-lg overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-videos-container space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <div className="flex items-center gap-2"> 
          <p className="text-sm text-muted-foreground mr-2">Search: &quot;{query}&quot;</p>
      
          {nextPageToken && !loadingMore && !showAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreVideos}
              disabled={loading || loadingMore}
              className="flex items-center gap-1"
            >
              Load More <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {loadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error.message}</p>
        </div>
      )}

      {!showAnalysis && (
        <div 
          className="youtube-videos-slider relative overflow-x-auto scrollbar-thin scrollbar-thumb-red-600/20 scrollbar-track-transparent"
          ref={videosSliderRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div className="flex gap-4 py-4 px-2">
            {videos.map((video) => (
              <VideoCard
                key={`youtube-video-${video.id.videoId}`}
                video={video}
                statistics={statistics[video.id.videoId] || ensureVideoStatistics({})}
                isSelected={selectedVideo === video.id.videoId}
                onClick={() => handleVideoSelect(video.id.videoId)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedVideo && !showAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Comments</h3>
            <Button
              onClick={handleAnalyzeComments}
              disabled={isAnalyzing || !comments || comments.items.length === 0}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
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
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-black/10 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-2 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !comments ? (
            <p className="text-muted-foreground">Error loading comments. Please try again.</p>
          ) : comments.items.length === 0 ? (
            <div className="p-6 text-center border border-dashed rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No comments found for this video.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-600/20 scrollbar-track-transparent">
              {comments.items.slice(0, 10).map((comment) => (
                <CommentItemComponent key={comment.id} comment={comment} />
              ))}
              {comments.items.length > 10 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Showing 10 of {comments.items.length} comments
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showAnalysis && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Comments Analysis</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToComments}
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
                    {validateArray(commentAnalysis.data.analysis.painPoints).map((point, index) => (
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
                    {validateArray(commentAnalysis.data.analysis.userExperiences).map((exp, index) => (
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
                    {commentAnalysis?.error || error?.message || "Failed to generate analysis. Please try again."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

YouTubeVideos.displayName = 'YouTubeVideos';

export default memo(YouTubeVideos);