// NewsResult.tsx
import React from "react";
import { useState, useEffect } from "react";

interface NewsResultProps {
  query: string;
}

interface NewsItem {
  title: string;
  url: string;
  content: string;
  published_date: string;
  source: string;
}

interface NewsResponse {
  results: NewsItem[];
}

const NewsResult: React.FC<NewsResultProps> = ({ query }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Directly fetch from Tavily API with public key
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TAVILY_API_KEY}`
          },
          body: JSON.stringify({
            query: query,
            max_results: 3,
            search_depth: "news"
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data: NewsResponse = await response.json();
        setNews(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('News fetch error:', err);
      } finally {
        setLoading(false);
      }
    }; 

    fetchNews();
  }, [query]);

  if (loading) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        News Results for "{query}"
      </h2>
      <div className="space-y-6">
        {news.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
            <h3 className="text-lg font-medium text-gray-900">
              <a href={item.url} target="_blank" rel="noopener noreferrer" 
                 className="hover:text-blue-600 transition-colors">
                {item.title}
              </a>
            </h3>
            <p className="text-gray-600 mt-2">{item.content}</p>
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
              <span>{item.source}</span>
              <span>{new Date(item.published_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {news.length === 0 && !loading && (
          <p className="text-gray-500">No news found for "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default NewsResult;