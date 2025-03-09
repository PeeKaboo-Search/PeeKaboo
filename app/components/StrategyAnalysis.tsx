"use client";

import React, { useEffect, useState, memo } from "react";
import { 
  TrendingUp, Calendar,
  Lightbulb, BarChart, 
  Target, Building2,
  Clock, DollarSign,
  BookOpen, FileText,
  RefreshCw, Medal
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { useMarketingStrategy } from "@/app/api/strategyAnalytics"; 

// Types
interface MarketingStrategyProps {
  query: string;
}

interface CardProps {
  title: string;
  description: string;
  items?: string[];
  score?: number;
  scoreLabel?: string;
  timing?: string;
  highlightValue?: string;
}

interface SectionProps<T> {
  icon: React.ReactNode;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
}

// Define interfaces for each data type
interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
  uniqueSellingPoints: string[];
  targetAudience: string[];
  marketingChannels: string[];
  recentCampaigns: string[];
}

interface CaseStudy {
  companyName: string;
  industry: string;
  challenge: string;
  solution: string;
  outcome: string;
  keyLearnings: string[];
  applicability: string;
}

interface MarketingTactic {
  name: string;
  description: string;
  expectedROI: number;
  timeToImplement: string;
  resourceRequirements: string[];
  bestPractices: string[];
  successMetrics: string[];
}

interface ContentPillar {
  theme: string;
  description: string;
  audienceResonance: number;
  channels: string[];
  contentFormats: string[];
  keyMessages: string[];
  frequencyRecommendation: string;
}

interface StorytellingStrategy {
  narrativeArc: string;
  characterJourney: string;
  emotionalHooks: string[];
  brandAlignment: string;
  distributionChannels: string[];
  engagementTriggers: string[];
}

// Helper functions
const validateArray = <T,>(data: T[] | undefined | null): T[] => {
  return Array.isArray(data) ? data : [];
};

// Base card component
const StrategyCard = memo(({ title, description, items, score, scoreLabel, timing, highlightValue }: CardProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {timing && <span className="text-sm opacity-70">{timing}</span>}
      {highlightValue && <span className="bg-blue-500/30 text-white px-3 py-1 rounded-full text-sm">{highlightValue}</span>}
    </div>
    <div className="space-y-4">
      <p dangerouslySetInnerHTML={{ __html: description }} />
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      )}
    </div>
    {score !== undefined && (
      <div className="mt-4 space-y-2">
        <Progress value={score} className="h-2" />
        <span className="text-sm">
          {scoreLabel}: {score}%
        </span>
      </div>
    )}
  </div>
));

StrategyCard.displayName = 'StrategyCard';

// Specialized card components
const CompetitorCard = memo(({ competitor }: { competitor: Competitor }) => (
  <StrategyCard
    title={competitor.name}
    description={`<strong>Market Share:</strong> ${competitor.marketShare}%`}
    items={[
      `<strong>Strengths:</strong> ${competitor.strengths.join(", ")}`,
      `<strong>Weaknesses:</strong> ${competitor.weaknesses.join(", ")}`,
      `<strong>USPs:</strong> ${competitor.uniqueSellingPoints.join(", ")}`,
      `<strong>Channels:</strong> ${competitor.marketingChannels.join(", ")}`,
      `<strong>Recent Campaign:</strong> ${competitor.recentCampaigns[0] || "None reported"}`
    ]}
    score={competitor.marketShare}
    scoreLabel="Market Share"
  />
));

CompetitorCard.displayName = 'CompetitorCard';

const CaseStudyCard = memo(({ caseStudy }: { caseStudy: CaseStudy }) => (
  <StrategyCard
    title={caseStudy.companyName}
    description={`<strong>Industry:</strong> ${caseStudy.industry}<br/><strong>Challenge:</strong> ${caseStudy.challenge}`}
    items={[
      `<strong>Solution:</strong> ${caseStudy.solution}`,
      `<strong>Outcome:</strong> ${caseStudy.outcome}`,
      ...caseStudy.keyLearnings.map(learning => `<strong>Key Learning:</strong> ${learning}`),
      `<strong>Applicability:</strong> ${caseStudy.applicability}`
    ]}
  />
));

CaseStudyCard.displayName = 'CaseStudyCard';

const TacticCard = memo(({ tactic }: { tactic: MarketingTactic }) => (
  <StrategyCard
    title={tactic.name}
    description={tactic.description}
    items={[
      `<strong>Implementation Time:</strong> ${tactic.timeToImplement}`,
      `<strong>Resources:</strong> ${tactic.resourceRequirements.join(", ")}`,
      ...tactic.bestPractices.map(practice => `<strong>Best Practice:</strong> ${practice}`),
      ...tactic.successMetrics.map(metric => `<strong>Success Metric:</strong> ${metric}`)
    ]}
    score={tactic.expectedROI}
    scoreLabel="Expected ROI"
  />
));

TacticCard.displayName = 'TacticCard';

const ContentPillarCard = memo(({ pillar }: { pillar: ContentPillar }) => (
  <StrategyCard
    title={pillar.theme}
    description={pillar.description}
    items={[
      `<strong>Channels:</strong> ${pillar.channels.join(", ")}`,
      `<strong>Content Formats:</strong> ${pillar.contentFormats.join(", ")}`,
      ...pillar.keyMessages.map(message => `<strong>Key Message:</strong> ${message}`)
    ]}
    score={pillar.audienceResonance}
    scoreLabel="Audience Resonance"
    highlightValue={pillar.frequencyRecommendation}
  />
));

ContentPillarCard.displayName = 'ContentPillarCard';

const StorytellingCard = memo(({ strategy }: { strategy: StorytellingStrategy }) => (
  <StrategyCard
    title={strategy.narrativeArc}
    description={`<strong>Character Journey:</strong> ${strategy.characterJourney}`}
    items={[
      `<strong>Brand Alignment:</strong> ${strategy.brandAlignment}`,
      `<strong>Distribution:</strong> ${strategy.distributionChannels.join(", ")}`,
      ...strategy.emotionalHooks.map(hook => `<strong>Emotional Hook:</strong> ${hook}`),
      ...strategy.engagementTriggers.map(trigger => `<strong>Engagement Trigger:</strong> ${trigger}`)
    ]}
  />
));

StorytellingCard.displayName = 'StorytellingCard';

// Generic section component
const StrategySection = <T,>({
  icon,
  title,
  items,
  renderItem,
  emptyMessage
}: SectionProps<T>) => (
  <section className="mt-8">
    <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
      {icon}
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length > 0 ? (
        items.map((item, index) => renderItem(item, index))
      ) : (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  </section>
);

// Main component
const MarketingStrategyDashboard: React.FC<MarketingStrategyProps> = ({ query }) => {
  const { strategyData, analyzeStrategy, isLoading, error } = useMarketingStrategy();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || hasSearched) return;
      await analyzeStrategy(query);
      setHasSearched(true);
    };

    fetchData();
  }, [query, analyzeStrategy, hasSearched]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        <p className="text-lg">Developing comprehensive marketing strategy...</p>
      </div>
    );
  }

  if (error || !strategyData?.success) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || strategyData?.error || "Failed to fetch strategy data"}
      </div>
    );
  }

  if (!strategyData?.data?.strategy) {
    return (
      <div className="text-center p-4">
        No strategy data available
      </div>
    );
  }

  const { strategy } = strategyData.data;

  // Extract market analysis for the overview section
  const { marketAnalysis, positioningStrategy } = strategy;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketing Strategy Analysis</h1>
        <p className="text-lg opacity-70">Strategic Plan for: {query}</p>
      </header>

      <div className="space-y-8">
        {/* Executive Summary */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Executive Summary
          </h2>
          <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800" 
            dangerouslySetInnerHTML={{ __html: strategy.executiveSummary }} 
          />
        </section>

        {/* Market Overview */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart className="w-6 h-6" />
            Market Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Market Size</h3>
              <p>{marketAnalysis.industrySize}</p>
              <div className="mt-4">
                <Progress value={marketAnalysis.growthRate} className="h-2" />
                <span className="text-sm">Growth Rate: {marketAnalysis.growthRate}%</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Key Drivers</h3>
              <ul className="space-y-1">
                {marketAnalysis.keyDrivers.map((driver, idx) => (
                  <li key={idx} className="text-sm">{driver}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Barriers</h3>
              <ul className="space-y-1">
                {marketAnalysis.barriers.map((barrier, idx) => (
                  <li key={idx} className="text-sm">{barrier}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Opportunities</h3>
              <ul className="space-y-1">
                {marketAnalysis.emergingOpportunities.map((opportunity, idx) => (
                  <li key={idx} className="text-sm">{opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Positioning Strategy */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Positioning Strategy
          </h2>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Unique Value Proposition</h3>
            <p className="text-lg mb-4 font-medium">{positioningStrategy.uniqueValueProposition}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold mb-2">Key Differentiators</h4>
                <ul className="space-y-1">
                  {positioningStrategy.keyDifferentiators.map((item, idx) => (
                    <li key={idx} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Messaging Framework</h4>
                <ul className="space-y-1">
                  {positioningStrategy.messagingFramework.map((item, idx) => (
                    <li key={idx} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Brand Voice</h4>
              <p>{positioningStrategy.brandVoice}</p>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Perception Mapping</h4>
              <p>{positioningStrategy.perceptionMapping}</p>
            </div>
          </div>
        </section>

        {/* Competitor Analysis */}
        <StrategySection
          icon={<Building2 className="w-6 h-6" />}
          title="Competitor Analysis"
          items={validateArray(strategy.competitorAnalysis)}
          renderItem={(competitor, index) => (
            <CompetitorCard key={index} competitor={competitor} />
          )}
          emptyMessage="No competitor analysis available"
        />

        {/* Case Studies */}
        <StrategySection
          icon={<BookOpen className="w-6 h-6" />}
          title="Case Studies"
          items={validateArray(strategy.caseStudies)}
          renderItem={(caseStudy, index) => (
            <CaseStudyCard key={index} caseStudy={caseStudy} />
          )}
          emptyMessage="No case studies available"
        />

        {/* Marketing Tactics */}
        <StrategySection
          icon={<Medal className="w-6 h-6" />}
          title="High-Impact Marketing Tactics"
          items={validateArray(strategy.marketingTactics)}
          renderItem={(tactic, index) => (
            <TacticCard key={index} tactic={tactic} />
          )}
          emptyMessage="No marketing tactics available"
        />

        {/* Content Pillars */}
        <StrategySection
          icon={<Lightbulb className="w-6 h-6" />}
          title="Content Pillars"
          items={validateArray(strategy.contentPillars)}
          renderItem={(pillar, index) => (
            <ContentPillarCard key={index} pillar={pillar} />
          )}
          emptyMessage="No content pillars available"
        />

        {/* Storytelling Strategies */}
        <StrategySection
          icon={<TrendingUp className="w-6 h-6" />}
          title="Storytelling Strategies"
          items={validateArray(strategy.storytellingStrategies)}
          renderItem={(strategy, index) => (
            <StorytellingCard key={index} strategy={strategy} />
          )}
          emptyMessage="No storytelling strategies available"
        />

        {/* Budget & Timeline */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
            <DollarSign className="w-6 h-6" />
            Budget & Implementation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">Budget Allocation</h3>
              <p className="mb-2"><strong>Total Budget:</strong> {strategy.budgetAllocation.totalBudget}</p>
              <p className="mb-4"><strong>Contingency Reserve:</strong> {strategy.budgetAllocation.contingencyReserve}%</p>
              
              <h4 className="font-semibold mb-2">Channel Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(strategy.budgetAllocation.channelBreakdown).map(([channel, percentage]) => (
                  <div key={channel} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{channel}</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
              
              <h4 className="font-semibold mt-4 mb-2">Quarterly Distribution</h4>
              <div className="grid grid-cols-4 gap-2">
                {strategy.budgetAllocation.quarterlyDistribution.map((percentage, idx) => (
                  <div key={idx} className="text-center">
                    <div className="mb-1">Q{idx+1}</div>
                    <Progress value={percentage} className="h-2 mb-1" />
                    <div className="text-sm">{percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">Implementation Timeline</h3>
              
              <h4 className="font-semibold mb-2">Phases</h4>
              <ul className="space-y-1 mb-4">
                {strategy.implementationTimeline.phases.map((phase, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {phase}
                  </li>
                ))}
              </ul>
              
              <h4 className="font-semibold mb-2">Key Milestones</h4>
              <ul className="space-y-1 mb-4">
                {strategy.implementationTimeline.milestones.map((milestone, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {milestone}
                  </li>
                ))}
              </ul>
              
              <h4 className="font-semibold mb-2">Critical Path</h4>
              <ul className="space-y-1">
                {strategy.implementationTimeline.criticalPath.map((path, idx) => (
                  <li key={idx} className="text-sm">{path}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

MarketingStrategyDashboard.displayName = 'MarketingStrategyDashboard';

export default memo(MarketingStrategyDashboard);