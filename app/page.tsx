"use client";

import React, { useState, Suspense, useEffect } from "react";
import { createClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Menu, Save } from "lucide-react";

// Import components
import { SideHistory } from "@/app/components/SideHistory";
import ImageResult from "@/app/components/ImageResult";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import PlayStoreAnalytics from "@/app/components/PlayStoreAnalytics";
import RedditAnalytics from "@/app/components/RedditAnalytics";
import YouTubeVideos from "@/app/components/YTvideos";
import QuoraAnalysis from "@/app/components/QuoraAnalysis";
import XAnalytics from "@/app/components/XAnalytics";
import FacebookAdsAnalytics from "@/app/components/FacebookAdsAnalytics";
import StrategyAnalysis from "@/app/components/StrategyAnalysis";

// Styles
import "app/styles/page.css";

// Environment Configuration
const {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
  NEXT_PUBLIC_SITE_URL: siteUrl = "http://localhost:3000"
} = process.env;

// Type Definitions
type PropType = 'query' | 'keyword';

interface SearchComponentConfig {
  name: string;
  component: React.ComponentType<QueryProps | KeywordProps>;
  propType: PropType;
}

interface QueryProps {
  query: string;
}

interface KeywordProps {
  keyword: string;
}

// Supabase Client Configuration
const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

// Constant Component Configurations
const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  { name: 'ImageResult', component: ImageResult, propType: 'query' },
  { name: 'GoogleAnalytics', component: GoogleAnalytics, propType: 'query' },
  { name: 'PlayStoreAnalytics', component: PlayStoreAnalytics, propType: 'query' },
  { name: 'RedditAnalytics', component: RedditAnalytics, propType: 'query' },
  { name: 'YouTubeVideos', component: YouTubeVideos, propType: 'query' },
  { name: 'QuoraAnalysis', component: QuoraAnalysis, propType: 'query' },
  { name: 'XAnalytics', component: XAnalytics, propType: 'query' },
  { name: 'FacebookAdsAnalysis', component: FacebookAdsAnalytics, propType: 'keyword' },
  { name: 'StrategyAnalysis', component: StrategyAnalysis, propType: 'query' },
];

// Utility Functions
const safeStringify = (obj: unknown): string => {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    if (typeof value === 'function') return undefined;
    if (['Provider', 'context'].includes(key)) return undefined;
    return value;
  }, 2);
};

const captureImagesBase64 = () => 
  Array.from(document.images).map(img => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      return {
        src: img.src,
        base64: canvas.toDataURL('image/png'),
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt
      };
    } catch {
      return {
        src: img.src,
        base64: null,
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt
      };
    }
  });

// Component Definitions
const SearchForm: React.FC<SearchFormProps> = ({ 
  query, 
  setQuery, 
  handleSearch, 
  isSearching 
}) => (
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
        disabled={isSearching}
      >
        {isSearching ? "Searching..." : "Search"}
      </button>
    </div>
  </form>
);

const ResultsSection: React.FC<ResultsSectionProps> = ({ 
  submittedQuery, 
  activeComponents 
}) => (
  <div className="results-container">
    <Suspense fallback={<div className="results-loader text-white">Loading components...</div>}>
      {SEARCH_COMPONENTS
        .filter(comp => activeComponents.includes(comp.name))
        .map((config) => (
          <div
            key={config.name}
            className="result-card bg-black text-white border border-gray-800"
            data-component={config.name.toLowerCase()}
          >
            {config.propType === 'query' 
              ? React.createElement(config.component as React.ComponentType<QueryProps>, { query: submittedQuery })
              : React.createElement(config.component as React.ComponentType<KeywordProps>, { keyword: submittedQuery })
            }
          </div>
        ))}
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

  // Search and Component Management Methods
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const componentsToSearch = activeComponents.length > 0 
      ? activeComponents 
      : SEARCH_COMPONENTS.map(comp => comp.name);

    setSubmittedQuery(query);
    setActiveComponents(componentsToSearch);
    setIsSearching(true);

    setTimeout(() => setIsSearching(false), 1500);
  };

  const toggleComponent = (componentName: string) => {
    setActiveComponents(prev => 
      prev.includes(componentName)
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName]
    );
  };

  // Authentication Methods
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

  // Save Functionality
  const handleSave = async () => {
    if (!user) return;
  
    try {
      const captureApplicationState = () => ({
        query: submittedQuery || '',
        activeComponents: activeComponents || [],
        timestamp: new Date().toISOString(),
        userContext: user ? {
          id: user.id,
          email: user.email
        } : null,
        windowInfo: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      });

      const createComprehensiveSnapshot = () => {
        const snapshotData = {
          applicationState: captureApplicationState(),
          images: captureImagesBase64(),
        };

        const snapshotScript = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Peekaboo Comprehensive Snapshot</title>
  <script id="__PEEKABOO_SNAPSHOT__" type="application/json">
  ${safeStringify(snapshotData)}
  </script>
</head>
<body>
  <!-- Snapshot preserved from original page -->
  ${document.documentElement.innerHTML}
</body>
</html>
`;
  
        return snapshotScript;
      };
      
      const snapshotData = createComprehensiveSnapshot();
      const fileName = `search_reports/${user.id}/${Date.now()}_comprehensive.html`;
      
      const snapshotBlob = new Blob([snapshotData], { type: 'text/html' });
      
      const { error: uploadError } = await supabase.storage
        .from('search_reports')
        .upload(fileName, snapshotBlob, {
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
      
      alert('Comprehensive snapshot saved successfully!');
    } catch (error) {
      console.error('Snapshot capture error:', error);
      alert('Failed to save comprehensive snapshot');
    }
  };

  // Render Logic
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="p-8 rounded-lg bg-gray-900 text-white">
          <h1 className="text-3xl mb-6 text-center">Peekaboo</h1>
          <div className="flex justify-center">
            <button 
              onClick={handleSignIn}
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

      <div className="component-toggle-container flex justify-center space-x-2 my-4">
        {SEARCH_COMPONENTS.map(({ name }) => (
          <button
            key={name}
            onClick={() => toggleComponent(name)}
            className={`glass-toggle ${activeComponents.includes(name) 
              ? 'active bg-white/30 text-white' 
              : 'bg-black/50 text-white/50'} 
              w-4 h-4 rounded-full transition-all duration-300 ease-in-out hover:scale-105`}
            data-component={name.toLowerCase()}
            aria-label={`Toggle ${name}`}
          />
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
