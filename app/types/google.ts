interface GoogleResult {
  title: string;
  snippet: string;
  link: string;
}

interface TrendCard {
  title: string;
  description: string;
  impact: number;
  audience: string[];
  platforms: string[];
  contentIdeas: string[];
  bestPractices: string[];
}
 
interface InsightCard {
  title: string;
  type: 'consumer' | 'industry';
  keyFindings: string[];
  implications: string[];
  opportunities: string[];
  recommendations: string[];
}   

interface SeasonalCard {
  topic: string;
  timing: string;
  relevance: number;
  description: string;
  marketingAngles: string[];
  contentSuggestions: string[];
}

interface TriggerCard {
  productFeature: string;
  userNeed: string;
  purchaseIntent: number;
  conversionRate: number;
  relevance: number;
  recommendedProductContent: string[];
}

interface MarketResearchAnalysis {
  executiveSummary: string;
  marketOverview: {
    targetAudience: string[];
    demographics: string[];
    psychographics: string[];
    channels: string[];
  };
  trends: TrendCard[];
  consumerInsights: InsightCard[];
  industryInsights: InsightCard[];
  seasonalTopics: SeasonalCard[];
  topTriggers: TriggerCard[];
  recommendations: {
    contentStrategy: string[];
    timing: string[];
    platforms: string[];
    messaging: string[];
  };
}

interface GoogleSearchData {
  success: boolean;
  data?: {
    results: GoogleResult[];
    analysis: MarketResearchAnalysis;
    timestamp: string;
  };
  error?: string;
}
 
interface GoogleSearchItem {
  title?: string;
  snippet?: string;
  link?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}
 
interface GroqChoice {
  message?: {
    content?: string;
  };
}

interface GroqResponse {
  choices?: GroqChoice[];
}
 
interface MarketResearchProps {
  query: string;
}

interface CardProps {
  title: string;
  description: string;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  timing?: string;
}

interface SectionProps<T> {
  icon: React.ReactNode;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
}
 
interface Trend {
  title: string;
  description: string;
  audience: string[];
  platforms: string[];
  contentIdeas: string[];
  bestPractices: string[];
  impact: number;
}

interface Insight {
  title: string;
  keyFindings: string[];
  implications: string[];
  opportunities: string[];
  recommendations: string[];
}

interface SeasonalTopic {
  topic: string;
  description: string;
  marketingAngles: string[];
  contentSuggestions: string[];
  relevance: number;
  timing: string;
}
 
interface Trigger {
  productFeature: string;
  userNeed: string;
  recommendedProductContent: string[];
  relevance: number;
}
