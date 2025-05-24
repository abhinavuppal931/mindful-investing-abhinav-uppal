
import { useState, useEffect } from 'react';
import { fmpAPI, finnhubAPI, geminiAPI } from '../services/api';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
}

export interface FinancialData {
  date: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  totalDebt: number;
  totalCash: number;
  freeCashFlow: number;
  operatingCashFlow: number;
  ebitda: number;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  industry: string;
  sector: string;
  description: string;
  website: string;
  ceo: string;
  employees: number;
  country: string;
  image: string;
}

export const useStockData = (symbol: string) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [financials, setFinancials] = useState<FinancialData[]>([]);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching data for symbol: ${symbol}`);

      try {
        // Test the health endpoint first
        const healthResponse = await fetch('https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api/health');
        console.log('Health check status:', healthResponse.status);
        
        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        // Fetch quote data
        console.log('Fetching quote data...');
        const quoteData = await fmpAPI.getQuote(symbol);
        console.log('Quote data received:', quoteData);
        
        if (quoteData && quoteData.length > 0) {
          setQuote(quoteData[0]);
        }

        // Fetch profile data
        console.log('Fetching profile data...');
        const profileData = await fmpAPI.getProfile(symbol);
        console.log('Profile data received:', profileData);
        
        if (profileData && profileData.length > 0) {
          setProfile(profileData[0]);
        }

        // Fetch financial statements (income statement)
        console.log('Fetching financial data...');
        const incomeData = await fmpAPI.getFinancials(symbol, 'annual', 'income');
        const cashFlowData = await fmpAPI.getFinancials(symbol, 'annual', 'cash');
        
        console.log('Income data received:', incomeData);
        console.log('Cash flow data received:', cashFlowData);
        
        // Combine financial data
        const combinedFinancials = incomeData.map((income: any, index: number) => {
          const cashFlow = cashFlowData[index] || {};
          return {
            date: income.date,
            revenue: income.revenue || 0,
            netIncome: income.netIncome || 0,
            grossProfit: income.grossProfit || 0,
            operatingIncome: income.operatingIncome || 0,
            totalDebt: income.totalDebt || 0,
            totalCash: income.totalCash || 0,
            freeCashFlow: cashFlow.freeCashFlow || 0,
            operatingCashFlow: cashFlow.operatingCashFlow || 0,
            ebitda: income.ebitda || 0
          };
        });

        setFinancials(combinedFinancials);
        console.log('Combined financials set:', combinedFinancials);
        
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  return { quote, financials, profile, loading, error };
};

export const useNews = (symbol?: string) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching news for symbol: ${symbol || 'market'}`);

      try {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let newsData;
        if (symbol) {
          newsData = await finnhubAPI.getCompanyNews(symbol, from, to);
        } else {
          newsData = await finnhubAPI.getMarketNews();
        }

        console.log('News data received:', newsData);
        setNews(newsData || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  return { news, loading, error };
};
