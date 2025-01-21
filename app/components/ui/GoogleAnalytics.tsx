"use client";
import React, { useEffect, useState } from "react";
import { fetchGoogleResults, GoogleResult, AnalyticsSummary } from "app/api/googleAnalyticsApi";
import { Card, CardHeader, CardTitle, CardContent } from "app/components/ui/card";
import { Alert, AlertDescription } from "app/components/ui/alert";
import { Progress } from "app/components/ui/progress";
import { TrendingUp, Award, Lightbulb } from "lucide-react";

interface GoogleAnalyticsProps {
  query: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ query }) => {
  const [results, setResults] = useState<GoogleResult[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim()) {
        setError("Please provide a search query");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchGoogleResults(query);
        
        if (data) {
          setResults(data.results);
          setSummary(data.summary);
          setError(null);
        } else {
          setError("No results found for this query");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Market Analysis: {query}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : summary ? (
          <div className="space-y-8">
            {/* Overview Section */}
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: summary.overview }} />
            </div>

            {/* Trends Section */}
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" />
                Market Trends
              </h3>
              <div className="space-y-4">
                {summary.trends.map((trend, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{trend.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: trend.description }} />
                    <Progress value={trend.percentage} className="mt-2" />
                    <span className="text-sm text-gray-500 mt-1">
                      Trend Strength: {trend.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitors Section */}
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Award className="w-5 h-5" />
                Competitor Analysis
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {summary.competitors.map((competitor, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{competitor.name}</h4>
                    <div dangerouslySetInnerHTML={{ __html: competitor.strength }} />
                    <Progress value={competitor.score} className="mt-2" />
                    <span className="text-sm text-gray-500 mt-1">
                      Market Presence: {competitor.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities Section */}
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" />
                Market Opportunities
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {summary.opportunities.map((opportunity, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div dangerouslySetInnerHTML={{ __html: opportunity }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Search Results Section */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Source Data</h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <a
                    key={index}
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="text-blue-600 font-medium mb-1">
                      {result.title}
                    </h4>
                    <p className="text-gray-600 text-sm">{result.snippet}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default GoogleAnalytics;