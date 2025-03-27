"use client";

import React, { useState, Suspense, useEffect } from "react";
import { createClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import "app/styles/page.css";

// Import components
import ImageResult from "@/app/components/ImageResult";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import PlayStoreAnalytics from "@/app/components/PlayStoreAnalytics";
import RedditAnalytics from "@/app/components/RedditAnalytics";
import YouTubeVideos from "@/app/components/YTvideos";
import QuoraAnalysis from "@/app/components/QuoraAnalysis";
import XAnalytics from "@/app/components/XAnalytics";
import FacebookAdsAnalytics from "@/app/components/FacebookAdsAnalytics";
import StrategyAnalysis from "@/app/components/StrategyAnalysis";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Component prop interfaces
interface QueryProps {
  query: string;
}

interface KeywordProps {
  keyword: string;
}

type SearchComponentConfig = 
  | {
      name: string;
      component: React.ComponentType<QueryProps>;
      propType: 'query';
    }
  | {
      name: string;
      component: React.ComponentType<KeywordProps>;
      propType: 'keyword';
    };

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

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  isSearching: boolean;
}

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

interface ResultsSectionProps {
  submittedQuery: string;
  activeComponents: string[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ 
  submittedQuery, 
  activeComponents 
}) => (
  <div className="results-container">
    <Suspense fallback={<div className="results-loader text-white">Loading components...</div>}>
      {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map((config) => {
        if (config.propType === 'query') {
          const Component = config.component;
          return (
            <div
              key={config.name}
              className="result-card bg-black text-white border border-gray-800"
              data-component={config.name.toLowerCase()}
            >
              <Component query={submittedQuery} />
            </div>
          );
        } else {
          const Component = config.component;
          return (
            <div
              key={config.name}
              className="result-card bg-black text-white border border-gray-800"
              data-component={config.name.toLowerCase()}
            >
              <Component keyword={submittedQuery} />
            </div>
          );
        }
      })}
    </Suspense>
  </div>
);

// Type-safe React internal property access
interface ReactFiber {
  memoizedProps?: Record<string, unknown>;
  type?: {
    name?: string;
    displayName?: string;
  };
}

interface ReactInternalProps {
  [key: string]: unknown;
}

interface ReactElement extends HTMLElement, ReactInternalProps {}

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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
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
      const captureComprehensivePage = async () => {
        return new Promise<string>((resolve, reject) => {
          const safeStringify = (obj: unknown) => {
            const cache = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                  return '[Circular]';
                }
                cache.add(value);
              }

              if (typeof value === 'function') return undefined;
              if (key === 'Provider' || key === 'context') return undefined;
              
              return value;
            }, 2);
          };

          const captureImagesBase64 = () => {
            return Array.from(document.images).map(img => {
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
          };

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

          const captureComponentData = () => {
            const componentData: Array<{
              type: string;
              props: Record<string, unknown>;
              elementId: string;
              elementClass: string;
              elementType: string;
            }> = [];

            const extractComponentInfo = (element: ReactElement) => {
              const reactKeys = Object.keys(element).filter(key => 
                key.startsWith('__reactFiber$') || key.startsWith('__reactProps$')
              );

              reactKeys.forEach(reactKey => {
                const fiberOrProps = element[reactKey as keyof ReactElement];
                
                if (typeof fiberOrProps === 'object' && fiberOrProps !== null) {
                  const extractSafeProps = (props: unknown): Record<string, unknown> => {
                    if (typeof props !== 'object' || props === null) return {};
                    const safeProps: Record<string, unknown> = {};
                    
                    Object.entries(props).forEach(([key, value]) => {
                      if (typeof value !== 'function' && 
                          key !== 'children' && 
                          key !== 'Provider' && 
                          key !== 'context') {
                        try {
                          safeProps[key] = JSON.parse(JSON.stringify(value));
                        } catch {
                          safeProps[key] = String(value);
                        }
                      }
                    });
                    
                    return safeProps;
                  };

                  const componentInfo = {
                    type: reactKey.includes('Fiber') ? 
                      ((fiberOrProps as ReactFiber)?.type?.name || 
                       (fiberOrProps as ReactFiber)?.type?.displayName || 
                       'Unknown') : 'Props',
                    props: extractSafeProps(
                      reactKey.includes('Fiber') ? 
                      (fiberOrProps as ReactFiber)?.memoizedProps : 
                      fiberOrProps
                    ),
                    elementId: element.id,
                    elementClass: element.className,
                    elementType: element.tagName.toLowerCase()
                  };

                  componentData.push(componentInfo);
                }
              });

              Array.from(element.children).forEach(child => 
                extractComponentInfo(child as ReactElement)
              );
            };

            extractComponentInfo(document.body as ReactElement);
            return componentData;
          };

          const captureStylesheets = () => {
            const styleContents: string[] = [];
            
            Array.from(document.styleSheets).forEach(sheet => {
              try {
                const rules = Array.from(sheet.cssRules || [])
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
                if (sheet.href) {
                  styleContents.push(`/* External Stylesheet: ${sheet.href} */`);
                }
              }
            });
            
            return styleContents.join('\n');
          };

          const createComprehensiveSnapshot = () => {
            const snapshotData = {
              applicationState: captureApplicationState(),
              componentData: captureComponentData(),
              images: captureImagesBase64(),
              stylesheets: captureStylesheets()
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
      
      const snapshotData = await captureComprehensivePage();
      
      const fileName = `search_reports/${user.id}/${Date.now()}_comprehensive.html`;
      
      const snapshotBlob = typeof snapshotData === 'string' && snapshotData.startsWith('data:')
        ? await (await fetch(snapshotData)).blob()
        : new Blob([snapshotData], { type: 'text/html' });
      
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