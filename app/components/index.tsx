// pages/index.tsx
import { useEffect, useState } from 'react';

interface Review {
  id: string;
  userName: string;
  score: number;
  text: string;
  date: string;
  // add additional fields if needed
}

const ReviewsComponent = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews?appId=com.example.app&num=50');
        if (!res.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await res.json();
        setReviews(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Google Play Reviews</h1>
      {reviews.map(review => (
        <div key={review.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
          <p>
            <strong>{review.userName}</strong> ({review.score} stars) -{' '}
            {new Date(review.date).toLocaleDateString()}
          </p>
          <p>{review.text}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewsComponent;
