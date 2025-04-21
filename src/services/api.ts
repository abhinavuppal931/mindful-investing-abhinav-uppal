
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

// Financial Modeling Prep API calls
export const getStockPrice = async (symbol: string) => {
  const fetchStockPrice = httpsCallable(functions, 'fetchStockPrice');
  const result = await fetchStockPrice({ symbol });
  return result.data;
};

export const getFinancialData = async (symbol: string, metric: string) => {
  const fetchFinancialData = httpsCallable(functions, 'fetchFinancialData');
  const result = await fetchFinancialData({ symbol, metric });
  return result.data;
};

// Financial Datasets API calls
export const getEarningsCalendar = async (params: { from?: string; to?: string; } = {}) => {
  const fetchEarningsCalendar = httpsCallable(functions, 'fetchEarningsCalendar');
  const result = await fetchEarningsCalendar(params);
  return result.data;
};

// News API calls
export const getNewsArticles = async (params: { 
  symbol?: string; 
  from?: string; 
  to?: string;
  focusMode?: boolean;
} = {}) => {
  const fetchNewsArticles = httpsCallable(functions, 'fetchNewsArticles');
  const result = await fetchNewsArticles(params);
  return result.data;
};

// Gemini API calls
export const getCompanyMoatAndRisks = async (symbol: string) => {
  const fetchMoatAndRisks = httpsCallable(functions, 'fetchMoatAndRisks');
  const result = await fetchMoatAndRisks({ symbol });
  return result.data;
};

export const detectBias = async (params: {
  ticker: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  emotionalState: string;
  questions: { [key: string]: boolean };
}) => {
  const detectTradeBias = httpsCallable(functions, 'detectTradeBias');
  const result = await detectTradeBias(params);
  return result.data;
};

export const summarizeEarningsCall = async (params: {
  symbol: string;
  quarter: string;
  year: string;
}) => {
  const summarizeEarningsTranscript = httpsCallable(functions, 'summarizeEarningsTranscript');
  const result = await summarizeEarningsTranscript(params);
  return result.data;
};

export const scoreNewsArticle = async (article: {
  title: string;
  content: string;
  source: string;
}) => {
  const scoreNews = httpsCallable(functions, 'scoreNews');
  const result = await scoreNews(article);
  return result.data;
};

// Stripe payment API calls
export const createSubscription = async (params: {
  paymentMethodId: string;
  priceId: string;
  customerId?: string;
}) => {
  const createStripeSubscription = httpsCallable(functions, 'createSubscription');
  const result = await createStripeSubscription(params);
  return result.data;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const cancelStripeSubscription = httpsCallable(functions, 'cancelSubscription');
  const result = await cancelStripeSubscription({ subscriptionId });
  return result.data;
};

export const checkSubscriptionStatus = async (customerId: string) => {
  const getSubscriptionStatus = httpsCallable(functions, 'getSubscriptionStatus');
  const result = await getSubscriptionStatus({ customerId });
  return result.data;
};
