interface QuoraAnswer {
  content: string;
  author: {
    name: string;
    surname?: string;
    profile_url: string;
    credentials: string; // Ensure this is always a string
    followers?: number;
    profileImage?: string;
  };
  post_url: string;
  upvotes: number;
  comments?: number;
  timestamp: string;
}

interface QuoraAPIResponse {
  data: Array<any>;
  pageInfo?: {
    hasNextPage?: boolean;
    endCursor?: string;
  };
}

interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: string;
    sources: QuoraAnswer[];
    timestamp: string;
  };
  error?: string;
}

export class QuoraAnalysisService {
  // Updated Groq API URL (ensure this is correct)
  private static readonly GROQ_API_URL = 'https://api.groq.com/v1/chat/completions'; // Updated endpoint
  private static readonly RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  private static readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  /**
   * Search and analyze Quora answers
   */
  public static async analyzeQuoraData(query: string): Promise<AnalysisResult> {
    try {
      if (!this.RAPIDAPI_KEY || !this.GROQ_API_KEY) {
        throw new Error('Missing required API keys');
      }

      const answers = await this.searchQuoraAnswers(query);

      if (answers.length === 0) {
        return {
          success: false,
          error: 'No relevant Quora answers found',
        };
      }

      // Only send content to Groq for analysis
      const relevantContent = answers.map((answer) => answer.content).join('\n\n');
      const analysis = await this.generateAnalysis(query, relevantContent);

      // Return full answer data as sources
      return {
        success: true,
        data: {
          analysis,
          sources: answers,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Search for Quora answers
   */
  private static async searchQuoraAnswers(query: string): Promise<QuoraAnswer[]> {
    const url = new URL('https://quora-scraper.p.rapidapi.com/search_answers');
    url.searchParams.append('query', query);
    url.searchParams.append('language', 'en');
    url.searchParams.append('time', 'all_times');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.RAPIDAPI_KEY || '',
          'x-rapidapi-host': 'quora-scraper.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QuoraAPIResponse = await response.json();

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from Quora API');
      }

      return data.data.map((item) => this.parseQuoraAnswer(item));
    } catch (error) {
      console.error('Quora search error:', error);
      throw new Error('Failed to fetch Quora answers');
    }
  }

  /**
   * Parse raw Quora answer data into standardized format
   */
  private static parseQuoraAnswer(item: any): QuoraAnswer {
    return {
      content: this.truncateText(item.content || '', 1000),
      author: {
        name: item.author?.name || 'Anonymous',
        surname: item.author?.surname,
        profile_url: item.author?.url || '',
        credentials: item.author?.credentials || '', // Ensure this is always a string
        followers: this.parseNumber(item.author?.followers),
        profileImage: item.author?.profileImage,
      },
      post_url: item.url || '',
      upvotes: this.parseNumber(item.upvotes),
      comments: this.parseNumber(item.comments),
      timestamp: new Date().toISOString(), // Use current time if no timestamp provided
    };
  }

  /**
   * Generate analysis using Groq
   */
  private static async generateAnalysis(query: string, content: string): Promise<string> {
    const prompt = `Analyze these Quora answers about "${query}". Focus on:
    1. Key themes and patterns
    2. Notable insights or unique perspectives
    3. Common experiences or solutions mentioned
    4. Areas of disagreement or debate
    
    Provide a clear, organized analysis with specific examples from the answers.`;

    const payload = {
      model: 'mixtral-8x7b-32768', // Ensure this model is supported by Groq
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    try {
      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Groq API error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || 'Analysis generation failed. Please try again.';
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Failed to generate analysis');
    }
  }

  /**
   * Safely parse number values
   */
  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^0-9-]/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Truncate text to a specified length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  }
}