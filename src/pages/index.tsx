
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import StockCard from '@/components/cards/StockCard';
import { 
  BarChart3, 
  LineChart, 
  BrainCircuit, 
  Calendar, 
  Briefcase, 
  Award, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const popularStocks = [
  { ticker: 'AAPL', companyName: 'Apple Inc.', price: 189.84, change: 2.34, changePercent: 1.25 },
  { ticker: 'MSFT', companyName: 'Microsoft Corporation', price: 410.34, change: 3.56, changePercent: 0.87 },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.', price: 156.57, change: -0.42, changePercent: -0.27 },
  { ticker: 'AMZN', companyName: 'Amazon.com, Inc.', price: 178.22, change: 1.78, changePercent: 1.01 },
];

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Hero section */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-mindful-800 to-mindful-600 text-white p-8 md:p-12">
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Mindful Investing Companion
            </h1>
            <p className="text-xl opacity-90 mb-6">
              Make data-driven investment decisions with psychological tools that help filter market noise and overcome emotional biases.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="bg-white text-mindful-700 hover:bg-gray-100">
                <Link href="/insights">
                  Explore Insights
                  <BarChart3 className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/focus">
                  Enter Focus Mode
                  <BrainCircuit className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Abstract background pattern */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white transform -translate-x-1/3 translate-y-1/3"></div>
          </div>
        </section>

        {/* Features section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-mindful-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-mindful-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Data-Driven Insights</h3>
              <p className="text-gray-600">
                Visualize key financial metrics like price, revenue, and EBITDA with interactive charts.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-mindful-100 rounded-full flex items-center justify-center mb-4">
                <BrainCircuit className="h-6 w-6 text-mindful-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Focus Mode</h3>
              <p className="text-gray-600">
                Filter market noise and focus on meaningful news and press releases for better decision-making.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-mindful-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-mindful-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Portfolio Tracking</h3>
              <p className="text-gray-600">
                Track your trades, monitor performance, and simulate potential investments.
              </p>
            </div>
          </div>
        </section>

        {/* Popular stocks section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Stocks</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insights" className="flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularStocks.map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                companyName={stock.companyName}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                onClick={() => console.log(`View ${stock.ticker} details`)}
              />
            ))}
          </div>
        </section>

        {/* Quick navigation section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/insights" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <BarChart3 className="h-8 w-8 text-mindful-600 mb-2" />
              <span className="font-medium">Insights</span>
            </Link>
            
            <Link href="/focus" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <BrainCircuit className="h-8 w-8 text-mindful-600 mb-2" />
              <span className="font-medium">Focus Mode</span>
            </Link>
            
            <Link href="/portfolios" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <Briefcase className="h-8 w-8 text-mindful-600 mb-2" />
              <span className="font-medium">Portfolios</span>
            </Link>
            
            <Link href="/dashboard" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <LineChart className="h-8 w-8 text-mindful-600 mb-2" />
              <span className="font-medium">Decision Dashboard</span>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
