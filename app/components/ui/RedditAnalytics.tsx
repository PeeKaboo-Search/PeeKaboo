import React, { useState, useEffect } from 'react';
import { RedditAnalysisService } from 'app/api/redditAnalysis';

interface RedditAnalysisProps {
  query: string;
  className?: string;
}

interface AnalysisState {
  loading: boolean;
  error?: string;
  data?: {
    analysis: string;
    rawPosts: Array<{
      title: string;
      subreddit: string;
      upvotes: number;
      comments: number;
      body: string;
    }>;
    timestamp: string;
  };
}

const RedditAnalysis: React.FC<RedditAnalysisProps> = ({ query, className = '' }) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    loading: false,
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      setAnalysisState({ loading: true });

      try {
        const result = await RedditAnalysisService.analyzeRedditData(query);

        if (result.success && 'data' in result) {
          setAnalysisState({
            loading: false,
            data: result.data,
          });
        } else {
          setAnalysisState({
            loading: false,
            error: result.error,
          });
        }
      } catch (error) {
        setAnalysisState({
          loading: false,
          error: 'Failed to analyze Reddit data',
        });
      }
    };

    if (query) {
      fetchAnalysis();
    }
  }, [query]);

  if (analysisState.loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (analysisState.error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="text-red-500">Error: {analysisState.error}</div>
      </div>
    );
  }

  if (!analysisState.data) {
    return null;
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
      <div className="space-y-6">
        {/* Analysis Section */}
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: analysisState.data.analysis }}
        />

        {/* Raw Data Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Source Posts</h3>
          <div className="space-y-4">
            {analysisState.data.rawPosts.map((post, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium text-lg">{post.title}</h4>
                <div className="text-sm text-gray-500 mt-1">
                  r/{post.subreddit} • {post.upvotes} upvotes • {post.comments} comments
                </div>
                {post.body && (
                  <p className="mt-2 text-gray-700">{post.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-4">
          Last updated: {new Date(analysisState.data.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default RedditAnalysis;