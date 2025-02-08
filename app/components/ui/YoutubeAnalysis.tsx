import React, { useEffect, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { fetchVideoComments } from '@/app/api/youtube';

interface Comment {
  text: string;
  author: string;
  authorImage?: string;
  authorChannel?: string;
  likes: number;
  publishedDate: string;
}

interface ErrorState {
  message: string;
  code: string;
}

const YouTubeComments: React.FC<{ videoId: string }> = ({ videoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num/1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num/1000).toFixed(1)}K`;
    return num.toString();
  };

  const loadMoreComments = async () => {
    if (!nextPageToken) return;
    try {
      const result = await fetchVideoComments(videoId, {
        pageToken: nextPageToken,
        maxResults: 10
      });
      
      setComments(prevComments => [...prevComments, ...result.comments]);
      setNextPageToken(result.nextPageToken);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load more comments',
        code: 'LOAD_MORE_ERROR'
      });
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchVideoComments(videoId, { maxResults: 10 });
        setComments(result.comments);
        setNextPageToken(result.nextPageToken);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch comments',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchComments();
    }
  }, [videoId]);

  if (loading && !comments.length) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="youtube-comments-container space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Comments</h2>
      </div>

      <div className="space-y-4">
        {comments.map((comment, index) => (
          <Card key={`comment-${index}`} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {comment.authorImage && (
                  <img
                    src={comment.authorImage}
                    alt={comment.author}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={comment.authorChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                    >
                      {comment.author}
                    </a>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(comment.publishedDate)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{comment.text}</p>
                  {comment.likes > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <span>👍</span>
                      <span>{formatNumber(comment.likes)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMoreComments}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              'Load More Comments'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default YouTubeComments;