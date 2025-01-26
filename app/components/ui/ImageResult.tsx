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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
        setError(
          error instanceof Error 
            ? error.message 
            : "An error occurred while fetching images"
        );
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (trackRef.current) {
      trackRef.current.style.transform = "translateX(0px)";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current || !trackRef.current) return;

    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - sliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      sliderRef.current.scrollLeft = scrollLeft - walk;
    } else {
      const slider = sliderRef.current;
      const track = trackRef.current;

      const sliderWidth = slider.offsetWidth;
      const trackWidth = track.scrollWidth;
      const maxScroll = trackWidth - sliderWidth;

      const mouseX = e.clientX - slider.getBoundingClientRect().left;
      const percentage = mouseX / sliderWidth;
      const scrollAmount = percentage * maxScroll;

      track.style.transform = `translateX(-${scrollAmount}px)`;
    }
  };

  // Fallback image for broken links
  const FallbackImage = "/path/to/fallback/image.png";

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`images-container ${className}`}>
      <div className="images-header">
        <h2 className="images-heading">{heading}</h2>
        <p className="images-subheading">Scroll, drag, or hover to explore</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      ) : images.length > 0 ? (
        <div
          className="images-slider"
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div
            className="images-track"
            ref={trackRef}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="image-card"
              >
                <div className="image-wrapper">
                  <Image
                    src={image.link || image.thumbnail || FallbackImage}
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
                  <span className="image-title">
                    {image.title || `Image ${index + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">
          No results found for &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
};

export default ImageResult;