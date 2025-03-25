"use client";

import React, { useState, lazy, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import SideHistory from "@/app/components/SideHistory"; // Placeholder import for side history component

// Component configurations remain the same as in previous implementation
interface QueryComponentProps {
  query: string;
}

interface KeywordComponentProps {
  keyword: string;
}

type SearchComponentConfig = 
  | {
      name: string;
      component: React.LazyExoticComponent<React.ComponentType<QueryComponentProps>>;
      propType: 'query';
    }
  | {
      name: string;
      component: React.LazyExoticComponent<React.ComponentType<KeywordComponentProps>>;
      propType: 'keyword';
    };

// Existing SEARCH_COMPONENTS array remains the same
const SEARCH_COMPONENTS: SearchComponentConfig[] = [
  // ... (previous component configurations)
];

const Page: React.FC = () => {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  // Supabase client
  const supabase = createClientComponentClient();

  // Authentication effect
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Login handler
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
    });
    if (error) console.error('Login error:', error);
  };

  // Logout handler
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  // Save results handler
  const saveResults = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      // Collect all current page data
      const pageData = {
        query: submittedQuery,
        activeComponents,
        timestamp: new Date().toISOString(),
        htmlContent: document.documentElement.outerHTML
      };

      const { data, error } = await supabase
        .from('search_results')
        .insert([pageData]);

      if (error) throw error;
      alert('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Failed to save results');
    }
  };

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

  return (
    <div className="search-container relative">
      {/* Side History Component */}
      <div className="absolute top-4 left-4">
        <SideHistory />
      </div>

      {/* Authentication Button */}
      <div className="absolute top-4 right-4">
        {user ? (
          <div className="flex items-center space-x-2">
            <span>{user.email}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Login with Google
          </button>
        )}
      </div>

      {/* Save Button */}
      {user && submittedQuery && (
        <button 
          onClick={saveResults}
          className="absolute bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded shadow-md"
        >
          Save Results
        </button>
      )}

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Enter your query here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input border p-2 w-full"
          />
          <button
            type="submit"
            className="search-button bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      <div className="component-toggle-container flex space-x-2 justify-center my-4">
        {SEARCH_COMPONENTS.map(({ name }) => (
          <button
            key={name}
            onClick={() => toggleComponent(name)}
            className={`px-3 py-1 rounded ${activeComponents.includes(name) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {name}
          </button>
        ))}
      </div>

      {submittedQuery && (
        <div className="results-section">
          <div className="query-display mb-4">
            Showing results for: <span className="font-bold">{submittedQuery}</span>
          </div>

          <Suspense fallback={<div>Loading components...</div>}>
            {SEARCH_COMPONENTS.filter(comp => activeComponents.includes(comp.name)).map((config) => {
              const Component = config.component;
              return (
                <div key={config.name} className="result-card mb-4">
                  {config.propType === 'query' 
                    ? <Component query={submittedQuery} /> 
                    : <Component keyword={submittedQuery} />
                  }
                </div>
              );
            })}
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default Page;