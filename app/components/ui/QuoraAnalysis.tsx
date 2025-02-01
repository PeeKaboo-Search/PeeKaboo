import React, { useState, useEffect } from 'react';
import { QuoraAnalysisService } from 'app/api/quoraAnalytics';
import { QuoraPost } from 'app/types/quora';

interface ExtendedQuoraPost extends QuoraPost {
  sentiment?: number;
}

interface QuoraAnalysisResponse {
  success: boolean;
  data?: {
    analysis: string;
    rawPosts: ExtendedQuoraPost[];
    timestamp: string;
  };
  error?: string;
}

interface QuoraAnalysisProps {
  query: string;
  className?: string;
  answerMaxLength?: number;
}

interface AnalysisState {
  loading: boolean;
  error?: string;
  data?: {
    analysis: string;
    rawPosts: ExtendedQuoraPost[];
    timestamp: string;
  };
}

const truncateText = (text: string, maxLength: number = 200): string => {
  if (!text) return '';
  return text.length <= maxLength 
    ? text 
    : text.substring(0, maxLength) + '...';
};

const SentimentIndicator: React.FC<{ sentiment?: number }> = ({ sentiment = 0 }) => {
  const normalizedSentiment = Math.max(-1, Math.min(1, sentiment));
  const position = ((normalizedSentiment + 1) / 2) * 100;

  return (
    <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden my-2">
      <div 
        className="relative w-full"
        style={{
          background: `linear-gradient(to right, 
            rgb(239, 68, 68) ${position < 50 ? position : 50}%, 
            rgb(34, 197, 94) ${position > 50 ? position : 50}%)`
        }}
      >
        <span 
          className="absolute w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
    </div>
  );
};

const AnswerCard: React.FC<{ 
  answer: ExtendedQuoraPost['topAnswer'],
  maxLength: number 
}> = ({ answer, maxLength }) => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-4">
    <div className="text-gray-700 mb-3">
      {truncateText(answer.text, maxLength)}
    </div>
    <div className="flex items-center justify-between text-sm">
      <a 
        href={answer.authorProfile}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        By: {answer.author}
      </a>
      <div className="flex items-center space-x-4 text-gray-600">
        <span>👍 {answer.upvotes}</span>
        <span>💬 {answer.numComments}</span>
      </div>
    </div>
    <div className="text-xs text-gray-500 mt-2">
      {new Date(answer.createdAt).toLocaleDateString()}
    </div>
  </div>
);

const QuoraAnalytics: React.FC<QuoraAnalysisProps> = ({ 
  query, 
  className = '', 
  answerMaxLength = 300 
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
        const result: QuoraAnalysisResponse = await QuoraAnalysisService.analyzeQuoraData(query);
        
        if (result.success && result.data) {
          setAnalysisState({
            loading: false,
            data: {
              analysis: result.data.analysis,
              rawPosts: result.data.rawPosts,
              timestamp: result.data.timestamp
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
          error: error instanceof Error ? error.message : 'Failed to analyze Quora data',
          data: undefined
        });
      }
    };

    fetchAnalysis();
  }, [query]);

  if (analysisState.loading) {
    return (
      <div className={`flex justify-center items-center min-h-[200px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Analyzing Quora discussions...</p>
        </div>
      </div>
    );
  }

  if (analysisState.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h2 className="text-red-800 text-lg font-semibold mb-2">Analysis Error</h2>
        <p className="text-red-600">{analysisState.error}</p>
      </div>
    );
  }

  if (!analysisState.data) {
    return null;
  }

  const { data } = analysisState;

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Quora Analysis</h2>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: data.analysis }}
        />
      </section>

      {/* Questions and Answers Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Top Questions & Answers</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.rawPosts.map((post, index) => (
            <article 
              key={`post-${index}`}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <header className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {truncateText(post.title, 100)}
                  </h3>
                  <a 
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View on Quora →
                  </a>
                </header>

                <SentimentIndicator sentiment={post.sentiment} />

                {/* Top Answer */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Top Answer</h4>
                  <AnswerCard 
                    answer={post.topAnswer}
                    maxLength={answerMaxLength}
                  />
                </div>

                {/* Additional Answers */}
                {post.additionalAnswers.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2">Additional Insights</h4>
                    {post.additionalAnswers.map((answer, idx) => (
                      <AnswerCard 
                        key={`additional-${idx}`}
                        answer={answer}
                        maxLength={answerMaxLength}
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Timestamp */}
      <div className="text-sm text-gray-500 text-right">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default QuoraAnalytics;