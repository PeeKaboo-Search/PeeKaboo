"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnimations } from "app/styles/animation/search-animation";
import "app/styles/page.css";

// Component prop interfaces
interface QueryComponentProps {
  query: string;
}

interface KeywordComponentProps {
  keyword: string;
}

type SearchComponentConfig = 
  | {
      name: string;
      component: React.LazyExoticComponent<React.ComponentType<QueryComponentProps>>;
      propType: 'query';
    }
  | {
      name: string;
      component: React.LazyExoticComponent<React.ComponentType<KeywordComponentProps>>;
      propType: 'keyword';
    };

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

// Updated YouTubeAnalysis import to match the component name correctly
const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  { 
    name: 'ImageResult', 
    component: lazy(() => import("app/components/ImageResult")), 
    propType: 'query' 
  },
  { 
    name: 'GoogleAnalytics', 
    component: lazy(() => import("app/components/GoogleAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'PlayStoreAnalytics', 
    component: lazy(() => import("app/components/PlayStoreAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'RedditAnalytics', 
    component: lazy(() => import("app/components/RedditAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'YouTubeVideos', // Updated to match the actual component name from your code
    component: lazy(() => import("app/components/YTvideos").then(module => ({ default: module.default }))),
    propType: 'query' 
  },
  { 
    name: 'QuoraAnalysis', 
    component: lazy(() => import("app/components/QuoraAnalysis")), 
    propType: 'query' 
  },
  { 
    name: 'XAnalytics', 
    component: lazy(() => import("app/components/XAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'FacebookAdsAnalysis', 
    component: lazy(() => import("app/components/FacebookAdsAnalytics")), 
    propType: 'keyword' 
  },
  { 
    name: 'StrategyAnalysis', 
    component: lazy(() => import("app/components/StrategyAnalysis")), 
    propType: 'query' 
  },
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
      {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map((config) => {
        if (config.propType === 'query') {
          const Component = config.component;
          return (
            <motion.div
              key={config.name}
              variants={searchAnimations.fadeUp}
              layout
              className="result-card"
            >
              <Component query={submittedQuery} />
            </motion.div>
          );
        }
        
        const Component = config.component;
        return (
          <motion.div
            key={config.name}
            variants={searchAnimations.fadeUp}
            layout
            className="result-card"
          >
            <Component keyword={submittedQuery} />
          </motion.div>
        );
      })}
    </Suspense>
  </motion.div>
);

// Page component remains the same as in previous correct implementation
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