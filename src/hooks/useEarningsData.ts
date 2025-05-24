
import { useState, useEffect } from 'react';
import { finnhubAPI } from '../services/api';

export interface EarningsEvent {
  date: string;
  epsActual: number;
  epsEstimate: number;
  hour: string;
  quarter: number;
  revenueActual: number;
  revenueEstimate: number;
  symbol: string;
  year: number;
}

export const useEarningsData = (from?: string, to?: string) => {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!from || !to) return;

      setLoading(true);
      setError(null);

      try {
        const data = await finnhubAPI.getEarningsCalendar(from, to);
        setEarnings(data.earningsCalendar || []);
      } catch (err) {
        console.error('Error fetching earnings:', err);
        setError('Failed to fetch earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [from, to]);

  return { earnings, loading, error };
};
