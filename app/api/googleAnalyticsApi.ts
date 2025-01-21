export interface GoogleResult {
  title: string;
  snippet: string;
  link: string;
}

export interface AnalyticsSummary {
  overview: string;
  trends: {
    title: string;
    description: string;
    percentage: number;
  }[];
  competitors: {
    name: string;
    strength: string;
    score: number;
  }[];
  opportunities: string[];
}

export const fetchGoogleResults = async (
  query: string
): Promise<{ results: GoogleResult[]; summary: AnalyticsSummary } | null> => {
  try {
    const searchApiKey = process.env.lNEXT_PUBLIC_GOOGLE_API_KEY;
    const searchEngineId = process.env.lNEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    const groqApiKey = process.env.lNEXT_PUBLIC_GGROQ_API_KEY;

    if (!searchApiKey || !searchEngineId || !groqApiKey) {
      throw new Error("API keys are missing. Check environment variables.");
    }

    // Fetch Google Search results
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`Google Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    const results: GoogleResult[] = searchData.items.map((item: any) => ({
      title: item.title || "No title available",
      snippet: item.snippet || "No snippet available",
      link: item.link || "#",
    }));

    if (results.length === 0) {
      throw new Error("No results found from Google Search API.");
    }

    // Groq API prompt for structured analysis
    const context = `You are a marketing analyst. Analyze these search results and provide a structured analysis in the following JSON format:
    {
      "overview": "A brief HTML-formatted overview of the main findings",
      "trends": [
        {
          "title": "Trend name",
          "description": "HTML-formatted description",
          "percentage": number (0-100)
        }
      ],
      "competitors": [
        {
          "name": "Competitor name",
          "strength": "HTML-formatted strength description",
          "score": number (0-100)
        }
      ],
      "opportunities": [
        "HTML-formatted opportunity description"
      ]
    }

    Ensure all text fields contain properly formatted HTML with appropriate tags (<p>, <strong>, <em>, etc.).
    Limit to 3 trends, 3 competitors, and 3 opportunities.
    Base percentages and scores on the frequency and prominence of mentions in the search results.`;

    const summaryResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: context },
          { role: "user", content: JSON.stringify(results.slice(0, 5)) },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Groq API error: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const content = summaryData.choices[0].message.content;

    // Validate JSON before parsing
    let summary: AnalyticsSummary;
    try {
      summary = JSON.parse(content);
    } catch (jsonError) {
      console.error("Invalid JSON response from Groq API:", content);
      throw new Error("Failed to parse summary response as JSON.");
    }

    return { results, summary };
  } catch (error) {
    console.error("Error in fetchGoogleResults:", error);
    return null;
  }
};
