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
        `${process.env.lNEXT_PUBLIC_REDDIT_CLIENT_ID}:${process.env.lNEXT_PUBLIC_REDDIT_CLIENT_SECRET}`
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
      // Only fetch from two most relevant subreddits to limit data
      const relevantSubreddits = subreddits.slice(0, 2);

      for (const subreddit of relevantSubreddits) {
        const response = await fetch(
          `${this.REDDIT_API_URL}/r/${subreddit}/search?q=${encodeURIComponent(query)}&limit=5&sort=relevance&t=year`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'RedditAnalytics/1.0',
            },
          }
        );

        if (!response.ok) continue;

        const data: RedditApiResponse = await response.json();
        
        if (data?.data?.children && Array.isArray(data.data.children)) {
          // Get only top 3 posts with most engagement
          const topPosts = data.data.children
            .filter(child => child?.data && typeof child.data === 'object')
            .sort((a, b) => (b.data.ups + b.data.num_comments) - (a.data.ups + a.data.num_comments))
            .slice(0, 3)
            .map(child => ({
              title: child.data.title || 'No Title',
              subreddit: child.data.subreddit || subreddit,
              upvotes: child.data.ups || 0,
              comments: child.data.num_comments || 0,
              body: child.data.selftext || '',
            }));

          posts.push(...topPosts);
        }
      }

      return posts;
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      throw new Error('Failed to fetch Reddit posts');
    }
  }

  public static async analyzeRedditData(query: string): Promise<AnalysisResult> {
    try {
      const token = await this.getRedditToken();
      const redditPosts = await this.fetchRedditPosts(query, token);

      const context = `
        Analyze these Reddit posts about ${query} and provide a visually structured HTML response with the following sections:

        1. Overall Sentiment Analysis:
           Create a visual sentiment meter using HTML/CSS showing:
           <div class="sentiment-meter">
             <div class="sentiment-bar" style="width: [0-100]%"></div>
             <div class="sentiment-label">[Negative/Neutral/Positive]</div>
           </div>

        2. Key Discussions:
           <div class="discussion-card">
             <div class="sentiment-indicator [positive/neutral/negative]"></div>
             <div class="discussion-content">
               <h4>Topic</h4>
               <p>Key points with highlighted <mark>important phrases</mark></p>
               <div class="metrics">
                 <span class="engagement">👥 [number] participants</span>
                 <span class="sentiment-score">😊 [sentiment score]</span>
               </div>
             </div>
           </div>

        3. Common Themes:
           <div class="themes-container">
             <div class="theme-tag [positive/neutral/negative]">[theme]</div>
           </div>

        Format everything using these predefined classes for visual styling.
        Focus on making the output visually informative with clear sentiment indicators.
      `;

      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.lNEXT_PUBLIC_GROQ_API_KEY}`,
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
          rawPosts: redditPosts.slice(0, 3), // Only return top 3 posts
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