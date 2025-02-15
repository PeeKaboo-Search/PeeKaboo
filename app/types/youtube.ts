// YouTube Video Types
export interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    default: {
      url: string;
      width?: number;
      height?: number;
    };
    medium: {
      url: string;
      width?: number;
      height?: number;
    };
    high: {
      url: string;
      width?: number;
      height?: number;
    };
  };
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
}

// Statistics Types
export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

// Comment Types
export interface CommentSnippet {
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  authorProfileImageUrl?: string;
  authorChannelUrl?: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
}

export interface TopLevelComment {
  id: string;
  snippet: CommentSnippet;
}

export interface CommentThread {
  id: string;
  snippet: {
    topLevelComment: TopLevelComment;
    totalReplyCount: number;
    canReply?: boolean;
    isPublic?: boolean;
  };
}

export interface CommentThreadResponse {
  items: CommentThread[];
  nextPageToken?: string;
}

// Comment Analysis Types
export interface PainPoint {
  title: string;
  description: string;
  frequency: number;
  impact: number;
  possibleSolutions: string[];
}

export interface UserExperience {
  scenario: string;
  impact: string;
  frequencyPattern: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface EmotionalTrigger {
  trigger: string;
  context: string;
  intensity: number;
  responsePattern: string;
}

export interface CommentAnalysisData {
  analysis: {
    overview: string;
    painPoints: PainPoint[];
    userExperiences: UserExperience[];
    emotionalTriggers: EmotionalTrigger[];
    marketImplications: string;
  };
  sources: Array<{
    content: string;
    author: {
      name: string;
      profileImage?: string;
    };
    likeCount: number;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface CommentAnalysis {
  success: boolean;
  data?: CommentAnalysisData;
  error?: string;
}

// API Response Types
export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface YouTubeStatisticsResponse {
  items: Array<{
    id: string;
    statistics: VideoStatistics;
  }>;
}

// Component Props and State Types
export interface YouTubeVideosProps {
  query: string;
}

export interface ErrorState {
  message: string;
  code: string;
}