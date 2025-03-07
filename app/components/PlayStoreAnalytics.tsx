"use client";
import React, { useEffect, useState } from "react";
import { fetchPlayStoreAnalytics, AppAnalytics, AppReview } from "@/app/api/playstoreAnalyticsApi";
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  TrendingUp 
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import "@/app/styles/PlayStoreAnalytics.css";

interface PlayStoreAnalyticsProps {
  query: string;
}

const PlayStoreAnalytics: React.FC<PlayStoreAnalyticsProps> = ({ query }) => {
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>("");

  useEffect(() => {
    const extractAppName = (queryString: string) => {
      const words = queryString.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
      
      const ignoreWords = [
        'app', 'store', 'play', 'android', 'mobile', 
        'application', 'review', 'reviews', 
        'analytics', 'performance'
      ];

      const appNameCandidate = words.find(word => 
        word.length > 2 && 
        !ignoreWords.includes(word.toLowerCase())
      );

      return appNameCandidate || words[0] || 'App';
    };

    const fetchData = async () => {
      if (!query.trim()) {
        setError("Please provide an app name");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const extractedAppName = extractAppName(query);
        setAppName(extractedAppName);

        const result = await fetchPlayStoreAnalytics(extractedAppName);
        if (result) {
          setAnalytics(result);
          setError(null);
        } else {
          setError(`Could not fetch analytics for ${extractedAppName}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return (
      <div className="analytics-loader">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="analytics-loader__item" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  if (!analytics) return null;

  const renderRatingSection = () => (
    <section className="analytics-section rating">
      <h2>
        <Star className="section-icon" />
        App Rating
      </h2>
      <div className="rating-container glass-card">
        <div className="rating-bar flex items-center space-x-2">
          <Progress 
            value={(analytics.overallRating / 5) * 100} 
            className="w-full h-2 bg-gray-200" 
          />
          <span className="text-lg font-bold">{analytics.overallRating.toFixed(1)}/5</span>
        </div>
        <p className="text-white mt-2">Total Reviews: {analytics.totalReviews}</p>
      </div>
    </section>
  );

  const renderInsightsSection = () => (
    <section className="analytics-section insights">
      <h2>
        <TrendingUp className="section-icon" />
        App Insights
      </h2>
      <div className="analytics-grid">
        <div className="analytics-card glass-card positive-highlights">
          <h3 className="flex items-center">
            <ThumbsUp className="mr-2 text-white" /> 
            Positive Highlights
          </h3>
          {renderInsightsList(
            analytics.insights.positiveHighlights, 
            'No positive highlights found'
          )}
        </div>

        <div className="analytics-card glass-card negative-complaints">
          <h3 className="flex items-center">
            <ThumbsDown className="mr-2 text-white" /> 
            Common Complaints
          </h3>
          {renderInsightsList(
            analytics.insights.negativeComplaints, 
            'No common complaints found'
          )}
        </div>

        <div className="analytics-card glass-card feature-suggestions">
          <h3 className="flex items-center">
            <MessageCircle className="mr-2 text-white" /> 
            Feature Suggestions
          </h3>
          {renderInsightsList(
            analytics.insights.featureSuggestions, 
            'No feature suggestions found'
          )}
        </div>
      </div>
    </section>
  );

  const renderInsightsList = (items: string[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0) {
      return <p className="text-white">{emptyMessage}</p>;
    }

    return (
      <ul className="list-disc pl-4">
        {items.slice(0, 5).map((item, index) => (
          <li key={index} className="text-white">{item}</li>
        ))}
      </ul>
    );
  };

  const renderTopReviewsSection = () => (
    <section className="analytics-section top-reviews">
      <h2>
        <MessageCircle className="section-icon" /> 
        Top Reviews
      </h2>
      <div className="analytics-grid">
        {analytics.topReviews && analytics.topReviews.length > 0 ? (
          analytics.topReviews.map((review: AppReview, index: number) => (
            <div key={index} className="analytics-card glass-card review-card">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-white">{review.username || 'Anonymous User'}</h3>
                <div className="flex">
                  {[...Array(Math.round(review.rating))].map((_, i) => (
                    <Star key={i} className="text-yellow-500 w-4 h-4" />
                  ))}
                  {[...Array(5 - Math.round(review.rating))].map((_, i) => (
                    <Star key={`empty-${i}`} className="text-gray-300 w-4 h-4" />
                  ))}
                </div>
              </div>
              <p className="text-white mb-2">{review.comment || 'No comment provided'}</p>
              <div className="text-sm text-white">{review.date || 'Date not available'}</div>
            </div>
          ))
        ) : (
          <p className="text-white">No reviews available</p>
        )}
      </div>
    </section>
  );

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Play Store Analytics</h1>
        <p className="query-text">Analysis for: {appName}</p>
      </header>

      <div className="analytics-content">
        {renderRatingSection()}
        {renderInsightsSection()}
        {renderTopReviewsSection()}
      </div>
    </div>
  );
};

export default PlayStoreAnalytics;