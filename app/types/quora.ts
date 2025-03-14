
export interface BasePost {
  title: string;
  url: string;
  createdAt: string;
}

export interface Author {
  name: string;
  profile: string;
}

export interface Answer {
  text: string;
  author: Author;
  upvotes: number;
  numComments: number;
  createdAt: string;
}

/**
 * Analytics Types
 */
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

export interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
}

export interface AnalyticsData {
  results: GoogleResult[];
  summary: AnalyticsSummary;
}

/**
 * API Response Types
 */
export interface RapidApiQuoraResponse {
  status: boolean;
  message: string;
  data: {
    questions: Array<{
      question: {
        id: string;
        title: string;
        url: string;
        createdAt: string;
      };
      answers: Array<{
        id: string;
        text: string;
        author: {
          name: string;
          profile: string;
        };
        upvotes: number;
        commentCount: number;
        createdTime: string;
      }>;
    }>;
  };
}

export interface GroqResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
}

// app/types/quora.ts
export interface QuoraPost {
  title: string;
  url: string;
  topics: string[];
  followers: number;
  topAnswer: {
    text: string;
    author: string;
    authorProfile: string;
    authorCredentials: string;
    upvotes: number;
    numComments: number;
    createdAt: string;
  };
  additionalAnswers: Array<{
    text: string;
    author: string;
    authorProfile: string;
    authorCredentials: string;
    upvotes: number;
    numComments: number;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface ProcessedAnswer {
  text: string;
  author: string;
  authorProfile: string;
  upvotes: number;
  numComments: number;
  createdAt: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: {
    analysis: string;
    rawPosts: QuoraPost[];
    timestamp: string;
  };
  error?: string;
}

/**
 * Component Types
 */
export interface ExtendedQuoraPost extends QuoraPost {
  sentiment?: number;
}

export interface QuoraAnalysisResponse {
  success: boolean;
  data?: {
    analysis: string;
    rawPosts: ExtendedQuoraPost[];
    timestamp: string;
  };
  error?: string;
}

export interface QuoraAnalysisProps {
  query: string;
  className?: string;
  answerMaxLength?: number;
}

export interface AnalysisState {
  loading: boolean;
  error?: string;
  data?: {
    analysis: string;
    rawPosts: ExtendedQuoraPost[];
    timestamp: string;
  };
}

export interface SentimentIndicatorProps {
  sentiment?: number;
}

export interface AnswerCardProps {
  answer: ProcessedAnswer;
  maxLength: number;
}

/**
 * Analysis Service Types
 */
export interface QuoraAnalysisServiceConfig {
  rapidApiKey: string;
  groqApiKey: string;
  maxAnswersPerQuestion?: number;
  maxQuestions?: number;
}

export interface QuoraAnalysisOptions {
  includeUrls?: boolean;
  maxAnswerLength?: number;
  filterCriteria?: {
    minUpvotes?: number;
    minComments?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Error Types
 */
export class QuoraApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'QuoraApiError';
  }
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Utility Types
 */
export type SentimentScore = -1 | -0.5 | 0 | 0.5 | 1;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalysisMetadata {
  query: string;
  timestamp: string;
  executionTime: number;
  postCount: number;
  answerCount: number;
}

/**
 * Theme and Topic Types
 */
export interface AnalysisTopic {
  name: string;
  frequency: number;
  sentiment: SentimentScore;
  relatedTerms: string[];
}

export interface AnalysisTheme {
  topic: string;
  sentiment: SentimentScore;
  strength: number;
  keywords: string[];
}

/**
 * Component State Types
 */
export interface AnalysisFilters {
  dateRange?: DateRange;
  minUpvotes?: number;
  minComments?: number;
  sortBy: 'relevance' | 'date' | 'upvotes' | 'comments';
  order: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Cache Types
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl: number;
  maxEntries?: number;
}