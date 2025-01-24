import type { NextApiRequest, NextApiResponse } from 'next';

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    published_date: string;
    source: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        max_results: 10,
        search_depth: "news"
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Tavily API');
    }

    const data: TavilyResponse = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('News API Error:', error);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
}