'use client';
import React, { useState, useEffect, useRef } from "react";
import styles from '@/app/styles/StoryBoard.module.css';
import { generateAdConcepts, generateImages } from '@/app/api/storyboard';

interface ImageResult {
  url?: string;
  error?: boolean;
  prompt: string;
}

interface MediaGalleryProps {
  query: string;
  className?: string;
  heading?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  query, 
  className = "", 
  heading = "AI-Generated Ad Concepts" 
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
    const fetchConcepts = async () => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);

      try {
        // Step 1: Generate ad concepts
        const prompts = await generateAdConcepts(query);
        
        // Step 2: Generate images
        const generatedImages = await generateImages(prompts);
        
        if (generatedImages) {
          setImages(generatedImages);
        } else {
          setError("Failed to generate ad concepts");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while generating ad concepts");
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchConcepts();
    }
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
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={`${styles.galleryContainer} ${className}`}>
      <div className={styles.imagesHeader}>
        <h3 className={styles.imagesHeading}>{heading}</h3>
        <p className={styles.imagesSubheading}>Scroll, drag, or hover to explore</p>
      </div>

      {loading ? (
        <div className={styles.loading}>Generating advertising concepts...</div>
      ) : images.length > 0 ? (
        <div
          className={styles.imagesSlider}
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div
            className={styles.imagesTrack}
            ref={trackRef}
          >
            {images.map((img, index) => (
              <div key={index} className={styles.imageSlide}>
                {img.error ? (
                  <div className={styles.errorPlaceholder}>
                    Image generation failed
                  </div>
                ) : (
                  <img 
                    src={img.url} 
                    alt={`Ad Concept ${index + 1}`} 
                    className={styles.adImage} 
                  />
                )}
                <div className={styles.imageDetails}>
                  <div className={styles.imageCaption}>
                    Concept {index + 1}
                  </div>
                  <div className={styles.promptText}>
                    {img.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">No ad concepts found for "{query}".</div>
      )}
    </div>
  );
};

export default MediaGallery;