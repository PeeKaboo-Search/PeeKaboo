"use client";

import React, { useState, lazy, Suspense, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, X, Save, LogOut } from "lucide-react";
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

// Supabase Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    name: 'YouTubeVideos', 
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
    <div className="search-bar-wrapper">
      <input
        type="text"
        placeholder="Enter your query here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input bg-black text-white"
      />
      <button
        type="submit"
        className="search-button bg-white text-black"
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
        if (config.propType === 'query') {
          const Component = config.component;
          return (
            <div
              key={config.name}
              className="result-card bg-black text-white border border-gray-800"
            >
              <Component query={submittedQuery} />
            </div>
          );
        }

        const Component = config.component;
        return (
          <div
            key={config.name}
            className="result-card bg-black text-white border border-gray-800"
          >
            <Component keyword={submittedQuery} />
          </div>
        );
      })}
    </Suspense>
  </div>
);

const Page: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);
  const [isSideHistoryOpen, setIsSideHistoryOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  const handleSave = async () => {
    if (!user) return;

    try {
      // Create a complete HTML snapshot of the current page
      const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peekaboo Search Report</title>
  <style>
    /* Inline all critical CSS */
    body { 
      background-color: black; 
      color: white; 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 0; 
    }
    .search-container { 
      min-height: 100vh; 
      padding: 20px; 
    }
    .main-heading { 
      text-align: center; 
      font-size: 2.5rem; 
      margin-bottom: 20px; 
    }
    .search-form { 
      display: flex; 
      justify-content: center; 
      margin-bottom: 20px; 
    }
    .search-input { 
      background-color: black; 
      color: white; 
      border: 1px solid gray; 
      padding: 10px; 
      width: 300px; 
    }
    .search-button { 
      background-color: white; 
      color: black; 
      border: none; 
      padding: 10px 20px; 
    }
    .results-container { 
      display: flex; 
      flex-wrap: wrap; 
      justify-content: center; 
      gap: 20px; 
    }
    .result-card { 
      background-color: black; 
      border: 1px solid #333; 
      padding: 15px; 
      width: 100%; 
      max-width: 600px; 
    }
  </style>
</head>
<body>
  <div class="search-container">
    <h1 class="main-heading">Peekaboo</h1>
    
    <div class="search-form">
      <input type="text" class="search-input" placeholder="Search Query: ${submittedQuery}" disabled>
      <button class="search-button">Search</button>
    </div>

    <div class="results-container">
      ${activeComponents.map(compName => `
        <div class="result-card">
          <h2>${compName} Results</h2>
          <p>Results for query: ${submittedQuery}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
      `;

      // Generate a unique filename
      const fileName = `search_reports/${user.id}/${Date.now()}.html`;

      // Convert string to Blob
      const htmlBlob = new Blob([fullHTML], { type: 'text/html' });

      // Upload HTML to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('search_reports')
        .upload(fileName, htmlBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL of the uploaded HTML
      const { data: { publicUrl } } = supabase.storage
        .from('search_reports')
        .getPublicUrl(fileName);

      // Save search history with HTML link
      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          query: submittedQuery,
          active_components: activeComponents,
          html_url: publicUrl,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Search saved successfully! HTML report generated and stored.');
    } catch (error) {
      console.error('Error saving search:', error);
      alert('Failed to save search');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // If no user, show login page
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
              className="bg-white text-black px-4 py-2 rounded"
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
      {/* Side History Drawer */}
      <SideHistory 
        isOpen={isSideHistoryOpen} 
        onClose={() => setIsSideHistoryOpen(false)}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* History Toggle Button */}
      <button 
        onClick={() => setIsSideHistoryOpen(!isSideHistoryOpen)}
        className="fixed top-4 left-4 z-50 bg-white/20 backdrop-blur-sm p-2 rounded-full"
      >
        {isSideHistoryOpen ? <X className="text-white" /> : <Menu className="text-white" />}
      </button>

      {/* Save Button */}
      <button 
        onClick={handleSave} 
        className="fixed bottom-4 right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all"
      >
        <Save className="text-white" />
      </button>

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

      <div className="component-toggle-container flex justify-center space-x-2 my-4">
        {SEARCH_COMPONENTS.map(({ name }) => (
          <button
            key={name}
            onClick={() => toggleComponent(name)}
            className={`glass-toggle ${activeComponents.includes(name) 
              ? 'active bg-white/30 text-white' 
              : 'bg-black/50 text-white/50'} 
              px-2 py-1 rounded-full transition-all duration-300 ease-in-out hover:scale-105 flex items-center justify-center`}
            data-component={name.toLowerCase()}
            aria-label={`Toggle ${name}`}
          >
            <span className="w-2 h-2 rounded-full" style={{
              backgroundColor: activeComponents.includes(name) ? 'white' : 'rgba(255,255,255,0.3)'
            }}></span>
          </button>
        ))}
      </div>

      {submittedQuery && (
        <div className="query-display text-center my-4">
          Showing results for: <span className="query-text">{submittedQuery}</span>
        </div>
      )}

      {submittedQuery && (
        <ResultsSection 
          submittedQuery={submittedQuery} 
          activeComponents={activeComponents} 
        />
      )}
    </div>
  );
};

export default Page;