
import React, { useState, useEffect } from 'react';

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: number;
}

const StockLogo: React.FC<StockLogoProps> = ({ ticker, className = '', size = 24 }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!ticker) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/logokit-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbol: ticker }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
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

  if (!logoUrl) {
    return (
      <div 
        className={`bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600 ${className}`}
        style={{ width: size, height: size }}
      >
        {ticker.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${ticker} logo`}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
      onError={() => setLogoUrl(null)}
    />
  );
};

export default StockLogo;
