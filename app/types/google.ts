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