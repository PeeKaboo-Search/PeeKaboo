'use client';

import React, { useState } from 'react';
import { generateAdConcepts, generateImages } from '@/app/api/storyboard';
import styles from '@/app/styles/StoryBoard.module.css';

interface ImageResult {
  url?: string;
  error?: boolean;
  prompt: string;
}

interface MediaGalleryProps {
  query: string;
}

export default function MediaGallery({ query }: MediaGalleryProps) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMediaGallery = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Generate ad concepts
      const prompts = await generateAdConcepts(query);
      
      // Step 2: Generate images
      const generatedImages = await generateImages(prompts);
      
      setImages(generatedImages);
    } catch (error) {
      console.error("Error in updateMediaGallery:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (query) {
      updateMediaGallery();
    }
  }, [query]);

  if (loading) return <div className={styles.loading}>Generating advertising concepts...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  return (
    <div className={styles.galleryContainer}>
      <h3>AI-Generated Ad Concepts</h3>
      <div className={styles.imagesSlider}>
        {images.map((img, index) => (
          <div key={index} className={styles.imageSlide}>
            {img.error ? (
              <div className={styles.errorPlaceholder}>Image generation failed</div>
            ) : (
              <img 
                src={img.url} 
                alt={`Ad Concept ${index + 1}`} 
                className={styles.adImage} 
              />
            )}
            <div className={styles.imageDetails}>
              <div className={styles.imageCaption}>Concept {index + 1}</div>
              <div className={styles.promptText}>{img.prompt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}