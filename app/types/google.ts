interface Trend {
    title: string;
    description: string;
    percentage: number;
  }
  
  interface Competitor {
    name: string;
    strength: string;
    score: number;
  }
  
  interface AnalyticsSummary {
    overview: string;
    trends: Trend[];
    competitors: Competitor[];
    opportunities: string[];
  }
  
  interface GoogleResult {
    title: string;
    link: string;
    snippet: string;
  }
  
  interface AnalyticsData {
    results: GoogleResult[];
    summary: AnalyticsSummary;
  }