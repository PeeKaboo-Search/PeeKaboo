// src/lib/newsClient.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsItem, NewsResponse } from '@/app/types/news';

class NewsClient {
  private static instance: NewsClient;
  private readonly baseUrl = 'https://news.google.com/rss/search';
  
  private constructor() {}

  public static getInstance(): NewsClient {
    if (!NewsClient.instance) {
      NewsClient.instance = new NewsClient();
    }
    return NewsClient.instance;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/[\n\t\r]/g, ' ')
      .trim();
  }

  private extractSourceFromLink(link: string): string {
    try {
      const url = new URL(link);
      return url.hostname.replace('www.', '');
    } catch {
      return 'Unknown Source';
    }
  }

  public async searchNews(query: string): Promise<NewsResponse> {
    try {
      // Encode the query for URL
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(`${this.baseUrl}?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`);
      
      const $ = cheerio.load(response.data, { xmlMode: true });
      const items: NewsItem[] = [];

      $('item').each((_, element) => {
        const title = this.cleanText($(element).find('title').text());
        const link = $(element).find('link').text();
        const pubDate = new Date($(element).find('pubDate').text()).toISOString();
        const description = this.cleanText($(element).find('description').text());
        const source = this.extractSourceFromLink(link);

        if (title && link) {
          items.push({
            title,
            link,
            pubDate,
            description,
            source
          });
        }
      });

      return {
        articles: items.slice(0, 10), // Limit to 10 results
        totalResults: items.length
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news data');
    }
  }
}

export const newsClient = NewsClient.getInstance();