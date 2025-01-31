"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnimations } from "app/styles/animation/search-animation";
import "app/styles/page.css";
import RainbowCursor from "app/components/ui/RainbowCursor";

// Define interfaces for props and component types
interface SearchComponentConfig {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<{ query: string }>>;
}

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  isSearching: boolean;
}

interface ResultsSectionProps {
  submittedQuery: string;
}

// Component configuration
const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  // { name: 'ImageResult', component: lazy(() => import("app/components/ui/ImageResult")) },
  // { name: 'GoogleAnalytics', component: lazy(() => import("app/components/ui/GoogleAnalytics")) },
  // { name: 'PlayStoreAnalytics', component: lazy(() => import("app/components/ui/PlayStoreAnalytics")) },
  // { name: 'RedditAnalytics', component: lazy(() => import("app/components/ui/RedditAnalytics")) },
  // { name: 'YoutubeAnalysis', component: lazy(() => import("app/components/ui/YoutubeAnalysis")) },
  // { name: 'QuoraAnalysis', component: lazy(() => import("app/components/ui/QuoraAnalysis")) },
  // { name: 'TrendAnalysis', component: lazy(() => import("app/components/ui/TrendAnalysis")) },
  { name: 'RunningAds', component: lazy(() => import("app/components/ui/RunningAds")) }
  // { name: 'AdsAnalytics', component: lazy(() => import("app/components/ui/AdsAnalytics")) },
  // { name: 'NewsResults', component: lazy(() => import("app/components/ui/NewsResults")) },
  // { name: 'TopPainpoints', component: lazy(() => import("app/components/ui/TopPainpoints")) },
  // { name: 'TopTriggers', component: lazy(() => import("app/components/ui/TopTriggers")) },
  // { name: 'Recommended', component: lazy(() => import("app/components/ui/Recommended")) },
  // { name: 'StrategyAnalysis', component: lazy(() => import("app/components/ui/StrategyAnalysis")) },
  // { name: 'SentimentAnalysis', component: lazy(() => import("app/components/ui/SentimentAnalysis")) },
  // { name: 'Summary', component: lazy(() => import("app/components/ui/Summary")) },
  // { name: 'StoryBoard', component: lazy(() => import("app/components/ui/StoryBoard")) },
  // { name: 'Whiteboard', component: lazy(() => import("app/components/ui/Whiteboard")) }
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
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

const ResultsSection: React.FC<ResultsSectionProps> = ({ submittedQuery }) => (
  <motion.div
    variants={searchAnimations.stagger}
    initial="initial"
    animate="animate"
    exit="exit"
    className="results-container"
  >
    {SEARCH_COMPONENTS.map(({ name, component: Component }, index) => (
      <motion.div
        key={name}
        variants={searchAnimations.fadeUp}
        layout
        className="result-card"
      >
        <Component query={submittedQuery} />
      </motion.div>
    ))}
  </motion.div>
);

const Page: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      setSubmittedQuery(query);
      setTimeout(() => setIsSearching(false), 1000);
    }
  };

  return (
    <div className="search-container">
      <RainbowCursor blur={10} pulseSpeed={0.05} pulseMin={0.7} pulseMax={1.3} />

      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-5xl font-bold text-gray-800 mb-8 tracking-wide"
      >
        Peekaboo
      </motion.h1>

      <motion.div
        layout
        className={`search-section ${submittedQuery ? "search-section--submitted" : ""}`}
      >
        <SearchForm
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          isSearching={isSearching}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {submittedQuery && (
          <motion.div
            variants={searchAnimations.fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="query-display"
          >
            Showing results for: <motion.span className="query-text">{submittedQuery}</motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={<div className="results-loader">Loading results...</div>}>
        <AnimatePresence mode="wait">
          {submittedQuery && <ResultsSection submittedQuery={submittedQuery} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default Page;