
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Target } from 'lucide-react';
import { fmpAPI } from '@/services/api';

interface PriceTargetData {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

interface PriceTargetCardProps {
  ticker: string;
  currentPrice: number;
}

const PriceTargetCard: React.FC<PriceTargetCardProps> = ({ ticker, currentPrice }) => {
  const [priceTargetData, setPriceTargetData] = useState<PriceTargetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceTarget = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await fmpAPI.getPriceTargetConsensus(ticker);
        
        if (data && data.length > 0) {
          const target = data[0];
          setPriceTargetData({
            symbol: target.symbol,
            targetHigh: target.targetHigh || 0,
            targetLow: target.targetLow || 0,
            targetConsensus: target.targetConsensus || 0,
            targetMedian: target.targetMedian || 0
          });
        } else {
          setError('No price target data available');
        }
      } catch (err) {
        console.error('Error fetching price targets:', err);
        setError('Failed to load price target data');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceTarget();
  }, [ticker]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading price targets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !priceTargetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Price Target Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {error || 'No price target data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { targetLow, targetHigh, targetConsensus, targetMedian } = priceTargetData;

  if (targetLow === 0 && targetHigh === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Price Target Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No price target data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate positions on the scale (0-100%)
  const range = targetHigh - targetLow;
  const getPosition = (value: number) => ((value - targetLow) / range) * 100;

  const positions = {
    low: 0,
    median: getPosition(targetMedian),
    consensus: getPosition(targetConsensus),
    high: 100,
    current: getPosition(currentPrice)
  };

  // Clamp current price position to be within bounds
  positions.current = Math.max(0, Math.min(100, positions.current));

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Price Target Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Price scale */}
          <div className="relative">
            {/* Gradient background bar */}
            <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 relative overflow-hidden">
              {/* Scale markers */}
              <div className="absolute inset-0">
                {/* Low marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: `${positions.low}%` }}
                />
                {/* Median marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: `${positions.median}%` }}
                />
                {/* Consensus marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: `${positions.consensus}%` }}
                />
                {/* High marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: `${positions.high}%` }}
                />
              </div>
            </div>

            {/* Current price indicator */}
            <div 
              className="absolute -top-1 w-4 h-5 bg-blue-600 rounded transform -translate-x-1/2"
              style={{ left: `${positions.current}%` }}
            >
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-blue-600" />
            </div>
          </div>

          {/* Price labels */}
          <div className="relative">
            {/* Low */}
            <div 
              className="absolute transform -translate-x-1/2"
              style={{ left: `${positions.low}%` }}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Low</div>
                <div className="text-sm font-medium">{formatPrice(targetLow)}</div>
              </div>
            </div>

            {/* Median */}
            <div 
              className="absolute transform -translate-x-1/2"
              style={{ left: `${positions.median}%` }}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Median</div>
                <div className="text-sm font-medium">{formatPrice(targetMedian)}</div>
              </div>
            </div>

            {/* Consensus */}
            <div 
              className="absolute transform -translate-x-1/2"
              style={{ left: `${positions.consensus}%` }}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Consensus</div>
                <div className="text-sm font-medium">{formatPrice(targetConsensus)}</div>
              </div>
            </div>

            {/* High */}
            <div 
              className="absolute transform -translate-x-1/2"
              style={{ left: `${positions.high}%` }}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">High</div>
                <div className="text-sm font-medium">{formatPrice(targetHigh)}</div>
              </div>
            </div>

            {/* Current price label */}
            <div 
              className="absolute transform -translate-x-1/2 -top-8"
              style={{ left: `${positions.current}%` }}
            >
              <div className="text-center">
                <div className="text-xs text-blue-600 font-medium">Current</div>
                <div className="text-sm font-bold text-blue-600">{formatPrice(currentPrice)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceTargetCard;
