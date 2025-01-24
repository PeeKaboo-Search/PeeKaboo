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
        url?: string;
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
      const relevantSubreddits = subreddits.slice(0, 2);
      for (const subreddit of relevantSubreddits) {
        const response = await fetch(
          `${this.REDDIT_API_URL}/r/${subreddit}/search?q=${encodeURIComponent(query)}&limit=10&sort=relevance&t=year`,
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
          const topPosts = data.data.children
            .filter(child => child?.data && typeof child.data === 'object' && child.data.selftext)
            .sort((a, b) => (b.data.ups + b.data.num_comments) - (a.data.ups + a.data.num_comments))
            .slice(0, 5)  // Increased to 5 to provide more context
            .map(child => ({
              title: child.data.title || 'No Title',
              subreddit: child.data.subreddit || subreddit,
              upvotes: child.data.ups || 0,
              comments: child.data.num_comments || 0,
              body: this.truncateText(child.data.selftext, 500), // Increased body text length
              url: child.data.url, // Added URL for potential additional context
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

  // Utility method to truncate text safely
  private static truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    // Ensure we don't cut words mid-way
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    return truncated.substring(0, Math.min(truncated.length, truncated.lastIndexOf(' '))) + '...';
  }

  public static async analyzeRedditData(query: string): Promise<AnalysisResult> {
    try {
      const token = await this.getRedditToken();
      const redditPosts = await this.fetchRedditPosts(query, token);
      
      // Detailed context with HTML structure template for Groq
      const context = `
      Analyze these Reddit posts about ${query} using a structured HTML output. 
      Follow these guidelines strictly:

      1. REQUIRED HTML STRUCTURE:
      <div class="reddit-analytics-container">
        <!-- Sentiment Overview -->
        <div class="analysis-overview">
          <h2>Overall Analysis</h2>
          <div class="sentiment-indicator-wrapper">
            <div class="sentiment-indicator" style="background: linear-gradient(to right, 
              var(--color-sentiment-negative) 0%, 
              var(--color-sentiment-neutral) 50%, 
              var(--color-sentiment-positive) 100%)">
              <div class="sentiment-marker" style="left: [0-100]%"></div>
            </div>
          </div>
          <div class="analysis-content">
            [Summarize key insights, 2-3 sentences]
          </div>
        </div>

        <!-- Themes Section -->
        <div class="themes-grid">
          <!-- Each theme as a chip -->
          <div class="theme-chip [sentiment-class]">[Theme Name]</div>
        </div>

        <!-- Posts Section -->
        <div class="posts-section">
          <h2>Key Discussions</h2>
          <div class="posts-grid">
            <!-- Post Cards -->
            <div class="post-card">
              <div class="post-header">
                <h3>[Post Title]</h3>
                <span class="post-subreddit">[Subreddit Name]</span>
              </div>
              <div class="post-body">[Full Post Content]</div>
              <div class="post-stats">
                <div class="stat">
                  <span>👍 [Upvotes]</span>
                  <span>💬 [Comments]</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="analysis-timestamp">
          Analysis generated: [Current Timestamp]
        </div>
      </div>

      ANALYSIS REQUIREMENTS:
      - Use predefined CSS classes exactly as shown
      - Sentiment Marker: Place at 0-100% based on overall sentiment
      - Theme Chips: Add 'positive', 'neutral', or 'negative' class
      - Provide concise, informative content
      - Ensure readability and visual clarity
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
          max_tokens: 4000, // Increased to accommodate more detailed analysis
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
          rawPosts: redditPosts.slice(0, 3), // Matching the previous implementation
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