
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/charts/LineChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart as LineChartIcon, 
  BrainCircuit, 
  EyeOff, 
  BarChart3, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  BadgeCheck,
  TrendingUp
} from 'lucide-react';

// Mock data for decision history
const decisionHistory = [
  {
    id: 1,
    date: new Date('2025-04-10'),
    ticker: 'AAPL',
    decision: 'buy',
    price: 182.52,
    currentPrice: 189.84,
    confidenceScore: 85,
    emotional: false,
    notes: "Strong earnings expected, valuation reasonable compared to peers."
  },
  {
    id: 2,
    date: new Date('2025-04-05'),
    ticker: 'TSLA',
    decision: 'sell',
    price: 172.98,
    currentPrice: 176.75,
    confidenceScore: 65,
    emotional: true,
    notes: "Concerns about production targets, but decision was emotionally driven."
  },
  {
    id: 3,
    date: new Date('2025-03-28'),
    ticker: 'MSFT',
    decision: 'buy',
    price: 395.23,
    currentPrice: 410.34,
    confidenceScore: 90,
    emotional: false,
    notes: "Cloud growth continues to exceed expectations, AI investments paying off."
  },
  {
    id: 4,
    date: new Date('2025-03-15'),
    ticker: 'NFLX',
    decision: 'hold',
    price: 625.89,
    currentPrice: 642.73,
    confidenceScore: 70,
    emotional: false,
    notes: "Subscriber growth slowing, but content pipeline remains strong."
  },
  {
    id: 5,
    date: new Date('2025-03-02'),
    ticker: 'AMZN',
    decision: 'buy',
    price: 172.45,
    currentPrice: 178.22,
    confidenceScore: 80,
    emotional: false,
    notes: "AWS growth accelerating, retail margins improving."
  },
];

// Mock data for decision quality metrics
const generateMockData = (days: number, startValue: number, volatility: number) => {
  const data = [];
  let currentValue = startValue;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.5) * volatility;
    currentValue = Math.max(0.1, currentValue * (1 + change/100));
    
    data.push({
      date,
      value: currentValue
    });
  }
  
  return data;
};

const scoreData = generateMockData(90, 70, 5);
const emotionalData = generateMockData(90, 30, 10);

// Mock badges
const badges = [
  { id: 1, name: "Rational Thinker", description: "Made 10 non-emotional decisions", icon: BrainCircuit, earned: true },
  { id: 2, name: "Data Driven", description: "Consulted data for 25 decisions", icon: BarChart3, earned: true },
  { id: 3, name: "Patience Master", description: "Held positions for 6+ months", icon: EyeOff, earned: true },
  { id: 4, name: "Trend Spotter", description: "Identified 5 major market trends", icon: TrendingUp, earned: false },
  { id: 5, name: "Diamond Hands", description: "Maintained conviction through volatility", icon: BadgeCheck, earned: false },
];

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <LineChartIcon className="mr-2 h-8 w-8 text-mindful-600" />
            Decision Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your investment decisions and monitor your decision-making quality
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">
                Average Confidence Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <div className="text-3xl font-bold mr-2">
                  {Math.round(decisionHistory.reduce((acc, d) => acc + d.confidenceScore, 0) / decisionHistory.length)}%
                </div>
                <div className="text-sm text-green-600 pb-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  5% vs. Last Month
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">
                Emotional Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <div className="text-3xl font-bold mr-2">
                  {Math.round(decisionHistory.filter(d => d.emotional).length / decisionHistory.length * 100)}%
                </div>
                <div className="text-sm text-green-600 pb-1 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  10% vs. Last Month
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">
                Decision Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <div className="text-3xl font-bold mr-2">
                  {Math.round(decisionHistory.filter(d => 
                    (d.decision === 'buy' && d.currentPrice > d.price) || 
                    (d.decision === 'sell' && d.currentPrice < d.price) || 
                    (d.decision === 'hold' && Math.abs(d.currentPrice - d.price) / d.price < 0.05)
                  ).length / decisionHistory.length * 100)}%
                </div>
                <div className="text-sm text-green-600 pb-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  8% vs. Last Month
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Decision Quality Over Time</CardTitle>
                <CardDescription>
                  Track your confidence scores and emotional decision rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <LineChart 
                    data={scoreData} 
                    width={800} 
                    height={400} 
                    color="#0ea5e9"
                    yAxisLabel="Score"
                    title="Decision Quality Metrics"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
                <CardDescription>
                  Recognition for good decision-making habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {badges.map(badge => (
                    <div 
                      key={badge.id} 
                      className={`p-3 border rounded-lg flex items-center ${badge.earned ? 'bg-mindful-50 border-mindful-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${badge.earned ? 'bg-mindful-100 text-mindful-600' : 'bg-gray-200 text-gray-500'}`}>
                        <badge.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center">
                          {badge.name}
                          {badge.earned && <BadgeCheck className="h-4 w-4 ml-1 text-green-500" />}
                        </div>
                        <div className="text-xs text-gray-500">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Decisions</CardTitle>
              <CardDescription>
                Your latest investment decisions
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Decision
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Ticker</th>
                    <th className="text-center py-3 px-4">Decision</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Current</th>
                    <th className="text-center py-3 px-4">Change</th>
                    <th className="text-center py-3 px-4">Confidence</th>
                    <th className="text-center py-3 px-4">Emotional?</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionHistory.map(decision => {
                    const priceChange = ((decision.currentPrice - decision.price) / decision.price) * 100;
                    const isPositive = priceChange >= 0;
                    const isGoodDecision = 
                      (decision.decision === 'buy' && isPositive) || 
                      (decision.decision === 'sell' && !isPositive) ||
                      (decision.decision === 'hold' && Math.abs(priceChange) < 5);
                    
                    return (
                      <tr key={decision.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{decision.date.toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-medium">{decision.ticker}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant={decision.decision === 'buy' ? 'default' : decision.decision === 'sell' ? 'destructive' : 'outline'}
                          >
                            {decision.decision.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">${decision.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${decision.currentPrice.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex items-center justify-center">
                            {isPositive ? (
                              <ArrowUp className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDown className="h-4 w-4 mr-1" />
                            )}
                            {Math.abs(priceChange).toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                decision.confidenceScore >= 80 ? 'bg-green-500' : 
                                decision.confidenceScore >= 60 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${decision.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">{decision.confidenceScore}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {decision.emotional ? (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              No
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
