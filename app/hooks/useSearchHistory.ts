"use client";

import { useState, useEffect } from "react";

interface SearchResult {
  query: string;
  timestamp: string;
}

export const useSearchHistory = () => {
  const [searches, setSearches] = useState<SearchResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setSearches(JSON.parse(saved));
  }, []);

  const addSearch = (query: string) => {
    const newSearch = {
      query,
      timestamp: new Date().toISOString(),
    };
    const updated = [newSearch, ...searches.slice(0, 19)];
    setSearches(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  return { searches, addSearch };
};