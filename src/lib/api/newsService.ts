import { NewsItem } from './types';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5001/mindfulinvestingcompanion/us-central1/api'
  : 'https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api';

export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/market`);
    if (!response.ok) {
      throw new Error('Failed to fetch market news');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
}

export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch company news');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching company news:', error);
    throw error;
  }
}
