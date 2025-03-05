export interface RedditResult {
  title: string;
  subreddit: string;
  snippet: string;
  link?: string;
  engagement_metrics?: {
    upvote_ratio: number;
    comment_count: number;
    awards: number;
  };
  top_comments?: {
    body: string;
    score: number;
    author: string;
  }[];
}

export interface PainPoint {
  issue: string;
  frequency: number; // 0-100
  impact_score: number; // 0-100
  verbatim_quotes: string[];
  suggested_solutions: string[];
}

export interface NicheCommunity {
  segment: string;
  demographic_indicators: string[];
  discussion_themes: string[];
  engagement_level: number; // 0-100
  influence_score: number; // 0-100
  key_influencers: string[];
}

export interface SentimentAnalysis {
  overall_sentiment: number; // -100 to 100
  emotional_triggers: {
    trigger: string;
    intensity: number; // 0-100
    context: string;
    activation_phrases: string[];
  }[];
  brand_perception: {
    positive_attributes: string[];
    negative_attributes: string[];
    neutral_observations: string[];
  };
}

export interface MarketingInsight {
  overview: string;
  recurring_pain_points: PainPoint[];
  niche_communities: NicheCommunity[];
  sentiment_analysis: SentimentAnalysis;
  psychographic_insights: {
    motivation_factors: string[];
    decision_drivers: string[];
    adoption_barriers: string[];
  };
  competitive_intelligence: {
    market_positioning: string;
    share_of_voice: number;
    competitive_advantages: string[];
    threat_assessment: string;
  };
}

export const fetchMarketingInsights = async (
  query: string
): Promise<{ results: RedditResult[]; insights: MarketingInsight } | null> => {
  try {
    const redditClientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const redditClientSecret = process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!redditClientId || !redditClientSecret || !groqApiKey) {
      throw new Error("API keys are missing. Check environment variables.");
    }

    // Reddit Authentication
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${redditClientId}:${redditClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      throw new Error(`Reddit Authentication error: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Focus on most relevant subreddits and get only 5 posts
    const subreddits = [
      'technology', 'products', 'business', 'marketing',
      'startups', 'entrepreneurship', 'productmanagement'
    ];
    
    const results: RedditResult[] = [];
    let totalPosts = 0;

    // Keep searching until we have 5 relevant posts
    for (const subreddit of subreddits) {
      if (totalPosts >= 5) break;
      
      const searchResponse = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(query)}&limit=5&sort=relevance`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'MarketingInsights/3.0',
          },
        }
      );

      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      
      // Filter posts with actual content
      const relevantPosts = searchData.data.children
        .filter((post: any) => 
          post.data.selftext && 
          post.data.selftext.length > 50 &&
          post.data.num_comments > 0
        );
      
      for (const post of relevantPosts) {
        if (totalPosts >= 5) break;
        
        // Get comments for this post
        const commentsResponse = await fetch(
          `https://oauth.reddit.com${post.data.permalink}?limit=10&depth=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'MarketingInsights/3.0',
            },
          }
        );
        
        if (!commentsResponse.ok) continue;
        
        const commentsData = await commentsResponse.json();
        
        // Extract top 5 comments (if available)
        const topComments = commentsData[1]?.data?.children
          .filter((comment: any) => 
            comment.kind === 't1' && 
            comment.data?.body && 
            !comment.data.stickied
          )
          .sort((a: any, b: any) => b.data.score - a.data.score)
          .slice(0, 5)
          .map((comment: any) => ({
            body: comment.data.body,
            score: comment.data.score,
            author: comment.data.author
          })) || [];
        
        results.push({
          title: post.data.title,
          subreddit: post.data.subreddit,
          snippet: post.data.selftext.slice(0, 300) + (post.data.selftext.length > 300 ? "..." : ""),
          link: post.data.permalink ? `https://reddit.com${post.data.permalink}` : post.data.url,
          engagement_metrics: {
            upvote_ratio: post.data.upvote_ratio,
            comment_count: post.data.num_comments,
            awards: post.data.total_awards_received || 0
          },
          top_comments: topComments
        });
        
        totalPosts++;
      }
    }

    if (results.length === 0) {
      throw new Error("Insufficient data from Reddit Search API.");
    }

    // Prepare a more focused dataset for Groq to reduce token usage
    const groqInputData = results.map(post => ({
      title: post.title,
      subreddit: post.subreddit,
      content: post.snippet,
      comments: post.top_comments?.map(c => c.body).join(" | ").slice(0, 500) || "",
      engagement: {
        upvote_ratio: post.engagement_metrics?.upvote_ratio,
        comment_count: post.engagement_metrics?.comment_count
      }
    }));

    // Streamlined Groq API prompt
    const context = `As a specialized market research analyst, analyze these Reddit discussions to provide marketing insights. Focus on key trends, consumer sentiment, and actionable recommendations. Return findings in JSON format:
    {
      "overview": "Brief analysis of market dynamics and consumer behavior patterns",
      "recurring_pain_points": [
        {
          "issue": "Specific pain point",
          "frequency": 80,
          "impact_score": 75,
          "verbatim_quotes": ["Selected user quotes"],
          "suggested_solutions": ["Actionable recommendations"]
        }
      ],
      "niche_communities": [
        {
          "segment": "Market segment",
          "demographic_indicators": ["Observable patterns"],
          "discussion_themes": ["Conversation topics"],
          "engagement_level": 85,
          "influence_score": 70,
          "key_influencers": ["Notable community members"]
        }
      ],
      "sentiment_analysis": {
        "overall_sentiment": 65,
        "emotional_triggers": [
          {
            "trigger": "Emotional catalyst",
            "intensity": 80,
            "context": "Situation analysis",
            "activation_phrases": ["Trigger phrases"]
          }
        ],
        "brand_perception": {
          "positive_attributes": ["Brand strengths"],
          "negative_attributes": ["Areas of concern"],
          "neutral_observations": ["Market observations"]
        }
      },
      "psychographic_insights": {
        "motivation_factors": ["Purchase drivers"],
        "decision_drivers": ["Decision factors"],
        "adoption_barriers": ["Adoption obstacles"]
      },
      "competitive_intelligence": {
        "market_positioning": "Competitive landscape analysis",
        "share_of_voice": 65,
        "competitive_advantages": ["Market advantages"],
        "threat_assessment": "Competitive risk assessment"
      }
    }

    Give creative, not generic ideas. Use professional marketing terminology.
    Provide 6 pain points, 3 niche communities, and 3 emotional triggers.`;

    const insightResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-qwen-32b",
        messages: [
          { role: "system", content: context },
          { role: "user", content: JSON.stringify(groqInputData) },
        ],
        temperature: 0.7,
        max_tokens: 4500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!insightResponse.ok) {
      throw new Error(`Groq API error: ${insightResponse.status}`);
    }

    const insightData = await insightResponse.json();
    const insights: MarketingInsight = JSON.parse(insightData.choices[0].message.content);
    return { results, insights };
  } catch (error) {
    console.error("Error in fetchMarketingInsights:", error);
    return null;
  }
};