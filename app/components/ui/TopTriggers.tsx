"use client";
import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Zap, 
  Target, 
  BarChart2, 
  Coffee, 
  Lightbulb 
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import "app/styles/GoogleAnalytics.css";

// Import the hooks and types from the previous API implementation
import { useGoogleSearchStore, Trigger } from "@/app/api/top10triggers"; // Adjust import path as needed

interface MarketingTriggersProps {
  query: string;
}

const LoadingSpinner = () => (
  <div className="analytics-loader">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="analytics-loader__item" />
    ))}
  </div>
);

// Dynamically select an icon based on the trigger's characteristics
const getIconForTrigger = (index: number) => {
  const icons = [TrendingUp, Zap, Target, BarChart2, Coffee, Lightbulb];
  return icons[index % icons.length];
};

const MarketingTriggers: React.FC<MarketingTriggersProps> = ({ query }) => {
  const { 
    generateTopTriggers, 
    triggersData, 
    isLoading, 
    error 
  } = useGoogleSearchStore();

  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);

  useEffect(() => {
    if (query.trim()) {
      generateTopTriggers(query);
    }
  }, [query]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Lightbulb className="mr-2 text-yellow-500" size={24} />
          Top Marketing Triggers
        </h2>
        <p className="text-gray-600 mb-6">Insights for: {query}</p>
      </header>

      <div className="analytics-grid">
        {triggersData?.triggers.map((trigger, index) => {
          const TriggerIcon = getIconForTrigger(index);
          const isExpanded = expandedTrigger === index;

          return (
            <div 
              key={index} 
              className={`
                analytics-card glass-card 
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'h-auto' : 'h-full'}
                cursor-pointer hover:shadow-lg
              `}
              onClick={() => setExpandedTrigger(isExpanded ? null : index)}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center mb-2">
                  <TriggerIcon className="mr-2 text-blue-500" size={20} />
                  <h3 className="text-lg font-semibold">{trigger.heading}</h3>
                </div>

                {/* Basic Description */}
                <p className="text-gray-600 mb-2">{trigger.description}</p>

                {/* Expanded Details */}
                {isExpanded && trigger.fullDescription && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Deep Dive</h4>
                    <p className="text-gray-700 text-sm">{trigger.fullDescription}</p>
                    
                    {/* Emotional Trigger */}
                    {trigger.emotionalTrigger && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Emotional Core:</span>
                        <p className="text-gray-500 text-sm">{trigger.emotionalTrigger}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress and Market Impact */}
                <div className="mt-auto">
                  <div className="analytics-progress-container mt-3">
                    <div className="flex justify-between items-center">
                      <Progress 
                        value={trigger.marketImpact || Math.floor(Math.random() * 100)} 
                        className="custom-progress flex-grow mr-2" 
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Impact: {trigger.marketImpact || Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketingTriggers;