"use client";
import React, { useEffect, useState, memo } from 'react';
import { 
  Loader2, 
  ChevronRight,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';
import { getAppReviews, analyzeAppReviews } from '@/app/api/playstoreAnalyticsApi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import type { Review, ReviewAnalysis } from '@/app/api/playstoreAnalyticsApi';

interface AppAnalysisProps {
  appId: string;
  appName: string;
  onBackToSelection: () => void;
}

// Format rating to display stars
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < fullStars 
              ? 'text-yellow-400 fill-yellow-400' 
              : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400 opacity-50'
                : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

// PainPoint card component
const PainPointCard = memo(({
  painPoint
}: {
  painPoint: {
    title: string;
    description: string;
    frequency: number;
    impact: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    possibleSolutions: string[];
  }
}) => {
  const sentimentColors = {
    positive: 'bg-green-500/20 text-green-600',
    negative: 'bg-red-500/20 text-red-600',
    neutral: 'bg-blue-500/20 text-blue-600',
    mixed: 'bg-purple-500/20 text-purple-600'
  };

  return (
    <Card className="pain-point-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">{painPoint.title}</h3>
          <Badge className={sentimentColors[painPoint.sentiment]}>
            {painPoint.sentiment}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{painPoint.description}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Frequency</p>
            <Progress value={painPoint.frequency * 10} className="h-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Impact</p>
            <Progress value={painPoint.impact * 10} className="h-2" />
          </div>
        </div>
        
        <div>
          <p className="text-xs font-medium mb-1">Possible Solutions:</p>
          <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
            {painPoint.possibleSolutions.map((solution, index) => (
              <li key={index}>{solution}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

PainPointCard.displayName = 'PainPointCard';

// Review card component
const ReviewCard = memo(({
  review
}: {
  review: Review & { sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed' }
}) => {
  const sentimentColors = {
    positive: 'bg-green-500/20 text-green-600',
    negative: 'bg-red-500/20 text-red-600',
    neutral: 'bg-blue-500/20 text-blue-600',
    mixed: 'bg-purple-500/20 text-purple-600'
  };

  return (
    <Card className="review-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <RatingStars rating={review.review_rating} />
            <p className="text-sm font-medium">{review.author_name}</p>
          </div>
          {review.sentiment && (
            <Badge className={sentimentColors[review.sentiment]}>
              {review.sentiment}
            </Badge>
          )}
        </div>
        
        <p className="text-sm mb-2">{review.review_text}</p>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <p>Version: {review.author_app_version}</p>
          <p>{new Date(review.review_timestamp * 1000).toLocaleDateString()}</p>
        </div>
        
        {review.app_developer_reply && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium mb-1">Developer Response:</p>
            <p className="text-xs">{review.app_developer_reply}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ReviewCard.displayName = 'ReviewCard';

// Feature request component
const FeatureRequestCard = memo(({
  feature
}: {
  feature: {
    feature: string;
    description: string;
    demand: number;
    businessValue: number;
    implementationComplexity: 'low' | 'medium' | 'high';
  }
}) => {
  const complexityColors = {
    low: 'bg-green-500/20 text-green-600',
    medium: 'bg-yellow-500/20 text-yellow-600',
    high: 'bg-red-500/20 text-red-600'
  };

  return (
    <Card className="feature-request-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">{feature.feature}</h3>
          <Badge className={complexityColors[feature.implementationComplexity]}>
            {feature.implementationComplexity} complexity
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">User Demand</p>
            <Progress value={feature.demand * 10} className="h-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Business Value</p>
            <Progress value={feature.businessValue * 10} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FeatureRequestCard.displayName = 'FeatureRequestCard';

const AppAnalysis: React.FC<AppAnalysisProps> = ({ appId, appName, onBackToSelection }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'painPoints' | 'features' | 'reviews'>('overview');

  // Fetch reviews and analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setReviewsLoading(true);
        setAnalysisLoading(true);
        setError(null);
        
        const appReviews = await getAppReviews(appId);
        setReviews(appReviews);
        
        const appAnalysis = await analyzeAppReviews(appId, appName);
        setAnalysis(appAnalysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load app data');
      } finally {
        setReviewsLoading(false);
        setAnalysisLoading(false);
      }
    };
    fetchData();
  }, [appId, appName]);

  // Handle retry for analysis
  const handleRetryAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setError(null);
      
      const appAnalysis = await analyzeAppReviews(appId, appName);
      setAnalysis(appAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper function to safely check array length with optional chaining
  const hasItems = (arr?: any[]): boolean => {
    return Array.isArray(arr) && arr.length > 0;
  };

  return (
    <div className="app-analysis-section space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={onBackToSelection}
          className="flex items-center gap-1"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Selection
        </Button>
        <h3 className="text-lg font-semibold">
          {appName} Analysis
        </h3>
      </div>
      
      {/* Tab Navigation */}
      {!reviewsLoading && !analysisLoading && analysis?.success && (
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('overview')}
            className={`rounded-none border-b-2 border-transparent pb-2 px-4 ${activeTab === 'overview' ? 'border-primary' : ''}`}
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === 'painPoints' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('painPoints')}
            className={`rounded-none border-b-2 border-transparent pb-2 px-4 ${activeTab === 'painPoints' ? 'border-primary' : ''}`}
          >
            Pain Points
          </Button>
          <Button 
            variant={activeTab === 'features' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('features')}
            className={`rounded-none border-b-2 border-transparent pb-2 px-4 ${activeTab === 'features' ? 'border-primary' : ''}`}
          >
            Feature Requests
          </Button>
          <Button 
            variant={activeTab === 'reviews' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('reviews')}
            className={`rounded-none border-b-2 border-transparent pb-2 px-4 ${activeTab === 'reviews' ? 'border-primary' : ''}`}
          >
            Reviews
          </Button>
        </div>
      )}
      
      {/* Loading states */}
      {(reviewsLoading || analysisLoading) && (
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing app reviews...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && !reviewsLoading && !analysisLoading && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Analysis Content */}
      {!reviewsLoading && !analysisLoading && analysis?.success && (
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Sentiment Overview */}
              <Card className="overflow-hidden border-2 border-primary/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Sentiment Analysis</h3>
                  <p className="text-muted-foreground mb-6">{analysis.data?.analysis.overview}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall sentiment */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Overall Sentiment</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-lg">
                          {analysis.data?.analysis.sentimentAnalysis.score.toFixed(1)}
                        </div>
                        <div>
                          <Badge className={`
                            ${analysis.data?.analysis.sentimentAnalysis.overall === 'positive' ? 'bg-green-500/20 text-green-600' : ''}
                            ${analysis.data?.analysis.sentimentAnalysis.overall === 'negative' ? 'bg-red-500/20 text-red-600' : ''}
                            ${analysis.data?.analysis.sentimentAnalysis.overall === 'neutral' ? 'bg-blue-500/20 text-blue-600' : ''}
                            ${analysis.data?.analysis.sentimentAnalysis.overall === 'mixed' ? 'bg-purple-500/20 text-purple-600' : ''}
                          `}>
                            {analysis.data?.analysis.sentimentAnalysis.overall}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sentiment distribution */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Sentiment Distribution</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Positive</span>
                            <span>{analysis.data?.analysis.sentimentAnalysis.distribution.positive}%</span>
                          </div>
                          <Progress value={analysis.data?.analysis.sentimentAnalysis.distribution.positive} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Neutral</span>
                            <span>{analysis.data?.analysis.sentimentAnalysis.distribution.neutral}%</span>
                          </div>
                          <Progress value={analysis.data?.analysis.sentimentAnalysis.distribution.neutral} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Negative</span>
                            <span>{analysis.data?.analysis.sentimentAnalysis.distribution.negative}%</span>
                          </div>
                          <Progress value={analysis.data?.analysis.sentimentAnalysis.distribution.negative} className="h-2" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Key trends */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Trends</h4>
                      <div className="space-y-3">
                        {analysis.data?.analysis.sentimentAnalysis.trends.map((trend, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`
                                ${trend.sentiment === 'positive' ? 'bg-green-500/20 text-green-600' : ''}
                                ${trend.sentiment === 'negative' ? 'bg-red-500/20 text-red-600' : ''}
                                ${trend.sentiment === 'neutral' ? 'bg-blue-500/20 text-blue-600' : ''}
                                ${trend.sentiment === 'mixed' ? 'bg-purple-500/20 text-purple-600' : ''}
                              `}>
                                {trend.sentiment}
                              </Badge>
                              <span className="text-sm">{trend.topic}</span>
                            </div>
                            <span className="text-xs font-medium">
                              Intensity: {trend.intensity}/10
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* User Experiences */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">User Experiences</h3>
                  <div className="space-y-4">
                    {analysis.data?.analysis.userExperiences.map((experience, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{experience.scenario}</h4>
                          <Badge className={`
                            ${experience.sentiment === 'positive' ? 'bg-green-500/20 text-green-600' : ''}
                            ${experience.sentiment === 'negative' ? 'bg-red-500/20 text-red-600' : ''}
                            ${experience.sentiment === 'neutral' ? 'bg-blue-500/20 text-blue-600' : ''}
                            ${experience.sentiment === 'mixed' ? 'bg-purple-500/20 text-purple-600' : ''}
                          `}>
                            {experience.sentiment}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{experience.impact}</p>
                        <p className="text-xs text-muted-foreground">Pattern: {experience.frequencyPattern}</p>
                        
                        {/* Added user quotes */}
                        {hasItems(experience.userQuotes) && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-medium mb-1">User Quotes:</p>
                            <div className="max-h-28 overflow-y-auto">
                              {experience.userQuotes?.map((quote, i) => (
                                <p key={i} className="text-xs italic text-muted-foreground mb-1">"{quote}"</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Market Implications & Recommendations */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-3">Market Implications</h3>
                      <div className="flex items-start gap-4">
                        <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                        <p className="text-muted-foreground">{analysis.data?.analysis.marketImplications}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-3">Actionable Recommendations</h3>
                      <ul className="space-y-2 pl-4 list-disc">
                        {analysis.data?.analysis.actionableRecommendations.map((recommendation, index) => (
                          <li key={index} className="text-muted-foreground">
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Added competitive analysis - Fixed the TypeScript error by using optional chaining */}
                    {hasItems(analysis.data?.analysis.competitiveAnalysis.comparisonMentions) && (
                      <div>
                        <h3 className="text-xl font-bold mb-3">Competitive Analysis</h3>
                        <div className="space-y-3">
                          {analysis.data?.analysis.competitiveAnalysis.comparisonMentions.map((mention, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                              <Badge className={`
                                ${mention.sentiment === 'positive' ? 'bg-green-500/20 text-green-600' : ''}
                                ${mention.sentiment === 'negative' ? 'bg-red-500/20 text-red-600' : ''}
                                ${mention.sentiment === 'neutral' ? 'bg-blue-500/20 text-blue-600' : ''}
                              `}>
                                {mention.sentiment}
                              </Badge>
                              <div>
                                <p className="font-medium">{mention.competitor}</p>
                                <p className="text-sm text-muted-foreground">{mention.context}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Pain Points Tab */}
          {activeTab === 'painPoints' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Key Pain Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.data?.analysis.painPoints.map((painPoint, index) => (
                  <PainPointCard key={index} painPoint={painPoint} />
                ))}
              </div>
              
              {/* Version Trends - Fixed TypeScript errors with optional chaining and hasItems helper */}
              {(hasItems(analysis.data?.analysis.versionTrends.improvementAreas) || 
                hasItems(analysis.data?.analysis.versionTrends.regressedFeatures)) && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Version Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Improved Areas</h4>
                        {hasItems(analysis.data?.analysis.versionTrends.improvementAreas) ? (
                          <ul className="space-y-1 pl-4 list-disc">
                            {analysis.data?.analysis.versionTrends.improvementAreas.map((area, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{area}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No improvements detected</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Regressed Features</h4>
                        {hasItems(analysis.data?.analysis.versionTrends.regressedFeatures) ? (
                          <ul className="space-y-1 pl-4 list-disc">
                            {analysis.data?.analysis.versionTrends.regressedFeatures.map((feature, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{feature}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No regressions detected</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Feature Requests Tab */}
          {activeTab === 'features' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Feature Requests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.data?.analysis.featureRequests.map((feature, index) => (
                  <FeatureRequestCard key={index} feature={feature} />
                ))}
              </div>
              
              {/* Competitive Advantage Gaps - Fixed TypeScript error with hasItems helper */}
              {hasItems(analysis.data?.analysis.competitiveAnalysis.advantageGaps) && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Competitive Advantage Gaps</h3>
                    <ul className="space-y-2 pl-4 list-disc">
                      {analysis.data?.analysis.competitiveAnalysis.advantageGaps.map((gap, index) => (
                        <li key={index} className="text-muted-foreground">{gap}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Recent Reviews</h3>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.slice(0, 10).map((review) => (
                    <ReviewCard 
                      key={review.review_id} 
                      review={{
                        ...review,
                        sentiment: analysis?.data?.sources.find(source => 
                          source.content === review.review_text
                        )?.sentiment
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 flex items-center justify-center">
                  <p className="text-muted-foreground">No reviews available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Error or no analysis available */}
      {!reviewsLoading && !analysisLoading && !analysis?.success && (
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {analysis?.error || "Couldn't load analysis. Please try again."}
            </p>
            <Button 
              onClick={handleRetryAnalysis} 
              variant="outline" 
              className="mt-4"
            >
              Retry Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AppAnalysis);