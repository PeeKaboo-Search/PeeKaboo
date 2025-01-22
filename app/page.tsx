"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBot from "app/components/ui/FloatingBot";
import {
  fadeInUp,
  staggerChildren,
  searchBarVariants,
  logoVariants,
} from "app/styles/animations-page"; // Importing animations
import "app/styles/page.css"; // Importing general styles

// Lazy load components
const ImageResult = lazy(() => import("app/components/ui/ImageResult"));
const GoogleAnalytics = lazy(() => import("app/components/ui/GoogleAnalytics"));
const RedditAnalytics = lazy(() => import("app/components/ui/RedditAnalytics"));
const YoutubeAnalysis = lazy(() => import("app/components/ui/YoutubeAnalysis"));
const TrendAnalysis = lazy(() => import("app/components/ui/TrendAnalysis"));
const SentimentAnalysis = lazy(() => import("app/components/ui/SentimentAnalysis"));
const NewsResults = lazy(() => import("app/components/ui/NewsResults"));
const Summary = lazy(() => import("app/components/ui/Summary"));
const StoryBoard = lazy(() => import("app/components/ui/StoryBoard"));

const Page: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== "") {
      setIsSearching(true);
      setSubmittedQuery(query); // Set the submitted query
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {/* Logo Section */}
      <AnimatePresence mode="wait">
        {!submittedQuery && (
          <motion.div
            variants={logoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mb-6 text-4xl font-light text-blue-600 tracking-wide"
          >
            <motion.span
              animate={{
                background: [
                  "rgba(59, 130, 246, 0.05)",
                  "rgba(59, 130, 246, 0)",
                  "rgba(59, 130, 246, 0.05)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="px-6 py-3 rounded-xl"
            >
              PeeKaboo
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar Section */}
      <motion.div
        layout
        className={`w-full flex justify-center ${submittedQuery ? "mt-6" : "mt-0"}`}
        transition={{ duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] }}
      >
        <form onSubmit={handleSearch} className="flex w-full max-w-4xl">
          <motion.div
            className="flex flex-grow shadow-lg rounded-xl overflow-hidden"
            variants={searchBarVariants}
            animate={isSearching ? "focused" : "unfocused"}
          >
            <input
              type="text"
              placeholder="Enter your query here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-6 py-4 border-0 focus:outline-none text-lg text-gray-700 bg-white placeholder-gray-400"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
              type="submit"
              className="px-10 py-4 bg-blue-500 text-white font-medium text-lg tracking-wide focus:outline-none hover:bg-blue-600"
            >
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="text-xl"
                >
                  ○
                </motion.div>
              ) : (
                "Search"
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>

      {/* Display Query */}
      <AnimatePresence mode="wait">
        {submittedQuery && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mt-6 text-gray-600 text-xl font-light tracking-wide"
          >
            Showing results for:{" "}
            <motion.span
              initial={{ color: "#3B82F6" }}
              animate={{
                color: ["#3B82F6", "#2563EB", "#3B82F6"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="font-normal"
            >
              {submittedQuery}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Components */}
      <Suspense fallback={<div className="text-center py-8">Loading results...</div>}>
        <AnimatePresence mode="wait">
          {submittedQuery && (
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-8xl mt-10 space-y-6 px-8"
            >
              {/* Display all components */}
              {/*{[ImageResult, GoogleAnalytics, RedditAnalytics, YoutubeAnalysis, TrendAnalysis, SentimentAnalysis, NewsResults, Summary, StoryBoard]*/}
              {[SentimentAnalysis, NewsResults, Summary, StoryBoard].map(
                (Component, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    layout
                    className="overflow-hidden rounded-xl shadow-md"
                  >
                    <Component query={submittedQuery} />
                  </motion.div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>

      {/* Floating Bot */}
      {submittedQuery && !isSearching && <FloatingBot />}
    </div>
  );
};

export default Page;
