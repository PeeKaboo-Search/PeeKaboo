// src/types/news.ts
export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: string;
  }
  
  export interface NewsResponse {
    articles: NewsItem[];
    totalResults: number;
  }