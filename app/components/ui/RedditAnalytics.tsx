import React, { useState, useEffect } from 'react';
import { RedditAnalysisService } from 'app/api/redditAnalysis';
import { RedditPost } from 'app/types/index';
import '@/app/styles/reddit-analysis.css';

// Extended interfaces with improved type definitions
interface ExtendedRedditPost extends RedditPost {
  sentiment?: number;
}

interface RedditAnalysisResponse {
  success: boolean;
  data?: {
    analysis: string;
    themes?: string[];
    rawPosts: ExtendedRedditPost[];
    timestamp: string;
  };
  error?: string;
}

interface RedditAnalysisProps {
  query: string;
  className?: string;
  postBodyMaxLength?: number;
}

interface AnalysisState {
  loading: boolean;
  error?: string;
  data?: {
    analysis: string;
    themes: string[];
    rawPosts: ExtendedRedditPost[];
    timestamp: string;
  };
}

// Utility function to truncate text
const truncateText = (text: string, maxLength: number = 200): string => {
  if (!text) return '';
  return text.length <= maxLength 
    ? text 
    : text.substring(0, maxLength) + '...';
};

// Sentiment Indicator Component
const SentimentIndicator: React.FC<{ sentiment?: number }> = ({ sentiment = 0 }) => {
  const normalizedSentiment = Math.max(-1, Math.min(1, sentiment));
  const position = ((normalizedSentiment + 1) / 2) * 100;

  return (
    <div className="sentiment-indicator-wrapper">
      <div 
        className="sentiment-indicator" 
        style={{
          background: `linear-gradient(to right, 
            #FF6B6B ${position < 50 ? position : 50}%, 
            #4ADE80 ${position > 50 ? position : 50}%)`
        }}
      >
        <span 
          className="sentiment-marker" 
          style={{ 
            left: `${position}%`,
          }} 
        />
      </div>
    </div>
  );
};

// Themes Display Component
const ThemesDisplay: React.FC<{ themes?: string[] }> = ({ themes = [] }) => {
  if (themes.length === 0) return null;

  return (
    <div className="themes-container">
      <h3>Key Themes</h3>
      <div className="themes-grid">
        {themes.map((theme, index) => (
          <div 
            key={`theme-${index}`} 
            className="theme-chip"
          >
            {theme}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Reddit Analytics Component
const RedditAnalytics: React.FC<RedditAnalysisProps> = ({ 
  query, 
  className = '', 
  postBodyMaxLength = 200 
}) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    loading: true,
    data: undefined
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!query) return;

      setAnalysisState(prev => ({ ...prev, loading: true }));

      try {
        const result: RedditAnalysisResponse = await RedditAnalysisService.analyzeRedditData(query);
        
        if (result.success && result.data) {
          setAnalysisState({
            loading: false,
            data: {
              analysis: result.data.analysis || '',
              themes: result.data.themes || [],
              rawPosts: result.data.rawPosts || [],
              timestamp: result.data.timestamp || new Date().toISOString()
            }
          });
        } else {
          setAnalysisState({
            loading: false,
            error: result.error || 'Unknown error occurred',
            data: undefined
          });
        }
      } catch (error) {
        setAnalysisState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to analyze Reddit data',
          data: undefined
        });
      }
    };

    fetchAnalysis();
  }, [query]);

  // Loading State
  if (analysisState.loading) {
    return (
      <div className={`reddit-analytics-loader ${className}`}>
        <div className="loader-content">
          <div className="spinner" />
          <p>Analyzing Reddit data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (analysisState.error) {
    return (
      <div className={`reddit-analytics-error ${className}`}>
        <div className="error-container">
          <h2>Analysis Error</h2>
          <p>{analysisState.error}</p>
        </div>
      </div>
    );
  }

  // Ensure data is defined before rendering
  if (!analysisState.data) {
    return null;
  }

  const { data } = analysisState;

  return (
    <div className="reddit-analytics-container">
      {/* Analysis Overview */}
      <section className="analysis-overview">
        <h2>Reddit Analysis</h2>
        <div 
          className="analysis-content" 
          dangerouslySetInnerHTML={{ __html: data.analysis }}
        />
      </section>

      {/* Themes */}
      <ThemesDisplay themes={data.themes} />

      {/* Posts Section */}
      <section className="posts-section">
        <h2>Source Posts</h2>
        <div className="posts-grid">
          {data.rawPosts.map((post, index) => (
            <article 
              key={`post-${index}`} 
              className="post-card"
            >
              <header className="post-header">
                <h3>{truncateText(post.title, 100)}</h3>
                <span className="post-subreddit">
                  r/{post.subreddit}
                </span>
              </header>

              <SentimentIndicator sentiment={post.sentiment} />

              <div className="post-stats">
                <div className="stat upvotes">
                  <span>↑ {post.upvotes}</span>
                </div>
                <div className="stat comments">
                  <span>💬 {post.comments}</span>
                </div>
              </div>

              {/* Ensure body is visible with truncated text */}
              {post.body && (
                <div className="post-body-container">
                  <p className="post-body">
                    {truncateText(post.body, postBodyMaxLength)}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Timestamp */}
      <div className="analysis-timestamp">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default RedditAnalytics;