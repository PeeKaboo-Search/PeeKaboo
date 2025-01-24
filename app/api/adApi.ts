export interface GoogleResult {
  title: string;
  snippet: string;
  link: string;
}

export interface AdSpendingTrend {
  platform: string;
  description: string;
  spendingPercentage: number;
  averageCPC: number;
}

export interface TopAdvertiser {
  name: string;
  industryShare: string;
  adSpendingScore: number;
}

export interface AdSpendingAnalyticsSummary {
  overview: string;
  adSpendingTrends: AdSpendingTrend[];
  topAdvertisers: TopAdvertiser[];
  marketInsights: string[];
}

export interface GoogleSearchResponse {
  items: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
}

export interface GroqApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const fetchAdsSpendingAnalytics = async (
  query: string
): Promise<{ results: GoogleResult[]; summary: AdSpendingAnalyticsSummary } | null> => {
  try {
    const searchApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const searchEngineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!searchApiKey || !searchEngineId || !groqApiKey) {
      throw new Error("API keys are missing. Check environment variables.");
    }

    // Fetch Google Search results
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query + " digital advertising spending")}&num=5`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`Google Search API error: ${searchResponse.status}`);
    }

    const searchData: GoogleSearchResponse = await searchResponse.json();
    const results: GoogleResult[] = searchData.items.map(item => ({
      title: item.title || "No title available",
      snippet: item.snippet || "No snippet available",
      link: item.link || "#",
    }));

    if (results.length === 0) {
      throw new Error("No results found from Google Search API.");
    }

    // Groq API prompt for ads spending analysis
    const summaryResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: `You are a digital advertising spending analyst. Analyze these search results and provide a comprehensive analysis of digital advertising spending. 
            IMPORTANT: Always respond with a valid JSON in this EXACT format:
            {
              "overview": "HTML-formatted overview text",
              "adSpendingTrends": [
                {
                  "platform": "Platform Name",
                  "description": "HTML-formatted description",
                  "spendingPercentage": 45,
                  "averageCPC": 2.50
                }
              ],
              "topAdvertisers": [
                {
                  "name": "Advertiser Name",
                  "industryShare": "Description of market share",
                  "adSpendingScore": 75
                }
              ],
              "marketInsights": [
                "HTML-formatted insight 1",
                "HTML-formatted insight 2"
              ]
            }
            
            If you cannot generate valid data, use placeholder values.
            Ensure ALL fields are present.`,
          },
          {
            role: "user",
            content: JSON.stringify(results.slice(0, 5).map(r => ({ title: r.title, snippet: r.snippet }))),
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Groq API error: ${summaryResponse.status}`);
    }

    const summaryData: GroqApiResponse = await summaryResponse.json();
    const content = summaryData.choices[0].message.content;

    // Validate and parse JSON response
    let summary: AdSpendingAnalyticsSummary;
    try {
      // Log the raw content for debugging
      console.log("Raw JSON response:", content);

      // Attempt to parse the content, handling potential extra characters
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      summary = JSON.parse(cleanedContent);

      // Ensure all required fields exist with default values
      summary = {
        overview: summary.overview || "No overview available",
        adSpendingTrends: summary.adSpendingTrends || [
          {
            platform: "Default Platform",
            description: "No trends available",
            spendingPercentage: 0,
            averageCPC: 0,
          },
        ],
        topAdvertisers: summary.topAdvertisers || [
          {
            name: "Default Advertiser",
            industryShare: "No market share data",
            adSpendingScore: 0,
          },
        ],
        marketInsights: summary.marketInsights || ["No market insights available"],
      };
    } catch (jsonError) {
      console.error("JSON Parsing Error:", jsonError);
      console.error("Problematic Content:", content);

      // Provide a fallback summary
      summary = {
        overview: "Failed to generate analysis",
        adSpendingTrends: [
          {
            platform: "Analysis Failed",
            description: "Unable to retrieve trends",
            spendingPercentage: 0,
            averageCPC: 0,
          },
        ],
        topAdvertisers: [
          {
            name: "No Data",
            industryShare: "Analysis could not be completed",
            adSpendingScore: 0,
          },
        ],
        marketInsights: ["Unable to generate market insights"],
      };
    }

    return { results, summary };
  } catch (error) {
    console.error("Error in fetchAdsSpendingAnalytics:", error);
    return null;
  }
};
