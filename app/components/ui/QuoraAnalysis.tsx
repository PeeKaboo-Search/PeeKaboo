import React, { useState, useEffect } from 'react';
import { QuoraAnalysisService } from '@/app/api/quoraAnalytics';

interface QuoraAnswer {
  content: string;
  author: {
    name: string;
    profile_url: string;
    credentials: string;
  };
  post_url: string;
  upvotes: number;
  timestamp: string;
}

interface AnalysisData {
  analysis: string;
  sources: QuoraAnswer[];
  timestamp: string;
}

interface QuoraAnalyticsProps {
  query: string;
  className?: string;
  answerMaxLength?: number;
}

const truncateText = (text: string, maxLength: number = 200): string => {
  if (!text) return '';
  return text.length <= maxLength 
    ? text 
    : text.substring(0, maxLength) + '...';
};

const AnswerCard = ({ answer, maxLength }: { answer: QuoraAnswer; maxLength: number }) => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-4">
    <div className="text-gray-700 mb-3">
      {truncateText(answer.content, maxLength)}
    </div>
    <div className="flex items-center justify-between text-sm">
      <div className="flex flex-col">
        <a 
          href={answer.author.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          By: {answer.author.name}
        </a>
        {answer.author.credentials && (
          <span className="text-xs text-gray-500">{answer.author.credentials}</span>
        )}
      </div>
      <div className="flex items-center space-x-4 text-gray-600">
        <span>👍 {answer.upvotes}</span>
      </div>
    </div>
    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
      <span>{new Date(answer.timestamp).toLocaleDateString()}</span>
      <a 
        href={answer.post_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        View on Quora →
      </a>
    </div>
  </div>
);

export default function QuoraAnalytics({ 
  query, 
  className = '', 
  answerMaxLength = 300 
}: QuoraAnalyticsProps) {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    data?: AnalysisData;
  }>({
    loading: true
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!query) return;

      setState(prev => ({ ...prev, loading: true }));

      try {
        const result = await QuoraAnalysisService.analyzeQuoraData(query);
        
        if (result.success && result.data) {
          setState({
            loading: false,
            data: result.data
          });
        } else {
          setState({
            loading: false,
            error: result.error || 'Unknown error occurred'
          });
        }
      } catch (error) {
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to analyze Quora data'
        });
      }
    };

    fetchAnalysis();
  }, [query]);

  if (state.loading) {
    return (
      <div className={`flex justify-center items-center min-h-[200px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Analyzing Quora discussions...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h2 className="text-red-800 text-lg font-semibold mb-2">Analysis Error</h2>
        <p className="text-red-600">{state.error}</p>
      </div>
    );
  }

  if (!state.data) {
    return null;
  }

  const { data } = state;

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Insights from Quora</h2>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: data.analysis }}
        />
      </section>

      {/* Answers Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Top Answers</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.sources.map((answer, index) => (
            <AnswerCard 
              key={`answer-${index}`}
              answer={answer}
              maxLength={answerMaxLength}
            />
          ))}
        </div>
      </section>

      {/* Timestamp */}
      <div className="text-sm text-gray-500 text-right">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}