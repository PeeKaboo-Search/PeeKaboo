import React, { useState } from "react";
import axios from "axios";

interface NewsResultsProps {
  query: string;
}

const NewsResults: React.FC<NewsResultsProps> = ({ query }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNewsResults = async () => {
    setLoading(true);
    setError("");

    try {
      // Adjusted API path
      const response = await axios.post(`/api/analyzeNews`, { query });
      setResults(response.data.articles);
    } catch (err) {
      console.error("Error fetching news results:", err);
      setError("Failed to fetch news results. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (query) fetchNewsResults();
  }, [query]);

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">News Results</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((article, index) => (
            <div key={index} className="p-4 bg-gray-100 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-700">{article.title}</h3>
              <p className="text-sm text-gray-600">{article.description}</p>
              <span className="text-xs text-gray-500">{article.source}</span>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm mt-2 block"
              >
                Read more
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No results found for "{query}".</p>
      )}
    </div>
  );
};

export default NewsResults;
