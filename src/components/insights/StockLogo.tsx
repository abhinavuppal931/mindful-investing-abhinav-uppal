
import React, { useState, useEffect } from 'react';
import { logokitAPI } from '@/services/api';

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: number;
}

const StockLogo: React.FC<StockLogoProps> = ({ ticker, className = '', size = 24 }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!ticker) {
        setLoading(false);
        setError(true);
        return;
      }
      
      setLoading(true);
      setError(false);
      
      try {
        console.log(`Fetching logo for ticker: ${ticker}`);
        const data = await logokitAPI.getLogo(ticker);
        console.log(`Logo data received for ${ticker}:`, data);
        
        if (data && data.logoUrl && !data.error) {
          setLogoUrl(data.logoUrl);
        } else {
          console.log(`No logo available for ${ticker}:`, data?.error || 'No logo URL');
          setError(true);
        }
      } catch (error) {
        console.error(`Error fetching logo for ${ticker}:`, error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [ticker]);

  if (loading) {
    return (
      <div 
        className={`bg-gray-200 rounded animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (error || !logoUrl) {
    return (
      <div 
        className={`bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600 ${className}`}
        style={{ width: size, height: size }}
      >
        {ticker.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${ticker} logo`}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        console.error(`Failed to load logo image for ${ticker}`);
        setError(true);
        setLogoUrl(null);
      }}
      onLoad={() => {
        console.log(`Successfully loaded logo for ${ticker}`);
      }}
    />
  );
};

export default StockLogo;
