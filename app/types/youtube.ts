// Video interfaces
export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

// Statistics interfaces
export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

// Transcript interfaces
export interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

// Analysis interfaces
export interface VideoAnalysis {
  transcript: string;
  quotes: string[];
  sentiment: {
    positive: string[];
    negative: string[];
  };
  keywords: string[];
  summary: string;
}

// Component props
export interface YouTubeAnalysisProps {
  query: string;
}

// Error state
export interface ErrorState {
  message: string;
  code: string;
}

// API Response types
export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

export interface YouTubeStatisticsResponse {
  items: Array<{
    id: string;
    statistics: VideoStatistics;
  }>;
}