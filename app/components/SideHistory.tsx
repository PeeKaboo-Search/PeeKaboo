"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { X, LogOut, History } from "lucide-react";

// Supabase Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
}

interface SavedSearch {
  id: number;
  query: string;
  active_components: string[];
  created_at: string;
}

export const SideHistory: React.FC<SideHistoryProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSignOut 
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchSavedSearches();
    }
  }, [user, isOpen]);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, active_components, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const handleSearchSelect = (search: SavedSearch) => {
    setSelectedSearch(search);
  };

  const deleteSearch = async (searchId: number) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      // Remove the deleted search from the list
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
      
      // Clear selected search if it was the deleted one
      if (selectedSearch?.id === searchId) {
        setSelectedSearch(null);
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 h-full w-80 bg-black/80 backdrop-blur-lg z-40 transform transition-transform duration-300 ease-in-out 
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
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <History className="mr-2" /> Saved Searches
        </h2>
      </div>

      {/* Saved Searches List */}
      <div className="overflow-y-auto h-[calc(100%-200px)] p-4 space-y-2">
        {savedSearches.length === 0 ? (
          <p className="text-white/50 text-center py-4">No saved searches</p>
        ) : (
          savedSearches.map((search) => (
            <div 
              key={search.id}
              className={`bg-white/10 p-3 rounded-lg flex justify-between items-center 
                ${selectedSearch?.id === search.id ? 'ring-2 ring-white/30' : ''}`}
            >
              <div 
                onClick={() => handleSearchSelect(search)}
                className="flex-grow cursor-pointer"
              >
                <p className="text-white font-medium truncate">{search.query}</p>
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
              <button 
                onClick={() => deleteSearch(search.id)}
                className="text-red-500 hover:text-red-400 ml-2"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Selected Search Details */}
      {selectedSearch && (
        <div className="absolute bottom-20 left-0 right-0 p-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-2">Search Details</h3>
            <p className="text-white/80">Query: {selectedSearch.query}</p>
            <p className="text-white/80">
              Components: {selectedSearch.active_components.join(', ')}
            </p>
            <p className="text-white/80">
              Date: {new Date(selectedSearch.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <button 
          onClick={onSignOut}
          className="w-full bg-white/10 text-white p-3 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <LogOut className="mr-2" /> Logout
        </button>
      </div>
    </div>
  );
};