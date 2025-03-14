"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchAnimations } from "app/styles/animation/search-animation";
import "app/styles/page.css";
import Navbar from "app/components/ui/Navbar";
import { useSession, signIn } from "next-auth/react";
import { useSearchHistory } from "app/hooks/useSearchHistory";
import { Dashboard } from "app/components/ui/Dashboard";
import AppScraper from "app/components/ui/AppScraper";

// Define interfaces for props and component types
interface SearchComponentConfig {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>; // Use 'any' to allow different prop types
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
  // { name: 'RedditAnalytics', component: lazy(() => import("app/components/ui/RedditAnalytics")) }
  // { name: 'YoutubeAnalysis', component: lazy(() => import("app/components/ui/YoutubeAnalysis")) },
  //  { name: 'QuoraAnalysis', component: lazy(() => import("app/components/ui/QuoraAnalysis")) }
  { name: 'XAnalytics', component: lazy(() => import("app/components/ui/XAnalytics")) }
  // { name: 'FacebookAdsAnalysis', component: lazy(() => import("app/components/ui/FacebookAdsAnalytics")) },
  // { name: 'TrendAnalysis', component: lazy(() => import("app/components/ui/TrendAnalysis")) },
  // { name: 'RunningAds', component: lazy(() => import("app/components/ui/RunningAds")) }
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
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(""); // new state for selected appId
  const { data: session } = useSession();
  const { searches, addSearch } = useSearchHistory();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      setSubmittedQuery(query);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setSearchResults(data.results);
      } catch (err) {
        console.error(err);
      }
      setTimeout(() => setIsSearching(false), 1000);
    }
  };

  const handleSearchSelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setSubmittedQuery(selectedQuery);
    setShowDashboard(false);
  };

  // When a search result card is clicked, store its appId and pass it to AppScraper
  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    setSubmittedQuery(""); // Clear submitted query to hide search results
    setSearchResults([]);  // Clear the search results
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-96 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Platform</h2>
            <p className="text-gray-600 text-sm">Sign in to continue</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="w-full px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium flex items-center justify-center gap-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
              <path fill="#EA4335" d="M24 9.5c3.4 0 6.1 1.5 7.5 2.9l5.6-5.6C33.3 4.5 29.1 2 24 2 14.8 2 6.7 7.4 3 15.2l6.5 5C11.2 13.2 17.3 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.5-.1-2.5-.4-3.5H24v6.6h12.6c-.5 3.2-2 6-4.4 7.9l6.8 5.2C43.5 37.2 46.1 31.9 46.1 24.5z" />
              <path fill="#FBBC05" d="M9.6 28.6c-1.8-3.3-1.8-6.9 0-10.2L3 13.4C-1.1 19.2-1.1 28.8 3 34.6l6.6-6.0z" />
              <path fill="#34A853" d="M24 46c6.5 0 12-2.2 16-6.1l-7.6-6.3c-2.1 1.5-4.8 2.5-8.4 2.5-6.5 0-12-4.4-14-10.3l-7.6 6.1C6.8 41 14.6 46 24 46z" />
              <path fill="none" d="M2 2h44v44H2z" />
            </svg>
            <p className="text-black">Continue with Google</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-container pt-16">
      <Navbar onDashboardToggle={() => setShowDashboard(!showDashboard)} />
      <AnimatePresence>
        {showDashboard && (
          <Dashboard searches={searches} onSearchSelect={handleSearchSelect} onClose={() => setShowDashboard(false)} />
        )}
      </AnimatePresence>

      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-5xl font-bold mb-8 tracking-wide"
      >
        Peekaboo
      </motion.h1>

      {/* When no app is selected, show search form and results */}
      {!selectedAppId && (
        <>
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
              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {searchResults.map((app) => (
                    <div
                      key={app.appId}
                      className="p-4 bg-gray-800 rounded shadow cursor-pointer hover:bg-gray-700"
                      onClick={() => handleAppSelect(app.appId)}
                    >
                      {/* Display the app icon if available */}
                      {app.icon && (
                        <img
                          src={app.icon}
                          alt={`${app.title} icon`}
                          className="w-16 h-16 rounded-full mb-2"
                        />
                      )}
                      <h3 className="text-xl font-bold">{app.title}</h3>
                      <p className="text-gray-400">
                        Rating: {app.score ? Number(app.score).toFixed(1) : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </Suspense>
        </>
      )}

      {/* When an app is selected, show a Back button and the app details via AppScraper */}
      {selectedAppId && (
        <div>
          <button
            onClick={() => {
              setSelectedAppId("");
              setQuery("");
            }}
            className="mb-4 text-blue-500 hover:underline"
          >
            Back to Search
          </button>
          {/* Pass the selected app's appId as the "query" prop */}
          <Suspense fallback={<div className="results-loader">Loading app details...</div>}>
            <AppScraper query={selectedAppId} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default Page;
