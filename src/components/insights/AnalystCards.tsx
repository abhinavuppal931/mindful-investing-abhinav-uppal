
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fmpAPI } from '@/services/api';
import { AnalystRating, PriceTarget } from '@/types/analyst';

interface AnalystCardsProps {
  ticker: string;
  currentPrice: number;
}

const AnalystCards: React.FC<AnalystCardsProps> = ({ ticker, currentPrice }) => {
  const [ratingsData, setRatingsData] = useState<AnalystRating | null>(null);
  const [priceTargetData, setPriceTargetData] = useState<PriceTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalystData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [ratingsResponse, priceTargetResponse] = await Promise.all([
          fmpAPI.getAnalystRatings(ticker),
          fmpAPI.getPriceTarget(ticker)
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

    if (ticker) {
      fetchAnalystData();
    }
  }, [ticker]);

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'strong buy':
        return 'from-emerald-600 to-emerald-400';
      case 'buy':
        return 'from-green-500 to-green-300';
      case 'hold':
        return 'from-amber-500 to-amber-300';
      case 'sell':
        return 'from-red-500 to-red-300';
      case 'strong sell':
        return 'from-red-700 to-red-500';
      default:
        return 'from-gray-500 to-gray-300';
    }
  };

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const getDominantRating = (ratings: AnalystRating) => {
    const counts = {
      'Strong Buy': ratings.analystRatingsStrongBuy || ratings.analystRatingsstrongBuy || 0,
      'Buy': ratings.analystRatingsBuy || ratings.analystRatingsbuy || 0,
      'Hold': ratings.analystRatingsHold || ratings.analystRatingshold || 0,
      'Sell': ratings.analystRatingsSell || ratings.analystRatingssell || 0,
      'Strong Sell': ratings.analystRatingsStrongSell || ratings.analystRatingsstrongSell || 0,
    };

    const maxCount = Math.max(...Object.values(counts));
    const dominantRating = Object.entries(counts).find(([_, count]) => count === maxCount)?.[0] || 'Hold';
    const totalRatings = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const percentage = getRatingPercentage(maxCount, totalRatings);

    return { rating: dominantRating, percentage };
  };

  const getScalePosition = (value: number, min: number, max: number) => {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || (!ratingsData && !priceTargetData)) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analyst Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No analyst ratings data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No price target data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRatings = ratingsData ? 
    (ratingsData.analystRatingsStrongBuy || ratingsData.analystRatingsstrongBuy || 0) +
    (ratingsData.analystRatingsBuy || ratingsData.analystRatingsbuy || 0) +
    (ratingsData.analystRatingsHold || ratingsData.analystRatingshold || 0) +
    (ratingsData.analystRatingsSell || ratingsData.analystRatingssell || 0) +
    (ratingsData.analystRatingsStrongSell || ratingsData.analystRatingsstrongSell || 0) : 0;

  const dominant = ratingsData ? getDominantRating(ratingsData) : { rating: 'Hold', percentage: 0 };

  const ratingCounts = ratingsData ? [
    { label: 'Strong Buy', count: ratingsData.analystRatingsStrongBuy || ratingsData.analystRatingsstrongBuy || 0, color: 'from-emerald-600 to-emerald-400' },
    { label: 'Buy', count: ratingsData.analystRatingsBuy || ratingsData.analystRatingsbuy || 0, color: 'from-green-500 to-green-300' },
    { label: 'Hold', count: ratingsData.analystRatingsHold || ratingsData.analystRatingshold || 0, color: 'from-amber-500 to-amber-300' },
    { label: 'Sell', count: ratingsData.analystRatingsSell || ratingsData.analystRatingssell || 0, color: 'from-red-500 to-red-300' },
    { label: 'Strong Sell', count: ratingsData.analystRatingsStrongSell || ratingsData.analystRatingsstrongSell || 0, color: 'from-red-700 to-red-500' },
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Analyst Ratings Card */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Analyst Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {ratingsData && totalRatings > 0 ? (
            <div className="flex items-center gap-6">
              {/* Circular Progress Dial */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(dominant.percentage / 100) * 283} 283`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={`text-${getRatingColor(dominant.rating).split('-')[1]}-600`} stopColor="currentColor" />
                      <stop offset="100%" className={`text-${getRatingColor(dominant.rating).split('-')[1]}-400`} stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{dominant.percentage}%</span>
                  <span className="text-xs text-muted-foreground font-medium">{dominant.rating.toUpperCase()}</span>
                </div>
              </div>

              {/* Rating Progress Bars */}
              <div className="flex-1 space-y-3">
                {ratingCounts.map((rating) => {
                  const percentage = getRatingPercentage(rating.count, totalRatings);
                  return (
                    <div key={rating.label} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20 text-right">{rating.label}</span>
                      <div className="flex-1 relative">
                        <div className="w-full bg-muted-foreground/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${rating.color} transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold w-6 text-left">{rating.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No analyst ratings data available</p>
          )}
        </CardContent>
      </Card>

      {/* Price Target Scale Card */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Price Targets</CardTitle>
        </CardHeader>
        <CardContent>
          {priceTargetData ? (
            <div className="space-y-4">
              <div className="relative h-16">
                {/* Scale Background */}
                <div className="absolute top-8 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full"></div>
                
                {/* Scale Markers */}
                <div className="relative">
                  {[
                    { label: 'Low', value: priceTargetData.targetLow, position: getScalePosition(priceTargetData.targetLow, priceTargetData.targetLow, priceTargetData.targetHigh) },
                    { label: 'Median', value: priceTargetData.targetMedian, position: getScalePosition(priceTargetData.targetMedian, priceTargetData.targetLow, priceTargetData.targetHigh) },
                    { label: 'Consensus', value: priceTargetData.targetConsensus, position: getScalePosition(priceTargetData.targetConsensus, priceTargetData.targetLow, priceTargetData.targetHigh) },
                    { label: 'High', value: priceTargetData.targetHigh, position: getScalePosition(priceTargetData.targetHigh, priceTargetData.targetLow, priceTargetData.targetHigh) }
                  ].map((target, index) => (
                    <div
                      key={target.label}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${target.position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`text-xs font-semibold mb-1 ${index % 2 === 0 ? 'mb-1' : 'mt-6'}`}>
                        ${target.value?.toFixed(2)}
                      </div>
                      <div className="w-3 h-3 bg-white border-2 border-primary rounded-full shadow-md"></div>
                      <div className={`text-xs text-muted-foreground font-medium ${index % 2 === 0 ? 'mt-1' : '-mt-6'}`}>
                        {target.label}
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Price Indicator */}
                  <div
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${getScalePosition(currentPrice, priceTargetData.targetLow, priceTargetData.targetHigh)}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="text-xs font-bold text-primary mb-1">
                      ${currentPrice.toFixed(2)}
                    </div>
                    <div className="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg"></div>
                    <div className="text-xs text-primary font-bold mt-1">
                      Current
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No price target data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalystCards;
