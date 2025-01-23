'use client';

import React, { useState, useCallback } from 'react';

interface Trend {
  title: string;
  description: string;
  percentage: number;
}

interface Competitor {
  name: string;
  strength: string;
  score: number;
}

interface AnalyticsSummary {
  overview: string;
  trends: Trend[];
  competitors: Competitor[];
  opportunities: string[];
}

interface SummaryProps {
  query?: string;
}

const Summary: React.FC<SummaryProps> = ({ query = '' }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || 'Failed to fetch summary');
      }

      // Attempt to parse the response
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parsing Error:', responseText);
        throw new Error('Failed to parse server response');
      }

      // Validate the parsed data structure
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure all required fields exist
      if (!parsedData.overview || 
          !Array.isArray(parsedData.trends) || 
          !Array.isArray(parsedData.competitors) || 
          !Array.isArray(parsedData.opportunities)) {
        throw new Error('Incomplete analysis data');
      }

      setSummary(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Market Analysis</h2>
      
      {isLoading ? (
        <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">Generating market analysis... Please wait.</span>
        </div>
      ) : error ? (
        <div className="mt-4 text-red-500">
          <h3 className="font-semibold">Error Generating Analysis</h3>
          <p>{error}</p>
          <button 
            onClick={fetchSummary} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Analysis
          </button>
        </div>
      ) : summary ? (
        <div>
          <div 
            className="text-gray-700 mb-4" 
            dangerouslySetInnerHTML={{ __html: summary.overview }}
          />

          {summary.trends.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Market Trends</h3>
              <ul className="space-y-2">
                {summary.trends.map((trend, index) => (
                  <li key={index} className="bg-gray-100 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-900">{trend.title}</h4>
                      <span className="text-sm text-gray-600">{trend.percentage}%</span>
                    </div>
                    <div 
                      className="text-gray-700 text-sm" 
                      dangerouslySetInnerHTML={{ __html: trend.description }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.competitors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Competitor Analysis</h3>
              <ul className="space-y-2">
                {summary.competitors.map((competitor, index) => (
                  <li key={index} className="bg-gray-100 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-900">{competitor.name}</h4>
                      <span className="text-sm text-gray-600">Score: {competitor.score}/100</span>
                    </div>
                    <div 
                      className="text-gray-700 text-sm" 
                      dangerouslySetInnerHTML={{ __html: competitor.strength }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.opportunities.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Opportunities</h3>
              <ul className="list-disc list-inside space-y-1">
                {summary.opportunities.map((opportunity, index) => (
                  <li 
                    key={index} 
                    className="text-gray-700" 
                    dangerouslySetInnerHTML={{ __html: opportunity }}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <button 
            onClick={fetchSummary} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Market Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default Summary;