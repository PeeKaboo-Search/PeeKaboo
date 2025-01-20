import React from "react";

interface ImageResultProps {
  query: string;
}

const ImageResult: React.FC<ImageResultProps> = ({ query }) => {
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trend Analysis</h2>
      <p className="text-gray-500">This is a placeholder for Trend Analysis for query: "{query}"</p>
      <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Trend Analysis will appear here.</span>
      </div>
    </div>
  );
};

export default ImageResult;
