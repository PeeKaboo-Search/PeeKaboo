import React, { useState, useEffect, useRef } from "react";
import "../../styles/images.css";
import { searchImages } from "../../api/imageSearchApi";

interface ImageResult {
  link: string;
  title: string;
}

interface ImageResultProps {
  query: string;
  className?: string;
  heading?: string;
}

const ImageResult: React.FC<ImageResultProps> = ({ 
  query, 
  className = "", 
  heading = "Explore Related Images" 
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
      // Drag-based scrolling
      e.preventDefault();
      const x = e.pageX - sliderRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Multiplied by 2 to increase scrolling speed
      sliderRef.current.scrollLeft = scrollLeft - walk;
    } else {
      // Hover-based preview scrolling
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
                  <img
                    src={image.link}
                    alt={image.title || `Result ${index + 1}`}
                    loading="lazy"
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
        <div className="no-results">No results found for "{query}".</div>
      )}
    </div>
  );
};

export default ImageResult;
