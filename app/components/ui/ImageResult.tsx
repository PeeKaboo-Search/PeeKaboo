import React, { useState, useEffect } from "react";
import "../../styles/images.css";
import { searchImages } from "../../api/imageSearchApi";

interface ImageResult {
  link: string;
  title: string;
}

interface ImageResultProps {
  query: string;
  className?: string;
}

const ImageResult: React.FC<ImageResultProps> = ({ query, className = "" }) => {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!query.trim()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const results = await searchImages(query);
        if (results) {
          setImages(results);
        } else {
          setError("Failed to fetch images");
        }
      } catch (err) {
        setError("An error occurred while fetching images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [query]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`images-container ${className}`}>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      ) : images.length > 0 ? (
        <div className="images-slider">
          <div className="images-track">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="image-card"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="image-wrapper">
                  <img
                    src={image.link}
                    alt={image.title || `Result ${index + 1}`}
                    loading="lazy"
                  />
                </div>
                {hoveredIndex === index && (
                  <div className="image-title-hover">
                    {image.title || `Image ${index + 1}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">No results found for "{query}".</div>
      )}
    </div>
  );
};

export default ImageResult;