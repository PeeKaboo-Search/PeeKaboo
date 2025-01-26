import React, { useState, useEffect } from "react";

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
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TAVILY_API_KEY}`,
          },
          body: JSON.stringify({
            query,
            max_results: 3,
            search_depth: "news",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data: NewsResponse = await response.json();
        setNews(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("News fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [query]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-3/4"></div>
          <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-1/2"></div>
          <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <p className="text-[var(--color-competitors-rose)] font-medium">
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-[1.75rem] font-semibold mb-4 text-[var(--color-primary-blue)]">
        News Results for &quot;<span className="text-white">{query}</span>&quot;
      </h2>
      <div className="space-y-6">
        {news.map((item, index) => (
          <div
            key={index}
            className="pb-4 border-b-[1px] border-[rgba(255,255,255,0.1)] last:border-0"
          >
            <h3 className="text-lg font-semibold text-white">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-primary-blue)] transition-colors"
              >
                {item.title}
              </a>
            </h3>
            <p className="text-[rgba(255,255,255,0.7)] mt-2">{item.content}</p>
            <div className="mt-2 text-sm text-[rgba(255,255,255,0.5)] flex items-center gap-4">
              <span>{item.source}</span>
              <span>{new Date(item.published_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {news.length === 0 && !loading && (
          <p className="text-[rgba(255,255,255,0.6)]">
            No news found for &quot;<span className="text-white">{query}</span>&quot;
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsResult;