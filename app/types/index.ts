// Reddit Post interface
export interface RedditPost {
    title: string;
    subreddit: string;
    upvotes: number;
    comments: number;
    body: string;
}

// Analysis Result interface
export interface AnalysisResult {
    success: boolean;
    data?: {
        analysis: string;
        rawPosts: RedditPost[];
        timestamp: string;
    };
    error?: string;
}

// Groq API interfaces
export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqRequest {
    model: string;
    messages: GroqMessage[];
    temperature: number;
    max_tokens: number;
}

export interface GroqChoice {
    message: {
        content: string;
        role: string;
    };
    finish_reason: string;
    index: number;
}

export interface GroqResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: GroqChoice[];
}

// API Response Types
export interface GroqResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }[];
  }
  
  // Dataset Types
  export interface ChartDataset {
    label: string;
    data: number[];
  }
  
  export interface HistoricTrendDataset extends ChartDataset {
    borderColor?: string;
    tension?: number;
  }
  
  // Chart Data Structure Types
  export interface BaseChartData {
    title: string;
    labels: string[];
  }
  
  export interface HistoricTrendData extends BaseChartData {
    datasets: HistoricTrendDataset[];
  }
  
  export interface DistributionData extends BaseChartData {
    data: number[];
  }
  
  // Complete Market Analysis Data Structure
  export interface MarketAnalysisData {
    historicTrend: HistoricTrendData;
    marketShare: DistributionData;
    sentiment: DistributionData;
    regional: DistributionData;
    demographics: DistributionData;
    priceDistribution: DistributionData;
  }
  
  // Chart Configuration Types
  export interface ChartColors {
    line: string;
    pie: string[];
    bar: string;
  }
  
  // Component Props Types
  export interface TrendAnalysisProps {
    query: string;
    className?: string;
    onDataLoaded?: (data: MarketAnalysisData) => void;
    onError?: (error: Error) => void;
  }
  
  // Chart Options Types
  export interface ChartOptions {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: {
      title: {
        display: boolean;
        text: string;
      };
      legend?: {
        position: 'top' | 'right' | 'bottom' | 'left';
        labels?: {
          fontSize?: number;
        };
      };
    };
  }
  
  // API Error Types
  export interface APIErrorResponse {
    error: {
      message: string;
      type: string;
      code: string;
    };
  }
  
  // State Types
  export interface AnalysisState {
    loading: boolean;
    error: string | null;
    data: MarketAnalysisData | null;
  }