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
      <h3 className="images-title">Image Results</h3>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading images...</p>
        </div>
      ) : images.length > 0 ? (
        <div className="images-slider">
          <div className="images-track">
            {images.map((image, index) => (
              <div key={index} className="image-card">
                <div className="image-wrapper">
                  <img
                    src={image.link}
                    alt={image.title || `Result ${index + 1}`}
                    loading="lazy"
                  />
                </div>
                <div className="image-title">
                  {image.title || `Image ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="no-results">No results found for "{query}".</p>
      )}
    </div>
  );
};

export default ImageResult;