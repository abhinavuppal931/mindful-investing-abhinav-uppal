
import { useState, useEffect } from 'react';
import { fmpAPI, finnhubAPI } from '../services/api';

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

export interface KeyMetrics {
  date: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDdevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

export interface Ratios {
  date: string;
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  daysOfSalesOutstanding: number;
  daysOfInventoryOutstanding: number;
  operatingCycle: number;
  daysOfPayablesOutstanding: number;
  cashConversionCycle: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  pretaxProfitMargin: number;
  netProfitMargin: number;
  effectiveTaxRate: number;
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnCapitalEmployed: number;
  netIncomePerEBT: number;
  ebtPerEbit: number;
  ebitPerRevenue: number;
  debtRatio: number;
  debtEquityRatio: number;
  longTermDebtToCapitalization: number;
  totalDebtToCapitalization: number;
  interestCoverage: number;
  cashFlowToDebtRatio: number;
  companyEquityMultiplier: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  fixedAssetTurnover: number;
  assetTurnover: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  payoutRatio: number;
  operatingCashFlowSalesRatio: number;
  freeCashFlowOperatingCashFlowRatio: number;
  cashFlowCoverageRatios: number;
  shortTermCoverageRatios: number;
  capitalExpenditureCoverageRatio: number;
  dividendPaidAndCapexCoverageRatio: number;
  dividendPayoutRatio: number;
  priceBookValueRatio: number;
  priceToBookRatio: number;
  priceToSalesRatio: number;
  priceEarningsRatio: number;
  priceToFreeCashFlowsRatio: number;
  priceToOperatingCashFlowsRatio: number;
  priceCashFlowRatio: number;
  priceEarningsToGrowthRatio: number;
  priceSalesRatio: number;
  dividendYield: number;
  enterpriseValueMultiple: number;
  priceFairValue: number;
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

export const useStockData = (symbol: string, timeframe: string = '5Y') => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<FinancialData[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics[]>([]);
  const [keyMetricsTTM, setKeyMetricsTTM] = useState<KeyMetrics | null>(null);
  const [ratios, setRatios] = useState<Ratios[]>([]);
  const [ratiosTTM, setRatiosTTM] = useState<Ratios | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate limit based on timeframe
  const getLimit = (timeframe: string) => {
    switch (timeframe) {
      case '1Y': return 1;
      case '3Y': return 3;
      case '5Y': return 5;
      case '10Y': return 10;
      default: return 5;
    }
  };

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching data for symbol: ${symbol} with timeframe: ${timeframe}`);

      try {
        const limit = getLimit(timeframe);

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

        // Fetch financial statements
        console.log('Fetching financial data...');
        const incomeData = await fmpAPI.getFinancials(symbol, 'annual', 'income', limit);
        const balanceData = await fmpAPI.getFinancials(symbol, 'annual', 'balance', limit);
        const cashFlowData = await fmpAPI.getFinancials(symbol, 'annual', 'cash', limit);
        
        console.log('Income data received:', incomeData);
        console.log('Balance data received:', balanceData);
        console.log('Cash flow data received:', cashFlowData);

        setIncomeStatement(incomeData || []);
        setBalanceSheet(balanceData || []);
        setCashFlow(cashFlowData || []);

        // Fetch key metrics (annual)
        console.log('Fetching key metrics...');
        const metricsData = await fmpAPI.getMetrics(symbol, 'annual', limit);
        console.log('Metrics data received:', metricsData);
        setKeyMetrics(metricsData || []);

        // Fetch key metrics TTM using stable endpoint
        console.log('Fetching key metrics TTM...');
        const metricsTTMData = await fmpAPI.getMetricsTTMStable(symbol);
        console.log('Metrics TTM data received:', metricsTTMData);
        if (metricsTTMData && metricsTTMData.length > 0) {
          setKeyMetricsTTM(metricsTTMData[0]);
        }

        // Fetch ratios (annual)
        console.log('Fetching ratios...');
        const ratiosData = await fmpAPI.getRatios(symbol, 'annual', limit);
        console.log('Ratios data received:', ratiosData);
        setRatios(ratiosData || []);

        // Fetch ratios TTM using stable endpoint
        console.log('Fetching ratios TTM...');
        const ratiosTTMData = await fmpAPI.getRatiosTTMStable(symbol);
        console.log('Ratios TTM data received:', ratiosTTMData);
        if (ratiosTTMData && ratiosTTMData.length > 0) {
          setRatiosTTM(ratiosTTMData[0]);
        }
        
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, timeframe]);

  return { 
    quote, 
    incomeStatement, 
    balanceSheet, 
    cashFlow, 
    keyMetrics, 
    keyMetricsTTM, 
    ratios, 
    ratiosTTM, 
    profile, 
    loading, 
    error 
  };
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
