"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnimations } from "app/styles/animation/search-animation";
import "app/styles/page.css";

// Define proper types for component props
interface ComponentProps {
  query: string;
}

// Define interface for FacebookAdsAnalytics that expects keyword
interface MetaAdAnalysisProps {
  keyword: string;
}

interface SearchComponentConfig {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  isSearching: boolean;
}

interface ResultsSectionProps {
  submittedQuery: string;
  activeComponents: string[];
}

// Create interfaces for specific data types used in FB ads analysis
interface MessageStrategy {
  strategy: string;
  description: string;
  prevalence: number;
  effectiveness: number;
  examples: string[];
}

interface VisualTactic {
  tactic: string;
  implementation: string;
  impact: string;
  frequencyOfUse: number;
}

interface AudienceSegment {
  segment: string;
  approach: string;
  intensity: number;
  engagementPotential: string;
}

interface CTA {
  cta: string;
  context: string;
  strength: number;
  conversionPotential: string;
}

const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  { name: 'ImageResult', component: lazy(() => import("app/components/ImageResult")) },
  { name: 'GoogleAnalytics', component: lazy(() => import("app/components/GoogleAnalytics")) },
  { name: 'PlayStoreAnalytics', component: lazy(() => import("app/components/PlayStoreAnalytics")) },
  { name: 'RedditAnalytics', component: lazy(() => import("app/components/RedditAnalytics"))},
  { name: 'YoutubeAnalysis', component: lazy(() => import("app/components/YoutubeAnalysis")) },
  { name: 'QuoraAnalysis', component: lazy(() => import("app/components/QuoraAnalysis")) },
  { name: 'XAnalytics', component: lazy(() => import("app/components/XAnalytics")) },
  { name: 'FacebookAdsAnalysis', component: lazy(() => import("app/components/FacebookAdsAnalytics")) },
  { name: 'StrategyAnalysis', component: lazy(() => import("app/components/StrategyAnalysis")) },
];

const SearchForm: React.FC<SearchFormProps> = ({ query, setQuery, handleSearch, isSearching }) => (
  <form onSubmit={handleSearch} className="search-form">
    <motion.div
      className="search-bar-wrapper"
      variants={searchAnimations.searchBar}
      animate={isSearching ? "focused" : "unfocused"}
    >
      <input
        type="text"
        placeholder="Enter your query here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="search-button"
      >
        {isSearching ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="search-loader"
          >
            ○
          </motion.div>
        ) : (
          "Search"
        )}
      </motion.button>
    </motion.div>
  </form>
);

const ResultsSection: React.FC<ResultsSectionProps> = ({ submittedQuery, activeComponents }) => (
  <motion.div
    variants={searchAnimations.stagger}
    initial="initial"
    animate="animate"
    exit="exit"
    className="results-container"
  >
    <Suspense fallback={<div className="results-loader">Loading components...</div>}>
      {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map(({ name, component: Component }) => (
        <motion.div
          key={name}
          variants={searchAnimations.fadeUp}
          layout
          className="result-card"
        >
          {/* Handle both query and keyword prop requirements */}
          {name === 'FacebookAdsAnalysis' ? (
            <Component keyword={submittedQuery} />
          ) : (
            <Component query={submittedQuery} />
          )}
        </motion.div>
      ))}
    </Suspense>
  </motion.div>
);

const Page: React.FC = () => {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      setSubmittedQuery(query);
      setTimeout(() => setIsSearching(false), 1000);
    }
  };

  const toggleComponent = (componentName: string) => {
    setActiveComponents(prev => 
      prev.includes(componentName)
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName]
    );
  };

  return (
    <div className="search-container">
      <div className="background-layer" />

      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="main-heading"
      >
        Peekaboo
      </motion.h1>

      <motion.div layout className="search-section">
        <SearchForm
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          isSearching={isSearching}
        />
      </motion.div>

      <div className="component-toggle-container">
        {SEARCH_COMPONENTS.map(({ name }) => (
          <button
            key={name}
            onClick={() => toggleComponent(name)}
            className={`glass-toggle ${activeComponents.includes(name) ? 'active' : ''}`}
            data-component={name.toLowerCase()}
            aria-label={`Toggle ${name}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {submittedQuery && (
          <motion.div
            variants={searchAnimations.fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="query-display"
          >
            Showing results for: <span className="query-text">{submittedQuery}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {submittedQuery && (
          <ResultsSection 
            submittedQuery={submittedQuery} 
            activeComponents={activeComponents} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;