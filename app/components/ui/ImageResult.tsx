import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "../../styles/images.css";
import { searchImages } from "../../api/imageSearchApi";

// Define more robust image interface
interface ImageResult {
  link: string;
  title?: string;
  thumbnail?: string;
}

interface ImageResultProps {
  query: string;
  className?: string;
  heading?: string;
  limit?: number;
}

const ImageResult: React.FC<ImageResultProps> = ({ 
  query, 
  className = "", 
  heading = "Explore Related Images",
  limit = 10 
}) => {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isLazyLoad, setIsLazyLoad] = useState<boolean>(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const results = await searchImages(query);
        if (results && results.length > 0) {
          // Limit the number of images and filter out invalid links
          const validImages = results
            .slice(0, limit)
            .filter(img => img.link && isValidImageUrl(img.link));
          setImages(validImages);
        } else {
          setError("No images found");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred while fetching images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [query, limit]);

  // Utility function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    try {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some(ext => url.toLowerCase().includes(ext));
    } catch {
      return false;
    }
  };

  const FallbackImage = "/path/to/fallback/image.png";

  const handleLazyLoad = () => {
    setIsLazyLoad(true);
  };

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.addEventListener("scroll", handleLazyLoad);
    }

    return () => {
      if (sliderRef.current) {
        sliderRef.current.removeEventListener("scroll", handleLazyLoad);
      }
    };
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`images-container ${className}`} ref={sliderRef}>
      <div className="images-header">
        <h2 className="images-heading">{heading}</h2>
        <p className="images-subheading">Scroll, drag, or hover to explore</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      ) : images.length > 0 ? (
        <div className="images-slider">
          {images.map((image, index) => (
            <div key={index} className="image-card">
              <div className="image-wrapper">
                <Image
                  src={isLazyLoad ? image.link : FallbackImage} // Lazy load the image on scroll
                  alt={image.title || `Result ${index + 1}`}
                  loading="lazy"
                  width={300}
                  height={200}
                  className="object-cover"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.onerror = null;
                    imgElement.src = FallbackImage;
                  }}
                />
              </div>
              <div className="image-title-container">
                <span className="image-title">{image.title || `Image ${index + 1}`}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">No results found for &quot;{query}&quot;.</div>
      )}
    </div>
  );
};

export default ImageResult;
