
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
        
        // Check if we have a valid logoUrl and no error
        if (data && data.logoUrl && !data.error) {
          console.log(`Setting logo URL for ${ticker}: ${data.logoUrl}`);
          setLogoUrl(data.logoUrl);
          setError(false);
        } else {
          console.log(`No valid logo for ${ticker}:`, data?.error || 'No logo URL in response');
          setError(true);
          setLogoUrl(null);
        }
      } catch (error) {
        console.error(`Error fetching logo for ${ticker}:`, error);
        setError(true);
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [ticker]);

  // Loading state
  if (loading) {
    return (
      <div 
        className={`bg-gray-200 rounded animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Error state or no logo - show initials
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

  // Success state - show logo
  return (
    <img
      src={logoUrl}
      alt={`${ticker} logo`}
      className={`rounded object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        console.error(`Failed to load logo image for ${ticker} from URL: ${logoUrl}`);
        setError(true);
        setLogoUrl(null);
      }}
      onLoad={() => {
        console.log(`Successfully loaded logo for ${ticker} from URL: ${logoUrl}`);
      }}
    />
  );
};

export default StockLogo;
