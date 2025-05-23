export interface StockQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changesPercentage: string;
  dayLow: string;
  dayHigh: string;
  yearHigh: string;
  yearLow: string;
  marketCap: string;
  priceAvg50: string;
  priceAvg200: string;
  exchange: string;
  volume: string;
  avgVolume: string;
  open: string;
  previousClose: string;
  eps: string;
  pe: string;
  earningsAnnouncement: string;
  sharesOutstanding: string;
}

export interface FinancialData {
  date: string;
  revenue: string;
  grossProfit: string;
  operatingIncome: string;
  netIncome: string;
}

export interface NewsItem {
  datetime: number;
  headline: string;
  source: string;
  url: string;
  summary: string;
  category: string;
  id: number;
}

export interface FinancialStatement {
  date: string;
  symbol: string;
  period: 'FY' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
  revenue: string;
  netIncome: string;
  operatingIncome: string;
  grossProfit: string;
  ebitda: string;
  totalAssets?: string;
  totalLiabilities?: string;
  cashAndEquivalents?: string;
  operatingCashFlow?: string;
  capitalExpenditure?: string;
}

export interface KeyMetrics {
  date: string;
  symbol: string;
  period: 'FY';
  peRatio: string;
  pbRatio: string;
  roe: string;
  roa: string;
  debtToEquity: string;
  currentRatio: string;
  marketCap: string;
}

export interface FinancialRatios {
  date: string;
  symbol: string;
  period: 'FY';
  currentRatio: string;
  quickRatio: string;
  debtToEquity: string;
  profitMargin: string;
  operatingMargin: string;
  returnOnEquity: string;
  returnOnAssets: string;
}
