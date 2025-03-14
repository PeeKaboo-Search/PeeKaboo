"use client";

import { useState, useEffect } from "react";

interface AppScraperProps {
  query: string; // This holds the appId
}

// Helper function to format install numbers (e.g., 100k, 1M, 30M)
function formatInstalls(installs: string | number | undefined): string {
  if (!installs) return "N/A";
  // Convert to string in case it's a number and remove non-digit characters if needed
  const installsStr = installs.toString();
  const numericValue = parseInt(installsStr.replace(/[^0-9]/g, ''), 10);
  if (numericValue >= 1000000) {
    return Math.floor(numericValue / 1000000) + "M";
  } else if (numericValue >= 1000) {
    return Math.floor(numericValue / 1000) + "k";
  }
  return String(numericValue);
}

// Enhanced function to analyze review texts using Groq API and generate a summary
const fetchReviewInsights = async (reviews: any[]): Promise<string> => {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_PLAYGROQ_API_KEY;
    if (!groqApiKey) throw new Error("Missing Groq API key");

    // 1. Smart review selection and processing
    const prioritizedReviews = reviews
      .filter(r => r.text?.trim().length > 20) // Filter out empty/short reviews
      .sort((a, b) => {
        // Prioritize recent reviews with detailed text
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA || b.text.length - a.text.length;
      });

    // 2. Dynamic content optimization
    const maxTotalTokens = 6000; // Conservative limit for system + user messages
    let tokenCount = 0;
    const selectedReviews = [];
    
    for (const review of prioritizedReviews.slice(0, 15)) { // Consider top 15 candidates
      const content = review.text
        .replace(/\s+/g, ' ') // Collapse whitespace
        .substring(0, 300); // Initial truncation

      // Simple token estimation (1 token ≈ 4 characters)
      const reviewTokens = Math.ceil(content.length / 4);
      if (tokenCount + reviewTokens > maxTotalTokens) break;
      
      selectedReviews.push(content);
      tokenCount += reviewTokens;
    }

    // 3. Optimized prompt structure
    const systemPrompt = `You are an expert analyst summarizing app reviews. Identify:
- Key positive/negative themes with emojis
- Frequent feature requests
- Sentiment trends
- Notable praise/criticism
Format with bold headings (**Positive Aspects**, **Areas for Improvement**) and bullet points. Keep insights concise.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768", // Higher token capacity
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: `Analyze these recent user reviews:\n\n${selectedReviews.join("\n\n")}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500, // Sufficient for detailed summary
        top_p: 0.9,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const result = await response.json();
    return result.choices[0]?.message?.content || "No summary generated";

  } catch (error) {
    console.error("Review analysis failed:", error);
    return "Summary unavailable - please try later";
  }
};

export default function AppScraper({ query }: AppScraperProps) {
  const [data, setData] = useState<any>(null);
  const [reviewSummary, setReviewSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch app details and reviews based on the appId (query prop)
  useEffect(() => {
    if (!query || query === "undefined") {
      setError("App ID is required");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/scrape?appId=${query}&lang=en&country=us`);
        if (!response.ok) {
          throw new Error("Failed to fetch app data");
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  // Analyze reviews once they're loaded to generate a summary
  useEffect(() => {
    if (data && data.reviews && data.reviews.length > 0) {
      fetchReviewInsights(data.reviews).then((insights) => {
        setReviewSummary(insights);
      });
    }
  }, [data]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12 text-lg text-gray-300 bg-black min-h-screen">
        Loading app data...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center py-12 text-lg text-red-500 bg-black min-h-screen">
        Error: {error}
      </div>
    );
  if (!data)
    return (
      <div className="flex items-center justify-center py-12 text-lg text-gray-300 bg-black min-h-screen">
        No data available
      </div>
    );

  // Format the updated date nicely
  const formattedDate = new Date(data.app.updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 bg-black text-gray-100 rounded-xl shadow-lg min-h-screen">
      {/* App Details */}
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-4">{data.app.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-semibold text-gray-300">Rating</p>
            <p className="text-gray-100">
              {data.app.rating && typeof data.app.rating === "number"
                ? data.app.rating.toFixed(1)
                : data.app.rating || "N/A"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Updated</p>
            <p className="text-gray-100">{formattedDate}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Installs</p>
            <p className="text-gray-100">{formatInstalls(data.app.installs)}</p>
          </div>
        </div>
      </div>

      {/* Review Summary Section */}
      {reviewSummary && (
        <div className="p-6 bg-black rounded-xl border border-gray-700">
          <h3 className="text-2xl font-semibold mb-4">Review Summary</h3>
          <p className="text-gray-200 whitespace-pre-line">{reviewSummary}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="p-6 bg-black rounded-xl border border-gray-700">
        <h3 className="text-2xl font-semibold mb-4">Reviews</h3>
        {data.reviews && data.reviews.length > 0 ? (
          <ul className="space-y-4">
            {data.reviews.map((review: any, index: number) => (
              <li key={index} className="border-b border-gray-700 pb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-gray-300">Rating:</span>
                  <span className="bg-blue-700 text-blue-300 px-2 py-1 rounded-md">
                    {review.score ? Number(review.score).toFixed(1) : "N/A"}
                  </span>
                </div>
                <div className="mb-1">
                  <span className="font-bold text-gray-300">User:</span> {review.userName}
                </div>
                <p className="text-gray-200">{review.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No reviews available</p>
        )}
      </div>
    </div>
  );
}
