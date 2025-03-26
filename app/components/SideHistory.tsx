"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from "@supabase/supabase-js";
import { X, LogOut, History, User } from "lucide-react";

// Supabase Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// More specific type for user
interface UserProfile {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface SideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSignOut: () => void;
}

interface SavedSearch {
  id: number;
  query: string;
  active_components: string[];
  created_at: string;
  html_url: string;
}

export const SideHistory: React.FC<SideHistoryProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSignOut 
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Use useCallback to memoize the fetch function
  const fetchSavedSearches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, active_components, created_at, html_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  }, [user.id]);

  useEffect(() => {
    if (user && isOpen) {
      fetchSavedSearches();
    }
  }, [user, isOpen, fetchSavedSearches]);

  const openSnapshotInNewTab = (url: string) => {
    if (url) {
      window.open(`/snapshot?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const deleteSearch = async (searchId: number) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 h-full w-96 bg-black/80 backdrop-blur-lg z-40 transform transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <History className="mr-2" /> 
          Saved Searches
        </h2>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-200px)] overflow-y-auto p-4">
        {savedSearches.length === 0 ? (
          <p className="text-white/50 text-center py-4">No saved searches</p>
        ) : (
          savedSearches.map((search) => (
            <div 
              key={search.id}
              className="bg-white/10 p-3 rounded-lg flex justify-between items-center mb-2"
            >
              <div className="flex-grow">
                <p 
                  onClick={() => openSnapshotInNewTab(search.html_url)}
                  className="text-white font-medium truncate cursor-pointer hover:text-blue-300 transition-colors"
                >
                  {search.query}
                </p>
                <p className="text-white/50 text-sm">
                  {new Date(search.created_at).toLocaleString()}
                </p>
                <div className="flex space-x-1 mt-1">
                  {search.active_components.map((component) => (
                    <span 
                      key={component}
                      className="bg-white/20 text-xs px-2 py-0.5 rounded-full"
                    >
                      {component}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => deleteSearch(search.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <button 
          onClick={onSignOut}
          className="w-full bg-white/10 text-white p-3 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="User profile" 
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
          ) : (
            <User className="w-8 h-8 mr-2" />
          )}
          Logout
        </button>
      </div>
    </div>
  );
};