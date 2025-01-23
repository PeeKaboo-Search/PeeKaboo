import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { query } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing query' }, 
        { status: 400 }
      );
    }

    // Validate API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key is missing' }, 
        { status: 500 }
      );
    }

    // Groq API request
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: `You are a strategic market analyst. Provide a comprehensive market insights report in STRICT JSON format. 
            
            IMPORTANT RULES:
            - ONLY return a valid JSON object
            - NO markdown or code block formatting
            - ALL fields MUST be present
            - Use simple HTML tags if formatting is needed
            
            JSON STRUCTURE:
            {
              "overview": "Concise market analysis summary (plain text or simple HTML)",
              "trends": [
                {
                  "title": "Market Trend Name",
                  "description": "Detailed trend description (plain text or simple HTML)",
                  "percentage": 0-100
                }
              ],
              "competitors": [
                {
                  "name": "Competitor Name",
                  "strength": "Competitor analysis (plain text or simple HTML)",
                  "score": 0-100
                }
              ],
              "opportunities": [
                "Market opportunity description (plain text or simple HTML)"
              ]
            }`
          },
          { 
            role: "user", 
            content: `Provide a comprehensive market analysis for the following query: "${query}"` 
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    // Parse Groq response
    const groqData = await groqResponse.json();
    
    // Extract content
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis content received from API' }, 
        { status: 500 }
      );
    }

    // Parse the content
    let summary: AnalyticsSummary;
    try {
      summary = JSON.parse(content);

      // Validate summary structure
      if (
        !summary.overview ||
        !Array.isArray(summary.trends) ||
        !Array.isArray(summary.competitors) ||
        !Array.isArray(summary.opportunities)
      ) {
        throw new Error('Invalid summary structure');
      }

      // Ensure default values if fields are missing
      summary.trends = summary.trends.slice(0, 3);
      summary.competitors = summary.competitors.slice(0, 3);
      summary.opportunities = summary.opportunities.slice(0, 3);

    } catch (jsonError) {
      console.error('Parsing error:', jsonError);
      return NextResponse.json(
        { 
          error: 'Failed to parse summary response',
          details: content 
        }, 
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.toString() : ''
      }, 
      { status: 500 }
    );
  }
}