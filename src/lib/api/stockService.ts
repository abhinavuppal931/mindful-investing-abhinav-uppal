import { StockQuote, FinancialData, FinancialStatement, KeyMetrics, FinancialRatios } from './types';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5001/mindfulinvestingcompanion/us-central1/api'
  : 'https://us-central1-mindfulinvestingcompanion.cloudfunctions.net/api';

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fmp/stocks/${symbol}?metric=quote`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock quote');
    }
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
}

export async function getFinancialStatements(
  symbol: string,
  type: 'income' | 'balance' | 'cashflow',
  period: 'annual' | 'quarterly' = 'annual',
  limit: number = 5
): Promise<FinancialStatement[]> {
  try {
    const endpoint = type === 'income' ? 'income-statement' :
                    type === 'balance' ? 'balance-sheet-statement' :
                    'cash-flow-statement';
    
    const response = await fetch(`${API_BASE_URL}/api/fmp/${endpoint}/${symbol}?period=${period}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} statement for ${symbol}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} statement:`, error);
    throw error;
  }
}

export async function getKeyMetrics(symbol: string): Promise<KeyMetrics[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fmp/key-metrics/${symbol}?period=annual&limit=5`);
    if (!response.ok) {
      throw new Error(`Failed to fetch key metrics for ${symbol}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    throw error;
  }
}

export async function getFinancialRatios(symbol: string): Promise<FinancialRatios[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fmp/ratios/${symbol}?period=annual&limit=5`);
    if (!response.ok) {
      throw new Error(`Failed to fetch financial ratios for ${symbol}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching financial ratios:', error);
    throw error;
  }
}

// Function to format large numbers with appropriate suffixes (K, M, B)
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

// Function to parse string numbers from API to actual numbers
export function parseStringNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}
