'use client';

import React, { useState, lazy, Suspense, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import "app/styles/page.css";

// Type Definitions
interface SearchComponentConfig {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  propType: 'query' | 'keyword';
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

interface User {
  id: string;
  email?: string;
}

const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  { 
    name: 'ImageResult', 
    component: lazy(() => import("@/app/components/ImageResult")), 
    propType: 'query' 
  },
  { 
    name: 'GoogleAnalytics', 
    component: lazy(() => import("@/app/components/GoogleAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'PlayStoreAnalytics', 
    component: lazy(() => import("@/app/components/PlayStoreAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'RedditAnalytics', 
    component: lazy(() => import("@/app/components/RedditAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'YouTubeVideos', 
    component: lazy(() => import("@/app/components/YTvideos")),
    propType: 'query' 
  },
  { 
    name: 'QuoraAnalysis', 
    component: lazy(() => import("@/app/components/QuoraAnalysis")), 
    propType: 'query' 
  },
  { 
    name: 'XAnalytics', 
    component: lazy(() => import("@/app/components/XAnalytics")), 
    propType: 'query' 
  },
  { 
    name: 'FacebookAdsAnalysis', 
    component: lazy(() => import("@/app/components/FacebookAdsAnalytics")), 
    propType: 'keyword' 
  },
  { 
    name: 'StrategyAnalysis', 
    component: lazy(() => import("@/app/components/StrategyAnalysis")), 
    propType: 'query' 
  },
];

const SearchForm: React.FC<SearchFormProps> = ({ query, setQuery, handleSearch, isSearching }) => (
  <form onSubmit={handleSearch} className="search-form">
    <div className="search-bar-wrapper">
      <input
        type="text"
        placeholder="Enter your query here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input bg-black text-white"
        disabled={isSearching}
      />
      <button
        type="submit"
        className="search-button bg-white text-black"
        disabled={isSearching}
      >
        {isSearching ? "Searching..." : "Search"}
      </button>
    </div>
  </form>
);

const ResultsSection: React.FC<ResultsSectionProps> = ({ submittedQuery, activeComponents }) => (
  <div className="results-container">
    <Suspense fallback={<div className="results-loader text-white">Loading components...</div>}>
      {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map((config) => {
        const Component = config.component;
        const props = config.propType === 'query' 
          ? { query: submittedQuery } 
          : { keyword: submittedQuery };

        return (
          <div
            key={config.name}
            className="result-card bg-black text-white border border-gray-800"
            data-component={config.name.toLowerCase()}
          >
            <Component {...props} />
          </div>
        );
      })}
    </Suspense>
  </div>
);

const Page: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);
  const [isSideHistoryOpen, setIsSideHistoryOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const componentsToSearch = activeComponents.length > 0 
      ? activeComponents 
      : SEARCH_COMPONENTS.map(comp => comp.name);

    setSubmittedQuery(query);
    setActiveComponents(componentsToSearch);
    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  const toggleComponent = (componentName: string) => {
    setActiveComponents(prev => 
      prev.includes(componentName)
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName]
    );
  };

  const handleSave = async () => {
    if (!user) return;
  
    try {
      const snapshotData = await capturePageSnapshot();
      const fileName = `search_reports/${user.id}/${Date.now()}_comprehensive.html`;
      
      const { error: uploadError } = await supabase.storage
        .from('search_reports')
        .upload(fileName, snapshotData, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'text/html'
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('search_reports')
        .getPublicUrl(fileName);
      
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          query: submittedQuery,
          active_components: activeComponents,
          html_url: publicUrl,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      alert('Snapshot saved successfully!');
    } catch (error) {
      console.error('Error saving snapshot:', error);
      alert('Failed to save snapshot');
    }
  };

  const capturePageSnapshot = async (): Promise<Blob> => {
    const html = document.documentElement.outerHTML;
    return new Blob([html], { type: 'text/html' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="p-8 rounded-lg bg-gray-900 text-white">
          <h1 className="text-3xl mb-6 text-center">Peekaboo</h1>
          <div className="flex justify-center">
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: {
                  queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                  }
                }
              })}
              className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
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
          onClick={() => setIsSideHistoryOpen(true)}
          className="fixed top-4 left-4 z-50 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
          aria-label="Open history"
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
          aria-label="Save search"
        >
          <Save className="text-white/80 hover:text-white w-6 h-6" />
        </button>
      </div>

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

      <div className="component-toggle-container flex justify-center space-x-2 my-4">
        {SEARCH_COMPONENTS.map(({ name }) => (
          <button
            key={name}
            onClick={() => toggleComponent(name)}
            className={`glass-toggle ${activeComponents.includes(name) 
              ? 'active bg-white/30 text-white' 
              : 'bg-black/50 text-white/50'} 
              w-4 h-4 rounded-full transition-all duration-300 ease-in-out hover:scale-105`}
            aria-label={`Toggle ${name}`}
          />
        ))}
      </div>

      {submittedQuery && (
        <>
          <div className="query-display text-center my-4">
            Showing results for: <span className="query-text">{submittedQuery}</span>
          </div>
          <ResultsSection 
            submittedQuery={submittedQuery} 
            activeComponents={activeComponents} 
          />
        </>
      )}
    </div>
  );
};

export default Page;