import { RedditPost, AnalysisResult } from '../types';

interface GroqResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
}

interface RedditApiResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: {
        title: string;
        subreddit: string;
        ups: number;
        num_comments: number;
        selftext: string;
      };
    }>;
  };
}

export class RedditAnalysisService {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly REDDIT_API_URL = 'https://oauth.reddit.com';

  private static async getRedditToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID}:${process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET}`
      ).toString('base64');

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get Reddit token: ${response.status}`);
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token received from Reddit');
      }

      return data.access_token;
    } catch (error) {
      console.error('Error getting Reddit token:', error);
      throw new Error('Failed to authenticate with Reddit');
    }
  }

  private static async fetchRedditPosts(query: string, token: string): Promise<RedditPost[]> {
    const subreddits = ['technology', 'products', 'business', 'marketing'];
    const posts: RedditPost[] = [];

    try {
      for (const subreddit of subreddits) {
        const response = await fetch(
          `${this.REDDIT_API_URL}/r/${subreddit}/search?q=${encodeURIComponent(query)}&limit=10&sort=relevance&t=year`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'RedditAnalytics/1.0',
            },
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch from r/${subreddit}: ${response.status}`);
          continue; // Skip this subreddit if request fails
        }

        const data: RedditApiResponse = await response.json();
        
        // Verify the response structure
        if (data?.data?.children && Array.isArray(data.data.children)) {
          const validPosts = data.data.children
            .filter(child => child?.data && typeof child.data === 'object')
            .map(child => ({
              title: child.data.title || 'No Title',
              subreddit: child.data.subreddit || subreddit,
              upvotes: child.data.ups || 0,
              comments: child.data.num_comments || 0,
              body: child.data.selftext || '',
            }));

          posts.push(...validPosts);
        }
      }

      // If no posts were found, return a mock post to prevent empty analysis
      if (posts.length === 0) {
        posts.push({
          title: `Discussion about ${query}`,
          subreddit: 'general',
          upvotes: 0,
          comments: 0,
          body: `No recent discussions found about ${query}`,
        });
      }

      return posts;

    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      throw new Error('Failed to fetch Reddit posts');
    }
  }

  public static async analyzeRedditData(query: string): Promise<AnalysisResult> {
    try {
      // Fetch real Reddit data
      const token = await this.getRedditToken();
      const redditPosts = await this.fetchRedditPosts(query, token);

      // Prepare context for Groq analysis
      const context = `
        Analyze the following Reddit posts about ${query} from a marketing perspective.
        Focus on:
        1. Customer Pain Points (<pain-point> tags)
        2. Market Opportunities (<opportunity> tags)
        3. Sentiment Analysis (<sentiment> tags)
        4. Feature Requests (<feature-request> tags)
        5. Competitive Analysis (<competitor-insight> tags)
        
        Format the response using semantic HTML tags for proper visualization.
        If the data set is empty or limited, provide general market analysis based on the query topic.
      `;

      // Get analysis from Groq
      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: context },
            { role: "user", content: JSON.stringify(redditPosts) }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis from Groq API');
      }

      const data: GroqResponse = await response.json();
      const analysis = data.choices?.[0]?.message?.content || 
        "<p>No analysis available. Please try again with a different query.</p>";

      return {
        success: true,
        data: {
          analysis,
          rawPosts: redditPosts,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error("Error in analyzeRedditData:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}