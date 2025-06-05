
import { useState, useEffect } from 'react';
import { fmpAPI } from '@/services/api';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

export const useIndices = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const indexSymbols = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^RUT', name: 'Russell 2000' }
  ];

  useEffect(() => {
    const fetchIndices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const indexPromises = indexSymbols.map(async ({ symbol, name }) => {
          try {
            const data = await fmpAPI.getIndexQuote(symbol);
            if (data && data.length > 0) {
              const quote = data[0];
              return {
                symbol: symbol,
                name: name,
                price: quote.price || 0,
                change: quote.change || 0,
                changesPercentage: quote.changesPercentage || 0
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(indexPromises);
        const validIndices = results.filter(index => index !== null);
        setIndices(validIndices);
      } catch (err) {
        console.error('Error fetching indices:', err);
        setError('Failed to fetch market indices');
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchIndices, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { indices, loading, error };
};
