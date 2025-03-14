import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronRight, 
  BarChart2,
  X 
} from 'lucide-react';
import { 
  YouTubeVideo, 
  VideoStatistics, 
  CommentThreadResponse,
  CommentAnalysis
} from '@/app/types/youtube';
import { 
  searchYouTubeVideos, 
  getVideoStatistics,
  getVideoComments,
  analyzeVideoComments
} from '@/app/api/youtubeAnalytics';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/app/components/ui/dialog";

// Error state interface
interface ErrorState {
  message: string;
  code: string;
}

// Ensure VideoStatistics type is strict
const ensureVideoStatistics = (stats: Partial<VideoStatistics>): VideoStatistics => ({
  viewCount: stats.viewCount || '0',
  likeCount: stats.likeCount || '0',
  commentCount: stats.commentCount || '0'
});

const YouTubeVideos: React.FC<{ query: string }> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, VideoStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  
  // New state for comments and analysis
  const [comments, setComments] = useState<CommentThreadResponse | null>(null);
  const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const videosSliderRef = useRef<HTMLDivElement>(null);
  const videosTrackRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: string) => {
    const n = parseInt(num);
    if (isNaN(n)) return 'N/A';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
    return n.toString();
  };

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
    if (videosTrackRef.current) {
      videosTrackRef.current.style.transform = "translateX(0px)";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videosSliderRef.current || !videosTrackRef.current) return;
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - videosSliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      videosSliderRef.current.scrollLeft = scrollLeft - walk;
    } else {
      const slider = videosSliderRef.current;
      const track = videosTrackRef.current;
      const sliderWidth = slider.offsetWidth;
      const trackWidth = track.scrollWidth;
      const maxScroll = trackWidth - sliderWidth;
      const mouseX = e.clientX - slider.getBoundingClientRect().left;
      const percentage = mouseX / sliderWidth;
      const scrollAmount = percentage * maxScroll;
      track.style.transform = `translateX(-${scrollAmount}px)`;
    }
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken) return;
    try {
      const data = await searchYouTubeVideos(query, nextPageToken);
      const newVideos = [...videos, ...data.items];
      setVideos(newVideos);
      setNextPageToken(data.nextPageToken);

      const newVideoIds = data.items.map(video => video.id.videoId);
      const newStats = await getVideoStatistics(newVideoIds);
      
      // Use functional update with type-safe conversion
      setStatistics(prevStats => {
        const updatedStats: Record<string, VideoStatistics> = { ...prevStats };
        Object.entries(newStats).forEach(([key, value]) => {
          updatedStats[key] = ensureVideoStatistics(value);
        });
        return updatedStats;
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load more videos',
        code: 'LOAD_MORE_ERROR'
      });
    }
  };

  // New function to handle video selection
  const handleVideoSelect = async (videoId: string) => {
    setSelectedVideo(videoId);
    setComments(null);
    setCommentAnalysis(null);
    
    try {
      const commentsData = await getVideoComments(videoId);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      // We don't set error state here to avoid disrupting the main UI
    }
  };

  // New function to analyze comments
  const handleAnalyzeComments = async () => {
    if (!selectedVideo || !videos.length) return;
    
    setIsAnalyzing(true);
    
    try {
      const selectedVideoData = videos.find(v => v.id.videoId === selectedVideo);
      if (!selectedVideoData) return;
      
      const analysis = await analyzeVideoComments(
        selectedVideo,
        selectedVideoData.snippet.title
      );
      
      setCommentAnalysis(analysis);
      setShowAnalysis(true);
    } catch (err) {
      console.error('Failed to analyze comments:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await searchYouTubeVideos(query);
        setVideos(data.items);
        setNextPageToken(data.nextPageToken);

        const videoIds = data.items.map(video => video.id.videoId);
        const stats = await getVideoStatistics(videoIds);
        
        // Convert stats to strict VideoStatistics type
        const processedStats: Record<string, VideoStatistics> = {};
        Object.entries(stats).forEach(([key, value]) => {
          processedStats[key] = ensureVideoStatistics(value);
        });
        
        setStatistics(processedStats);
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

  // Render loading state
  if (loading && !videos.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="youtube-videos-container space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <div className="flex items-center">
          <p className="text-sm text-muted-foreground mr-2">Scroll, drag, or hover to explore</p>
          {nextPageToken && (
            <button
              onClick={loadMoreVideos}
              disabled={loading}
              className="flex items-center text-sm text-primary hover:bg-primary/10 p-2 rounded-md transition-colors"
            >
              Load More <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{error.message}</p>
        </div>
      )}

      <div 
        className="youtube-videos-slider"
        ref={videosSliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div 
          className="youtube-videos-track flex gap-4 py-4 px-8"
          ref={videosTrackRef}
        >
          {videos.map((video) => (
            <Card
              key={`youtube-video-${video.id.videoId}`}
              className={`youtube-video-card flex-shrink-0 w-72 cursor-pointer snap-start transition-shadow hover:shadow-lg
                ${selectedVideo === video.id.videoId ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleVideoSelect(video.id.videoId)}
            >
              <CardContent className="p-0">
                <div className="relative w-full h-40">
                  <Image
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2">{video.snippet.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{video.snippet.channelTitle}</p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(statistics[video.id.videoId]?.viewCount || '0')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(statistics[video.id.videoId]?.likeCount || '0')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(statistics[video.id.videoId]?.commentCount || '0')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected video comments section */}
      {selectedVideo && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Comments</h3>
            <Button
              onClick={handleAnalyzeComments}
              disabled={isAnalyzing || !comments}
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
          
          {!comments ? (
            <p className="text-muted-foreground">Loading comments...</p>
          ) : comments.items.length === 0 ? (
            <p className="text-muted-foreground">No comments found for this video.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {comments.items.slice(0, 10).map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg">
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
                      <p className="mt-1 text-sm">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
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
              ))}
              {comments.items.length > 10 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Showing 10 of {comments.items.length} comments
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comment Analysis Dialog */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Comment Analysis</DialogTitle>
            <DialogClose className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>

          {commentAnalysis?.success && commentAnalysis.data ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="painPoints">Pain Points</TabsTrigger>
                <TabsTrigger value="experiences">User Experiences</TabsTrigger>
                <TabsTrigger value="triggers">Emotional Triggers</TabsTrigger>
                <TabsTrigger value="implications">Implications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4">
                <div className="prose max-w-none">
                  <p className="text-lg">{commentAnalysis.data.analysis.overview}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="painPoints" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commentAnalysis.data.analysis.painPoints.map((point, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <h4 className="text-lg font-bold mb-2">{point.title}</h4>
                        <p className="mb-3">{point.description}</p>
                        <div className="flex gap-4 mb-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Frequency:</span>
                            <span className="ml-1 font-medium">{point.frequency}/10</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Impact:</span>
                            <span className="ml-1 font-medium">{point.impact}/10</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Possible Solutions:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {point.possibleSolutions.map((solution, j) => (
                              <li key={j}>{solution}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="experiences" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {commentAnalysis.data.analysis.userExperiences.map((exp, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <h4 className="text-lg font-bold mb-2">Scenario {i+1}</h4>
                        <p className="mb-3">{exp.scenario}</p>
                        <p className="mb-3"><span className="font-medium">Impact:</span> {exp.impact}</p>
                        <p className="mb-3"><span className="font-medium">Pattern:</span> {exp.frequencyPattern}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Sentiment:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            exp.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            exp.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {exp.sentiment}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="triggers" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {commentAnalysis.data.analysis.emotionalTriggers.map((trigger, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <h4 className="text-lg font-bold mb-2">{trigger.trigger}</h4>
                        <p className="mb-3">{trigger.context}</p>
                        <div className="mb-3">
                          <span className="text-sm text-muted-foreground">Intensity:</span>
                          <span className="ml-1 font-medium">{trigger.intensity}/10</span>
                        </div>
                        <p><span className="font-medium">Response:</span> {trigger.responsePattern}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="implications" className="mt-4">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-bold mb-4">Market Implications</h3>
                  <p className="whitespace-pre-line">{commentAnalysis.data.analysis.marketImplications}</p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {commentAnalysis?.error || "Failed to generate analysis. Please try again."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YouTubeVideos;