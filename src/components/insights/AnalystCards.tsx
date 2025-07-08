
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fmpAPI } from '@/services/api';

interface GradesConsensus {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

interface PriceTargetConsensus {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

interface AnalystCardsProps {
  ticker: string;
  currentPrice: number;
}

const AnalystCards: React.FC<AnalystCardsProps> = ({ ticker, currentPrice }) => {
  const [ratingsData, setRatingsData] = useState<GradesConsensus | null>(null);
  const [priceTargetData, setPriceTargetData] = useState<PriceTargetConsensus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalystData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [ratingsResponse, priceTargetResponse] = await Promise.all([
          fmpAPI.getGradesConsensus(ticker),
          fmpAPI.getPriceTargetConsensus(ticker)
        ]);

        if (ratingsResponse && ratingsResponse.length > 0) {
          setRatingsData(ratingsResponse[0]);
        }
        
        if (priceTargetResponse && priceTargetResponse.length > 0) {
          setPriceTargetData(priceTargetResponse[0]);
        }
      } catch (err) {
        console.error('Error fetching analyst data:', err);
        setError('Failed to load analyst data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalystData();
  }, [ticker]);

  const getConsensusColor = (consensus: string) => {
    switch (consensus?.toLowerCase()) {
      case 'strong buy':
        return 'text-emerald-600';
      case 'buy':
        return 'text-green-500';
      case 'hold':
        return 'text-amber-500';
      case 'sell':
        return 'text-red-500';
      case 'strong sell':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  const getConsensusGradient = (consensus: string) => {
    switch (consensus?.toLowerCase()) {
      case 'strong buy':
        return 'from-emerald-500 to-emerald-600';
      case 'buy':
        return 'from-green-400 to-green-500';
      case 'hold':
        return 'from-amber-400 to-amber-500';
      case 'sell':
        return 'from-red-400 to-red-500';
      case 'strong sell':
        return 'from-red-600 to-red-700';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRatingGradient = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'strong buy':
        return 'from-emerald-500 to-emerald-600';
      case 'buy':
        return 'from-green-400 to-green-500';
      case 'hold':
        return 'from-amber-400 to-amber-500';
      case 'sell':
        return 'from-red-400 to-red-500';
      case 'strong sell':
        return 'from-red-600 to-red-700';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="h-64">
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-mindful-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || (!ratingsData && !priceTargetData)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Analyst data temporarily unavailable</p>
      </div>
    );
  }

  const totalRatings = ratingsData ? 
    ratingsData.strongBuy + ratingsData.buy + ratingsData.hold + ratingsData.sell + ratingsData.strongSell : 0;

  const dominantRating = ratingsData ? Math.max(
    ratingsData.strongBuy, ratingsData.buy, ratingsData.hold, ratingsData.sell, ratingsData.strongSell
  ) : 0;

  const dominantPercentage = totalRatings > 0 ? Math.round((dominantRating / totalRatings) * 100) : 0;

  const ratings = ratingsData ? [
    { label: 'Strong Buy', count: ratingsData.strongBuy, color: 'strong buy' },
    { label: 'Buy', count: ratingsData.buy, color: 'buy' },
    { label: 'Hold', count: ratingsData.hold, color: 'hold' },
    { label: 'Sell', count: ratingsData.sell, color: 'sell' },
    { label: 'Strong Sell', count: ratingsData.strongSell, color: 'strong sell' }
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Analyst Ratings Card */}
      {ratingsData && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Analyst Ratings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              {/* Circular Progress Dial */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray={`${dominantPercentage}, 100`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={`stop-color-${getConsensusGradient(ratingsData.consensus).split(' ')[0].replace('from-', '')}`} />
                      <stop offset="100%" className={`stop-color-${getConsensusGradient(ratingsData.consensus).split(' ')[1].replace('to-', '')}`} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-sm font-bold ${getConsensusColor(ratingsData.consensus)}`}>
                    {dominantPercentage}%
                  </span>
                  <span className={`text-xs font-medium ${getConsensusColor(ratingsData.consensus)} uppercase`}>
                    {ratingsData.consensus}
                  </span>
                </div>
              </div>

              {/* Rating Bars */}
              <div className="flex-1 space-y-3">
                {ratings.map((rating) => {
                  const percentage = totalRatings > 0 ? (rating.count / totalRatings) * 100 : 0;
                  return (
                    <div key={rating.label} className="flex items-center space-x-3">
                      <div className="w-20 text-xs font-medium text-gray-600 text-right">
                        {rating.label}
                      </div>
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 bg-gradient-to-r ${getRatingGradient(rating.color)} transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-6 text-xs font-medium text-gray-700 text-center">
                        {rating.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Target Scale Card */}
      {priceTargetData && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Price Target</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Price Scale */}
              <div className="relative">
                {/* Background gradient bar */}
                <div className="w-full h-4 bg-gradient-to-r from-red-500 via-amber-400 to-green-500 rounded-full shadow-inner" />
                
                {/* Price markers */}
                <div className="relative mt-4">
                  {/* Scale line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300" />
                  
                  {/* Current price marker */}
                  {(() => {
                    const minPrice = Math.min(priceTargetData.targetLow, currentPrice);
                    const maxPrice = Math.max(priceTargetData.targetHigh, currentPrice);
                    const priceRange = maxPrice - minPrice;
                    const currentPosition = priceRange > 0 ? ((currentPrice - minPrice) / priceRange) * 100 : 50;
                    
                    return (
                      <div 
                        className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${Math.max(0, Math.min(100, currentPosition))}%` }}
                      >
                        <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          <span className="text-xs font-medium text-blue-600">Current</span>
                          <div className="text-xs font-bold text-blue-600">${currentPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Target markers */}
                <div className="flex justify-between items-start mt-8 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-gray-600">Low</div>
                    <div className="font-bold text-gray-800">${priceTargetData.targetLow?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">Median</div>
                    <div className="font-bold text-gray-800">${priceTargetData.targetMedian?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">Consensus</div>
                    <div className="font-bold text-gray-800">${priceTargetData.targetConsensus?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">High</div>
                    <div className="font-bold text-gray-800">${priceTargetData.targetHigh?.toFixed(2) || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Upside Potential</div>
                  <div className={`text-lg font-bold ${
                    priceTargetData.targetConsensus > currentPrice ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceTargetData.targetConsensus ? 
                      `${(((priceTargetData.targetConsensus - currentPrice) / currentPrice) * 100).toFixed(1)}%` 
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">Average Target</div>
                  <div className="text-lg font-bold text-gray-800">
                    ${priceTargetData.targetConsensus?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalystCards;
