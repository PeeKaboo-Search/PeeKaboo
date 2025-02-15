import React, { useEffect, useState } from "react";
import { AppAnalytics, fetchPlayStoreAnalytics } from "@/app/api/playstoreAnalyticsApi";
import { Star, MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";

interface PlayStoreAnalyticsProps {
  appName: string;
}

export const PlayStoreAnalytics: React.FC<PlayStoreAnalyticsProps> = ({ appName }) => {
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlayStoreAnalytics(appName);
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (appName) {
      fetchData();
    }
  }, [appName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{analytics.appName}</CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {analytics.overallRating.toFixed(1)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {analytics.totalReviews.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8">
            {/* Insights Section */}
            <section className="space-y-4">
              <h3 className="font-semibold text-lg">Key Insights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analytics.insights.positiveHighlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-green-600">
                        Positive Highlights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analytics.insights.positiveHighlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ThumbsUp className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-sm">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analytics.insights.negativeComplaints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-red-600">
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analytics.insights.negativeComplaints.map((complaint, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ThumbsDown className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-sm">{complaint}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="space-y-4">
              <h3 className="font-semibold text-lg">Recent Reviews</h3>
              <div className="space-y-4">
                {analytics.topReviews.map((review, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{review.username}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {review.rating}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayStoreAnalytics;