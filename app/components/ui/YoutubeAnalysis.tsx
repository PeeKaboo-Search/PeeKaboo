import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Eye, ThumbsUp, MessageSquare, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { YouTubeVideo, VideoStatistics, ContentAnalysis, ErrorState } from 'app/types/youtube';
import { searchYouTubeVideos, getVideoStatistics, analyzeVideoContent } from 'app/api/youtube';
import styles from 'app/styles/YouTube.module.css';

interface YouTubeAnalysisProps {
  query: string;
}

const YouTubeAnalysis: React.FC<YouTubeAnalysisProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, VideoStatistics>>({});
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: string) => {
    const n = parseInt(num);
    if (isNaN(n)) return 'N/A';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
    return n.toString();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!gridRef.current) return;
    const scrollAmount = direction === 'left' ? -400 : 400;
    gridRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const analyzeVideo = useCallback(async (video: YouTubeVideo) => {
    try {
      setLoading(true);
      const analysis = await analyzeVideoContent(video);
      setAnalysis(analysis);
      setSelectedVideo(video.id.videoId);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to analyze video',
        code: 'ANALYSIS_ERROR'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch videos
        const fetchedVideos = await searchYouTubeVideos(query);
        
        // Fetch statistics
        const videoIds = fetchedVideos.map(video => video.id.videoId);
        const stats = await getVideoStatistics(videoIds);
        
        setVideos(fetchedVideos);
        setStatistics(stats);

        // Analyze first video
        if (fetchedVideos.length > 0) {
          await analyzeVideo(fetchedVideos[0]);
        }
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch data',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchData();
    }
  }, [query, analyzeVideo]);

  if (loading && !videos.length) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>YouTube Analysis</h2>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error.message}</p>
        </div>
      )}

      <div className={styles.videoSection}>
        <div className={styles.sliderContainer}>
          <button
            onClick={() => scroll('left')}
            className={`${styles.sliderButton} ${styles.prevButton}`}
            aria-label="Previous videos"
          >
            <ChevronLeft size={24} />
          </button>

          <div ref={gridRef} className={styles.videoGrid}>
            {videos.map((video) => (
              <div
                key={video.id.videoId}
                className={styles.videoCard}
                onClick={() => analyzeVideo(video)}
              >
                <div className={styles.thumbnail}>
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className={styles.thumbnailImage}
                  />
                </div>
                <div className={styles.videoInfo}>
                  <h3 className={styles.videoTitle}>{video.snippet.title}</h3>
                  <p className={styles.channelName}>{video.snippet.channelTitle}</p>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <Eye size={16} />
                      <span>{formatNumber(statistics[video.id.videoId]?.viewCount || '0')}</span>
                    </div>
                    <div className={styles.stat}>
                      <ThumbsUp size={16} />
                      <span>{formatNumber(statistics[video.id.videoId]?.likeCount || '0')}</span>
                    </div>
                    <div className={styles.stat}>
                      <MessageSquare size={16} />
                      <span>{formatNumber(statistics[video.id.videoId]?.commentCount || '0')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className={`${styles.sliderButton} ${styles.nextButton}`}
            aria-label="Next videos"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {loading && selectedVideo ? (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.loadingSpinner} size={40} />
        </div>
      ) : analysis ? (
        <div className={styles.analysisSection}>
          <h3 className={styles.analysisHeader}>Content Analysis</h3>
          
          <div className={styles.quotesSection}>
            <h4 className={styles.sentimentHeader}>Notable Quotes</h4>
            {analysis.quotes.map((quote, index) => (
              <div key={index} className={styles.quote}>
                "{quote}"
              </div>
            ))}
          </div>

          <div className={styles.sentimentGrid}>
            <div className={styles.sentimentSection}>
              <h4 className={styles.sentimentHeader}>Positive Aspects</h4>
              {analysis.sentiment.positive.map((point, index) => (
                <div key={index} className={styles.positiveItem}>
                  {point}
                </div>
              ))}
            </div>

            <div className={styles.sentimentSection}>
              <h4 className={styles.sentimentHeader}>Critical Points</h4>
              {analysis.sentiment.negative.map((point, index) => (
                <div key={index} className={styles.negativeItem}>
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.keywordSection}>
            <h4 className={styles.sentimentHeader}>Key Topics</h4>
            <div className={styles.keywordList}>
              {analysis.keywords.map((keyword, index) => (
                <span key={index} className={styles.keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default YouTubeAnalysis;