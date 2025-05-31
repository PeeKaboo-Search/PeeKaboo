"use client";

import React, { useState, useEffect } from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import "styles/page.css";

// Import new components
import AuthComponent from "@/app/components/main/AuthComponent";
import SearchForm from "@/app/components/main/SearchForm";
import ComponentToggle from "@/app/components/main/ComponentToggle"
import ResultsSection from "@/app/components/main/ResultsSection";

// Import services and config
import { supabase } from "@/lib/supabase";
import { SEARCH_COMPONENTS } from "@/config/searchComponents";
import { generateSpecializedQueries } from "@/app/api/main/smartQuery";
import { saveResults } from "@/app/api/main/save";
import { SpecializedQueries } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const Page: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);
  const [isSideHistoryOpen, setIsSideHistoryOpen] = useState(false);
  const [allOptimizedQueries, setAllOptimizedQueries] = useState<SpecializedQueries>({});

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const componentsToSearch = activeComponents.length > 0 
      ? activeComponents 
      : SEARCH_COMPONENTS.map(comp => comp.name);

    setSubmittedQuery(query);
    setIsSearching(true);

    try {
      const optimizedQueries = await generateSpecializedQueries(query);
      setAllOptimizedQueries(optimizedQueries);
      setActiveComponents(componentsToSearch);
    } catch (error) {
      console.error("Error in query optimization:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleComponent = (componentName: string) => {
    setActiveComponents(prev => {
      return prev.includes(componentName)
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName];
    });
  };

  const getCurrentSpecializedQueries = (): SpecializedQueries => {
    const currentQueries: SpecializedQueries = {};
    activeComponents.forEach(componentName => {
      if (allOptimizedQueries[componentName]) {
        currentQueries[componentName] = allOptimizedQueries[componentName];
      }
    });
    return currentQueries;
  };

  const handleSave = async () => {
    if (!user) return;
    await saveResults(user, submittedQuery, allOptimizedQueries, activeComponents);
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return <AuthComponent onSignIn={handleSignIn} />;
  }

  return (
    <div className="search-container bg-black min-h-screen text-white relative">
      <SideHistory 
        isOpen={isSideHistoryOpen} 
        onClose={() => setIsSideHistoryOpen(false)}
        user={user}
        onSignOut={handleSignOut}
      />

      {!isSideHistoryOpen && (
        <button 
          onClick={() => setIsSideHistoryOpen(!isSideHistoryOpen)}
          className="fixed top-4 left-4 z-50 bg-white/20 backdrop-blur-sm p-2 rounded-full"
          aria-label="Open history menu"
        >
          <Menu className="text-white" />
        </button>
      )}

      <div className="floating-save-container absolute right-8 top-8 z-50">
        <button 
          onClick={handleSave} 
          className="
            bg-white/10 hover:bg-white/20 
            backdrop-blur-md 
            p-3 rounded-full 
            shadow-lg hover:shadow-xl
            transition-all duration-300 ease-in-out
            flex items-center justify-center
            border border-white/10 hover:border-white/30"
          aria-label="Save current search"
        >
          <Save className="text-white/80 hover:text-white w-6 h-6" />
        </button>
      </div>

      <div className="background-layer" />

      <h1 className="main-heading text-white text-center text-4xl my-8">
        Peekaboo
      </h1>

      <div className="search-section">
        <SearchForm
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          isSearching={isSearching}
        />
      </div>

      <ComponentToggle 
        activeComponents={activeComponents}
        toggleComponent={toggleComponent}
      />

      {submittedQuery && (
        <div className="query-display text-center my-4">
          Showing results for: <span className="query-text">{submittedQuery}</span>
        </div>
      )}

      {submittedQuery && (
        <ResultsSection 
          submittedQuery={submittedQuery} 
          activeComponents={activeComponents}
          specializedQueries={getCurrentSpecializedQueries()}
        />
      )}
    </div>
  );
};

export default Page;