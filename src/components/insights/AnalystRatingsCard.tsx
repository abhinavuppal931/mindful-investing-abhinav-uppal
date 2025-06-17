
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import { fmpAPI } from '@/services/api';

interface RatingsData {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface AnalystRatingsCardProps {
  ticker: string;
}

const AnalystRatingsCard: React.FC<AnalystRatingsCardProps> = ({ ticker }) => {
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await fmpAPI.getRatingsConsensus(ticker);
        
        if (data && data.length > 0) {
          const ratings = data[0];
          setRatingsData({
            symbol: ratings.symbol,
            strongBuy: ratings.strongBuy || 0,
            buy: ratings.buy || 0,
            hold: ratings.hold || 0,
            sell: ratings.sell || 0,
            strongSell: ratings.strongSell || 0
          });
        } else {
          setError('No ratings data available');
        }
      } catch (err) {
        console.error('Error fetching ratings:', err);
        setError('Failed to load ratings data');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [ticker]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading analyst ratings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ratingsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {error || 'No ratings data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRatings = ratingsData.strongBuy + ratingsData.buy + ratingsData.hold + ratingsData.sell + ratingsData.strongSell;
  
  if (totalRatings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No analyst ratings available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const strongBuyPct = (ratingsData.strongBuy / totalRatings) * 100;
  const buyPct = (ratingsData.buy / totalRatings) * 100;
  const holdPct = (ratingsData.hold / totalRatings) * 100;
  const sellPct = (ratingsData.sell / totalRatings) * 100;
  const strongSellPct = (ratingsData.strongSell / totalRatings) * 100;

  // Find dominant rating
  const ratings = [
    { name: 'STRONG BUY', count: ratingsData.strongBuy, percentage: strongBuyPct },
    { name: 'BUY', count: ratingsData.buy, percentage: buyPct },
    { name: 'HOLD', count: ratingsData.hold, percentage: holdPct },
    { name: 'SELL', count: ratingsData.sell, percentage: sellPct },
    { name: 'STRONG SELL', count: ratingsData.strongSell, percentage: strongSellPct }
  ];

  const dominantRating = ratings.reduce((prev, current) => 
    current.count > prev.count ? current : prev
  );

  // Calculate stroke dash array for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(dominantRating.percentage / 100) * circumference} ${circumference}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Analyst Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-6">
          {/* Circular Progress Dial */}
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#ratingGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="25%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="75%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{Math.round(dominantRating.percentage)}%</div>
                <div className="text-xs text-muted-foreground">{dominantRating.name}</div>
              </div>
            </div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-3">
            {[
              { label: 'Strong Buy', count: ratingsData.strongBuy, percentage: strongBuyPct, color: 'from-emerald-600 to-emerald-400' },
              { label: 'Buy', count: ratingsData.buy, percentage: buyPct, color: 'from-green-500 to-green-300' },
              { label: 'Hold', count: ratingsData.hold, percentage: holdPct, color: 'from-amber-500 to-amber-300' },
              { label: 'Sell', count: ratingsData.sell, percentage: sellPct, color: 'from-red-500 to-red-300' },
              { label: 'Strong Sell', count: ratingsData.strongSell, percentage: strongSellPct, color: 'from-red-700 to-red-500' }
            ].map((rating, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-muted-foreground">{rating.label}</div>
                <div className="flex-1 relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${rating.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-8 text-sm font-medium text-right">{rating.count}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalystRatingsCard;
