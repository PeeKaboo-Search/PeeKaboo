"use client";

import { motion } from "framer-motion";

interface DashboardProps {
  searches: { query: string; timestamp: string }[];
  onSearchSelect: (query: string) => void;
  onClose: () => void;
}

export const Dashboard = ({ searches, onSearchSelect, onClose }: DashboardProps) => {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[25vw] bg-gray-900 border-r border-gray-800 overflow-y-auto z-40"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Search History</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-full"
          >
            ×
          </button>
        </div>
        {searches.length === 0 ? (
          <p className="text-gray-400">No past searches</p>
        ) : (
          searches.map((search, index) => (
            <div
              key={index}
              onClick={() => onSearchSelect(search.query)}
              className="p-3 mb-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="font-medium truncate">{search.query}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(search.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};