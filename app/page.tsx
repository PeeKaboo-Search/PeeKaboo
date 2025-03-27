"use client";

import React, { useState, lazy, Suspense, useEffect, ComponentType, FC } from "react";
import { createClient } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import "app/styles/page.css";

// Import prop types for each component
import { ImageResultProps } from "@/app/components/ImageResult";
import { MarketResearchProps } from "@/app/components/GoogleAnalytics";
import { AppAnalyticsProps } from "@/app/components/PlayStoreAnalytics";
import { RedditAnalyticsProps } from "@/app/components/RedditAnalytics";
import { YouTubeVideosProps } from "@/app/components/YTvideos";
import { QuoraAnalyticsProps } from "@/app/components/QuoraAnalysis";
import { XAnalyticsProps } from "@/app/components/XAnalytics";
import { MetaAdAnalysisProps } from "@/app/components/FacebookAdsAnalytics";
import { MarketingStrategyProps } from "@/app/components/StrategyAnalysis";

// Unified generic props type
type SearchComponentProps = 
  | ImageResultProps 
  | MarketResearchProps 
  | AppAnalyticsProps 
  | RedditAnalyticsProps 
  | YouTubeVideosProps 
  | QuoraAnalyticsProps 
  | XAnalyticsProps 
  | MetaAdAnalysisProps 
  | MarketingStrategyProps;

// Type Definitions
interface SearchComponentConfig {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<SearchComponentProps>>;
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

// Supabase Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  { 
    name: 'ImageResult', 
    component: lazy(() => import("@/app/components/ImageResult").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'GoogleAnalytics', 
    component: lazy(() => import("@/app/components/GoogleAnalytics").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'PlayStoreAnalytics', 
    component: lazy(() => import("@/app/components/PlayStoreAnalytics").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'RedditAnalytics', 
    component: lazy(() => import("@/app/components/RedditAnalytics").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'YouTubeVideos', 
    component: lazy(() => import("@/app/components/YTvideos").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'QuoraAnalysis', 
    component: lazy(() => import("@/app/components/QuoraAnalysis").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'XAnalytics', 
    component: lazy(() => import("@/app/components/XAnalytics").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'query' 
  },
  { 
    name: 'FacebookAdsAnalysis', 
    component: lazy(() => import("@/app/components/FacebookAdsAnalytics").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
    propType: 'keyword' 
  },
  { 
    name: 'StrategyAnalysis', 
    component: lazy(() => import("@/app/components/StrategyAnalysis").then(m => ({ default: m.default as React.ComponentType<SearchComponentProps> }))), 
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
            <Component {...props as SearchComponentProps} />
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

  // [Rest of the code remains the same as in the original implementation]
  const handleSave = async () => {
    if (!user) return;
  
    try {
      const captureComprehensivePage = async () => {
        return new Promise<string>((resolve, reject) => {
          // Safe JSON stringify to handle circular references
          const safeStringify = (obj: unknown) => {
            const cache = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
              // Handle React-specific circular references
              if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                  // Circular reference found, return a placeholder
                  return '[Circular]';
                }
                cache.add(value);
              }
  
              // Remove function references and complex objects
              if (typeof value === 'function') return undefined;
              
              // Handle specific React and Next.js objects
              if (key === 'Provider' || key === 'context') return undefined;
              
              // Stringify simple values
              return value;
            }, 2);
          };
  
          // Capture images safely
          const captureImagesBase64 = () => {
            return Array.from(document.images).map(img => {
              try {
                // Use natural dimensions for more accurate capture
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
              } catch (e) {
                return {
                  src: img.src,
                  base64: null,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  alt: img.alt
                };
              }
            });
          };
  
          // Capture application state safely
          const captureApplicationState = () => {
            return {
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
            };
          };
  
          // Capture component data safely
          const captureComponentData = () => {
            const componentData: Record<string, unknown>[] = [];
  
            const extractComponentInfo = (element: Element) => {
              // Find React fiber node safely
              const reactKey = Object.keys(element).find(key => 
                key.startsWith('__react') && 
                typeof (element as any)[key] === 'object'
              );
  
              if (reactKey) {
                const fiber = (element as any)[reactKey];
                
                // Safely extract props and state
                const extractSafeProps = (props: Record<string, unknown>) => {
                  if (!props) return {};
                  const safeProps: Record<string, unknown> = {};
                  
                  Object.keys(props).forEach(key => {
                    // Skip functions, complex objects, and known problematic keys
                    if (typeof props[key] !== 'function' && 
                        key !== 'children' && 
                        key !== 'Provider' && 
                        key !== 'context') {
                      try {
                        // Attempt to stringify simple values
                        safeProps[key] = JSON.parse(JSON.stringify(props[key]));
                      } catch {
                        // Fallback to basic type or string representation
                        safeProps[key] = String(props[key]);
                      }
                    }
                  });
                  
                  return safeProps;
                };
  
                // Collect safe component information
                const componentInfo = {
                  type: fiber.type?.name || fiber.type?.displayName || 'Unknown',
                  props: extractSafeProps(fiber.memoizedProps),
                  elementId: element.id,
                  elementClass: element.className,
                  elementType: element.tagName.toLowerCase()
                };
  
                componentData.push(componentInfo);
              }
  
              // Recursively process child elements
              Array.from(element.children).forEach(extractComponentInfo);
            };
  
            // Start extraction from body
            extractComponentInfo(document.body);
            return componentData;
          };
  
          // Capture stylesheets safely
          const captureStylesheets = () => {
            const styleContents: string[] = [];
            
            Array.from(document.styleSheets).forEach(sheet => {
              try {
                // Capture CSS rules safely
                const rules = Array.from(sheet.cssRules)
                  .map(rule => {
                    try {
                      return rule.cssText;
                    } catch {
                      return '/* Unable to capture rule */';
                    }
                  })
                  .join('\n');
                styleContents.push(rules);
              } catch {
                // Fallback for cross-origin stylesheets
                if (sheet.href) {
                  styleContents.push(`/* External Stylesheet: ${sheet.href} */`);
                }
              }
            });
            
            return styleContents.join('\n');
          };
  
          // Create comprehensive snapshot
          const createComprehensiveSnapshot = () => {
            // Capture all data safely
            const snapshotData = {
              applicationState: captureApplicationState(),
              componentData: captureComponentData(),
              images: captureImagesBase64(),
              stylesheets: captureStylesheets()
            };
  
            // Create a script tag with the snapshot data
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
  
          // Generate and resolve snapshot
          try {
            const snapshotHTML = createComprehensiveSnapshot();
            const blob = new Blob([snapshotHTML], { type: 'text/html' });
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } catch (error) {
            reject(error);
          }
        });
      };
      
      // Capture the comprehensive page snapshot
      const snapshotData = await captureComprehensivePage();
      
      // Generate unique filename
      const fileName = `search_reports/${user.id}/${Date.now()}_comprehensive.html`;
      
      // Convert base64 to blob
      const snapshotBlob = typeof snapshotData === 'string' && snapshotData.startsWith('data:')
        ? await (await fetch(snapshotData)).blob()
        : new Blob([snapshotData], { type: 'text/html' });
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('search_reports')
        .upload(fileName, snapshotBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'text/html'
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('search_reports')
        .getPublicUrl(fileName);
      
      // Save search history
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
      {!isSideHistoryOpen && (
        <button 
          onClick={() => setIsSideHistoryOpen(!isSideHistoryOpen)}
          className="fixed top-4 left-4 z-50 bg-white/20 backdrop-blur-sm p-2 rounded-full"
        >
          <Menu className="text-white" />
        </button>
      )}

      {/* Save Button */}
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