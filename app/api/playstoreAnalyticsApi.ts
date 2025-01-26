import { z } from 'zod';

// Detailed Zod Schemas for Type Safety
export const AppReviewSchema = z.object({
  username: z.string().optional().default('Anonymous User'),
  rating: z.number().min(1).max(5).safe().default(3),
  comment: z.string().optional().default('No detailed comment provided'),
  date: z.string().optional().default(() => new Date().toISOString().split('T')[0])
});

export const AppAnalyticsSchema = z.object({
  appName: z.string().min(1, "App name must be provided").trim(),
  overallRating: z.number().min(1).max(5).safe().default(3),
  totalReviews: z.number().safe().min(0).default(0),
  topReviews: z.array(AppReviewSchema).max(5).default([]),
  insights: z.object({
    positiveHighlights: z.array(z.string()).max(5).default([]),
    negativeComplaints: z.array(z.string()).max(5).default([]),
    featureSuggestions: z.array(z.string()).max(5).default([])
  }).default({
    positiveHighlights: [],
    negativeComplaints: [],
    featureSuggestions: []
  })
});

export type AppReview = z.infer<typeof AppReviewSchema>;
export type AppAnalytics = z.infer<typeof AppAnalyticsSchema>;

// Interfaces for Search Results
interface GoogleSearchResult {
  title: string;
  snippet: string;
  link: string;
}

// Utility function to parse and clean app name
function parseAppQuery(query: string): string {
  const cleanQuery = query
    .replace(/\b(app|store|play|android|mobile|application|review|reviews)\b/gi, '')
    .trim();
  
  return cleanQuery.split(/\s+/)[0] || cleanQuery;
}

// Detailed, structured JSON template for Groq AI
const JSON_TEMPLATE = {
  appName: "Full App Name",
  overallRating: 4.5,
  totalReviews: 50000,
  topReviews: [
    {
      username: "TechFan92",
      rating: 5,
      comment: "Amazing app with incredible features and smooth performance!",
      date: "2024-01-15"
    },
    {
      username: "CasualUser",
      rating: 3,
      comment: "Good app, but needs more frequent updates.",
      date: "2024-02-01"
    }
  ],
  insights: {
    positiveHighlights: [
      "Intuitive user interface",
      "Regular feature updates",
      "Responsive customer support"
    ],
    negativeComplaints: [
      "Occasional performance lag",
      "Some features require in-app purchases",
      "Battery drain on older devices"
    ],
    featureSuggestions: [
      "Dark mode implementation",
      "More customization options",
      "Improved offline functionality"
    ]
  }
};

export const fetchPlayStoreAnalytics = async (query: string): Promise<AppAnalytics | null> => {
  try {
    // Validate API keys
    const searchApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const searchEngineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!searchApiKey || !searchEngineId || !groqApiKey) {
      throw new Error("Missing API keys. Configure environment variables.");
    }

    // Parse app name from query
    const appName = parseAppQuery(query);

    // Construct search query
    const searchQuery = `${appName} Play Store app reviews and ratings`;
    
    // Fetch Google Custom Search results
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', searchApiKey);
    searchUrl.searchParams.set('cx', searchEngineId);
    searchUrl.searchParams.set('q', searchQuery);
    searchUrl.searchParams.set('num', '5');

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      throw new Error(`Google Search API Error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // Extract and clean search results
    const searchResults: GoogleSearchResult[] = (searchData.items || [])
      .slice(0, 3)
      .map((item: any) => ({
        title: item.title || 'No Title',
        snippet: item.snippet || 'No Description',
        link: item.link || ''
      }));

    // Prepare AI prompt with context and JSON template
    const aiPrompt = `
TASK: Analyze Play Store app reviews for ${appName}

CONTEXT:
- Analyze the app's user reviews and overall performance
- Use the following search results as background information
${searchResults.map(result => 
  `- Title: ${result.title}\n  Snippet: ${result.snippet}`
).join('\n')}

REQUIREMENTS:
1. Generate a comprehensive app review analysis
2. Follow the exact JSON structure in the template
3. Be precise, data-driven, and objective
4. Use real-world insights based on typical user experiences

JSON TEMPLATE:
${JSON.stringify(JSON_TEMPLATE, null, 2)}

IMPORTANT:
- Respond ONLY with valid, parseable JSON
- Ensure all fields are populated
- Use realistic, meaningful data
- Focus on user experience and app performance
`;

    // Call Groq API for analysis
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert mobile app review analyst. Generate precise, data-driven insights.' 
          },
          { 
            role: 'user', 
            content: aiPrompt 
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API Error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Groq API');
    }

    // Parse and validate the response
    let parsedAnalytics;
    try {
      parsedAnalytics = JSON.parse(content);
    } catch (parseError) {
      throw new Error('Invalid JSON response');
    }

    // Validate against schema
    const validationResult = AppAnalyticsSchema.safeParse({
      ...parsedAnalytics,
      appName: appName
    });

    if (!validationResult.success) {
      console.error('Validation Error:', validationResult.error);
      return null;
    }

    return validationResult.data;

  } catch (error) {
    console.error('Play Store Analytics Fetch Error:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error Details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }

    return null;
  }
};