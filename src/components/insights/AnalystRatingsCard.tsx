
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface GradesConsensus {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

interface AnalystRatingsCardProps {
  data: GradesConsensus | null;
  loading: boolean;
}

const AnalystRatingsCard: React.FC<AnalystRatingsCardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No analyst ratings data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalRatings = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell;
  
  if (totalRatings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No analyst ratings available
          </p>
        </CardContent>
      </Card>
    );
  }

  const getConsensusColor = (consensus: string) => {
    const lowerConsensus = consensus.toLowerCase();
    if (lowerConsensus.includes('strong buy')) return 'from-emerald-600 to-emerald-400';
    if (lowerConsensus.includes('buy')) return 'from-green-500 to-green-400';
    if (lowerConsensus.includes('hold')) return 'from-amber-500 to-amber-400';
    if (lowerConsensus.includes('sell')) return 'from-red-500 to-red-400';
    if (lowerConsensus.includes('strong sell')) return 'from-red-700 to-red-500';
    return 'from-gray-500 to-gray-400';
  };

  const getDominantRating = () => {
    const ratings = [
      { name: 'Strong Buy', count: data.strongBuy },
      { name: 'Buy', count: data.buy },
      { name: 'Hold', count: data.hold },
      { name: 'Sell', count: data.sell },
      { name: 'Strong Sell', count: data.strongSell }
    ];
    
    const dominant = ratings.reduce((max, rating) => 
      rating.count > max.count ? rating : max
    );
    
    const percentage = Math.round((dominant.count / totalRatings) * 100);
    return { name: dominant.name, percentage };
  };

  const dominant = getDominantRating();

  const ratings = [
    { 
      name: 'Strong Buy', 
      count: data.strongBuy, 
      percentage: (data.strongBuy / totalRatings) * 100,
      gradient: 'from-emerald-600 to-emerald-400'
    },
    { 
      name: 'Buy', 
      count: data.buy, 
      percentage: (data.buy / totalRatings) * 100,
      gradient: 'from-green-500 to-green-400'
    },
    { 
      name: 'Hold', 
      count: data.hold, 
      percentage: (data.hold / totalRatings) * 100,
      gradient: 'from-amber-500 to-amber-400'
    },
    { 
      name: 'Sell', 
      count: data.sell, 
      percentage: (data.sell / totalRatings) * 100,
      gradient: 'from-red-500 to-red-400'
    },
    { 
      name: 'Strong Sell', 
      count: data.strongSell, 
      percentage: (data.strongSell / totalRatings) * 100,
      gradient: 'from-red-700 to-red-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Analyst Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-8">
          {/* Circular Progress Dial */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dominant.percentage * 2.51} 251`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className={`stop-color-${getConsensusColor(dominant.name).split('-')[1]}-600`} />
                    <stop offset="100%" className={`stop-color-${getConsensusColor(dominant.name).split('-')[1]}-400`} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold">{dominant.percentage}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {dominant.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-3">
            {ratings.map((rating) => (
              <div key={rating.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{rating.name}</span>
                  <span className="text-sm text-muted-foreground">{rating.count}</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${rating.gradient} transition-all duration-300`}
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Consensus: </span>
            <span className="text-sm font-semibold">{data.consensus}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalystRatingsCard;
