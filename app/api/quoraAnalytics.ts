import axios, { AxiosError } from 'axios';
import Debug from 'debug';

// Initialize debuggers for different components
const debug = {
  search: Debug('quora:search'),
  details: Debug('quora:details'),
  process: Debug('quora:process'),
  analysis: Debug('quora:analysis')
};

interface QuoraPost {
  title: string;
  url: string;
  topics: string[];
  followers: number;
  topAnswer: Answer;
  additionalAnswers: Answer[];
  createdAt: string;
}

interface Answer {
  text: string;
  author: string;
  authorProfile: string;
  authorCredentials: string;
  upvotes: number;
  numComments: number;
  createdAt: string;
}

interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: string;
    rawPosts: QuoraPost[];
    timestamp: string;
  };
  error?: string;
  debug?: {
    searchResponse?: any;
    questionResponses?: any[];
    groqResponse?: any;
  };
}

export class QuoraAnalysisService {
  private static readonly GROQ_API_URL = 'https://api.groq.com/v1/completions';
  private static readonly RAPIDAPI_URL = 'https://quora-scraper.p.rapidapi.com/api/v1';
  private static readonly RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  private static readonly GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  /**
   * Enable debug mode to get detailed logging
   */
  public static enableDebug() {
    Debug.enable('quora:*');
  }

  /**
   * Handle API errors with detailed logging
   */
  private static handleApiError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      debug.search.error(`${context} API Error:`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          params: axiosError.config?.params
        }
      });
    } else {
      debug.search.error(`${context} Unknown Error:`, error);
    }
    throw error;
  }

  /**
   * Search Quora for questions related to the query.
   */
  private static async searchQuora(query: string): Promise<string[]> {
    debug.search('Searching Quora with query:', query);
    
    try {
      const config = {
        params: {
          query,
          type: 'question',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': this.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'quora-scraper.p.rapidapi.com'
        }
      };
      
      debug.search('Request config:', config);

      const response = await axios.get(`${this.RAPIDAPI_URL}/search`, config);
      
      debug.search('Search response:', response.data);

      if (!response.data?.results?.length) {
        debug.search('No results found');
        return [];
      }

      const urls = response.data.results
        .filter((result: any) => {
          const isValid = result.url && result.url.includes('quora.com/');
          debug.search(`Filtering URL ${result.url}: ${isValid}`);
          return isValid;
        })
        .map((result: any) => result.url)
        .slice(0, 5);

      debug.search('Filtered URLs:', urls);
      return urls;

    } catch (error) {
      return this.handleApiError(error, 'Search');
    }
  }

  /**
   * Fetch details for a specific Quora question.
   */
  private static async fetchQuestionDetails(url: string) {
    debug.details('Fetching details for URL:', url);

    try {
      const config = {
        params: { url },
        headers: {
          'X-RapidAPI-Key': this.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'quora-scraper.p.rapidapi.com'
        }
      };

      debug.details('Request config:', config);

      const response = await axios.get(`${this.RAPIDAPI_URL}/question/details`, config);
      
      debug.details('Question details response:', response.data);
      return response.data;

    } catch (error) {
      return this.handleApiError(error, 'Details');
    }
  }

  /**
   * Process the Quora API response into a QuoraPost object.
   */
  private static processQuoraResponse(response: any): QuoraPost {
    debug.process('Processing response:', response);

    const { question, answers = [] } = response.data || {};
    
    debug.process('Extracted question:', question);
    debug.process('Extracted answers:', answers);

    const processedAnswers = answers.map((answer: any) => {
      const processed = {
        text: this.truncateText(answer.content, 1000),
        author: answer.author?.name || 'Anonymous',
        authorProfile: answer.author?.profile_url || '',
        authorCredentials: answer.author?.credentials || '',
        upvotes: answer.upvotes || 0,
        numComments: answer.comment_count || 0,
        createdAt: answer.post_time || new Date().toISOString()
      };
      debug.process('Processed answer:', processed);
      return processed;
    });

    const post = {
      title: question?.title || '',
      url: question?.url || '',
      topics: question?.topics || [],
      followers: question?.followers || 0,
      topAnswer: processedAnswers[0] || this.createEmptyAnswer(),
      additionalAnswers: processedAnswers.slice(1, 3),
      createdAt: new Date().toISOString()
    };

    debug.process('Final processed post:', post);
    return post;
  }

  /**
   * Create an empty answer object for cases where no answers exist.
   */
  private static createEmptyAnswer(): Answer {
    return {
      text: 'No answer available',
      author: 'N/A',
      authorProfile: '',
      authorCredentials: '',
      upvotes: 0,
      numComments: 0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Truncate text to a specified length.
   */
  private static truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  }

  /**
   * Analyze Quora data for a given query.
   */
  public static async analyzeQuoraData(query: string): Promise<AnalysisResult> {
    debug.analysis('Starting analysis for query:', query);

    const debugData: AnalysisResult['debug'] = {};

    try {
      // Validate API keys
      if (!this.RAPIDAPI_KEY || !this.GROQ_API_KEY) {
        throw new Error('Missing required API keys');
      }

      debug.analysis('API keys validated');

      // Get question URLs
      const questionUrls = await this.searchQuora(query);
      debugData.searchResponse = questionUrls;

      debug.analysis('Found question URLs:', questionUrls);

      if (questionUrls.length === 0) {
        return {
          success: false,
          error: 'No relevant Quora questions found',
          debug: debugData
        };
      }

      // Fetch and process questions
      const questionPromises = questionUrls.map(url => this.fetchQuestionDetails(url));
      const responses = await Promise.allSettled(questionPromises);
      
      debugData.questionResponses = responses.map(response => 
        response.status === 'fulfilled' ? response.value : response.reason
      );

      const quoraPosts = responses
        .filter((result): result is PromiseFulfilledResult<any> => {
          const isValid = result.status === 'fulfilled' && result.value?.data?.question;
          debug.analysis('Filtering response:', { status: result.status, isValid });
          return isValid;
        })
        .map(result => this.processQuoraResponse(result.value));

      debug.analysis('Processed posts:', quoraPosts);

      if (quoraPosts.length === 0) {
        return {
          success: false,
          error: 'Failed to process Quora questions',
          debug: debugData
        };
      }

      // Generate analysis using Groq
      const groqPayload = {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: `Analyze these Quora posts about "${query}" and provide insights:`
          },
          {
            role: 'user',
            content: JSON.stringify(quoraPosts, null, 2)
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      };

      debug.analysis('Groq API request payload:', groqPayload);

      const groqResponse = await axios.post(
        this.GROQ_API_URL,
        groqPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      debugData.groqResponse = groqResponse.data;
      debug.analysis('Groq API response:', groqResponse.data);

      const analysis = groqResponse.data?.choices?.[0]?.message?.content ||
        '<p>Analysis generation failed. Please try again.</p>';

      return {
        success: true,
        data: {
          analysis,
          rawPosts: quoraPosts,
          timestamp: new Date().toISOString()
        },
        debug: debugData
      };

    } catch (error) {
      debug.analysis('Error in analyzeQuoraData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        debug: debugData
      };
    }
  }
}