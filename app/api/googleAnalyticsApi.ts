export interface GoogleResult {
  title: string;
  snippet: string;
  link: string;
}

export interface Trend {
  title: string;
  description: string;
  percentage: number;
}

export interface Competitor {
  name: string;
  strength: string;
  score: number;
}

export interface AnalyticsSummary {
  overview: string;
  trends: Trend[];
  competitors: Competitor[];
  opportunities: string[];
}

export const fetchGoogleResults = async (
  query: string
): Promise<{ results: GoogleResult[]; summary: AnalyticsSummary } | null> => {
  try {
    const searchApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const searchEngineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!searchApiKey || !searchEngineId || !groqApiKey) {
      throw new Error("API keys are missing. Check environment variables.");
    }

    // Fetch Google Search results
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`Google Search API error: ${searchResponse.status}`);
    }

    const searchData: { items: Array<{ title: string; snippet: string; link: string }> } = await searchResponse.json();
    const results: GoogleResult[] = searchData.items.map(item => ({
      title: item.title || "No title available",
      snippet: item.snippet || "No snippet available",
      link: item.link || "#",
    }));

    if (results.length === 0) {
      throw new Error("No results found from Google Search API.");
    }

    // Modified Groq API prompt for advertisement and research analysis
    const context = `You are an advertising research specialist. Analyze these search results and provide a structured analysis for creating effective advertisements in the following JSON format:
    {
      "overview": "A brief HTML-formatted overview analyzing market positioning and advertising potential",
      "trends": [
        {
          "title": "Advertising trend or consumer behavior pattern",
          "description": "HTML-formatted description of the trend's relevance to advertising",
          "percentage": number (0-100 indicating trend strength)
        }
      ],
      "competitors": [
        {
          "name": "Competitor brand/company",
          "strength": "HTML-formatted analysis of their advertising strategy",
          "score": number (0-100 based on advertising presence)
        }
      ],
      "opportunities": [
        "HTML-formatted advertising opportunity or campaign suggestion"
      ]
    }
    Ensure all text fields contain properly formatted HTML with appropriate tags (<p>, <strong>, <em>, etc.).
    Focus on advertising angles, messaging themes, and campaign opportunities.
    Analyze audience preferences, ad placement strategies, and messaging effectiveness.
    Limit to 3 trends, 3 competitors, and 3 opportunities.
    Base percentages and scores on advertising impact and market presence in the search results.`;

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

    const summaryData: { choices: Array<{ message: { content: string } }> } = await summaryResponse.json();
    const content = summaryData.choices[0].message.content;

    // Validate JSON before parsing
    const summary: AnalyticsSummary = JSON.parse(content);
    return { results, summary };
  } catch (error) {
    console.error("Error in fetchGoogleResults:", error);
    return null;
  }
};