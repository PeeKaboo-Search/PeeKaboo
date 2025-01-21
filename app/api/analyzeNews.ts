import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Ensure the NewsAPI key is available
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY as string;

if (!NEWS_API_KEY) {
  throw new Error("NEWS_API_KEY is missing. Please add it to your .env file.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required and must be a string." });
  }

  try {
    // Fetch news data from NewsAPI
    const newsResponse = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: query,
        apiKey: NEWS_API_KEY,
      },
    });

    const newsData = newsResponse.data;

    // Prepare structured data for display
    const structuredData = {
      articles: newsData.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
      })),
    };

    // Return structured data as JSON
    res.status(200).json(structuredData);
  } catch (error) {
    console.error("Error fetching news data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
