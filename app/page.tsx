"use client";

import React, { useState, Suspense, useEffect } from "react";
import { createClient, User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import "app/styles/page.css";

// Import components
import ImageResult from "@/app/components/ImageResult";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import PlayStoreAnalytics from "@/app/components/PlayStoreSelector";
import RedditAnalytics from "@/app/components/RedditAnalytics";
import YouTubeVideos from "@/app/components/YTvideos";
import QuoraAnalysis from "@/app/components/QuoraAnalysis";
import XAnalytics from "@/app/components/XAnalytics";
import FacebookAdsAnalytics from "@/app/components/FacebookAdsAnalytics";
import StrategyAnalysis from "@/app/components/StrategyAnalysis";

// Initialize Supabase client with proper site URL for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

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

// Interface for specialized queries
interface SpecializedQueries {
  [key: string]: string;
}

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
        {isSearching ? "Analyzing..." : "Search"}
      </button>
    </div>
  </form>
);

interface ResultsSectionProps {
  submittedQuery: string;
  activeComponents: string[];
  specializedQueries: SpecializedQueries;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ 
  submittedQuery, 
  activeComponents,
  specializedQueries 
}) => (
  <div className="results-container">
    <Suspense fallback={<div className="results-loader text-white">Loading components...</div>}>
      {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map((config) => {
        const optimizedQuery = specializedQueries[config.name] || submittedQuery;
        
        if (config.propType === 'query') {
          const Component = config.component;
          return (
            <div
              key={config.name}
              className="result-card bg-black text-white border border-gray-800"
              data-component={config.name.toLowerCase()}
            >
              <Component query={optimizedQuery} />
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
              <Component keyword={optimizedQuery} />
            </div>
          );
        }
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
  const [specializedQueries, setSpecializedQueries] = useState<SpecializedQueries>({});

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

  // Function to generate specialized queries using Groq API
  const generateSpecializedQueries = async (userQuery: string): Promise<SpecializedQueries> => {
    try {
      const prompt = `
You are a query optimization expert. Given the user's search query: "${userQuery}", 
generate specialized, optimized search queries for different platforms and search engines. 
Don't add Random Words, Only add same or relatable words or only just structure the query properly.
Return ONLY a JSON object with the following structure, with NO additional explanation:

{
  "ImageResult": "optimized query for Google Images",
  "GoogleAnalytics": "optimized query for Google Search",
  "PlayStoreAnalytics": "relevant app names only",
  "RedditAnalytics": "optimized query for direct search on Reddit",
  "YouTubeVideos": "optimized query for YouTube API",
  "QuoraAnalysis": "optimized query for Quora API",
  "XAnalytics": "optimized query for Twitter/X API",
  "FacebookAdsAnalysis": "optimized keyword for Facebook Ads Library",
  "StrategyAnalysis": "optimized query for Google Search"
}

Guidelines:
- For ImageResult: Add terms like "aesthetic","image", "visual", "picture" if appropriate
- For GoogleAnalytics: Create a comprehensive search query add words like "study" or "research" or "benifits" if appropriate
- For PlayStoreAnalytics: Only include app name or app categories, no other terms
- For RedditAnalytics: Format for Reddit-specific search, dont use site:, dont mention subreddits add words like "study" or "research" or "benifits" if appropriate
- For YouTubeVideos: Format for video search, include terms like "study", "research" if appropriate
- For QuoraAnalysis: Format as questions when possible
- For XAnalytics: Include relevant hashtags with # symbol if appropriate
- For FacebookAdsAnalysis: Focus on advertiser name or product type or product name, only one name, or name of the possible advertiser
- For StrategyAnalysis: Create a comprehensive search query for strategic analysis

Remember to return ONLY the JSON object with no additional text.
`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      try {
        // Handle when the response includes markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
        
        const jsonString = jsonMatch[1] || content;
        const parsed = JSON.parse(jsonString.trim());
        return parsed;
      } catch (parseError) {
        console.error("Failed to parse Groq response:", parseError);
        console.log("Raw response:", content);
        return {};
      }
    } catch (error) {
      console.error("Error generating specialized queries:", error);
      return {};
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const componentsToSearch = activeComponents.length > 0 
      ? activeComponents 
      : SEARCH_COMPONENTS.map(comp => comp.name);

    setSubmittedQuery(query);
    setActiveComponents(componentsToSearch);
    setIsSearching(true);

    try {
      // Generate specialized queries using Groq
      const optimizedQueries = await generateSpecializedQueries(query);
      setSpecializedQueries(optimizedQueries);
    } catch (error) {
      console.error("Error in query optimization:", error);
    } finally {
      setIsSearching(false);
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
              specializedQueries: specializedQueries || {},
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
          specialized_queries: specializedQueries,
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
          specializedQueries={specializedQueries}
        />
      )}
    </div>
  );
};

export default Page;