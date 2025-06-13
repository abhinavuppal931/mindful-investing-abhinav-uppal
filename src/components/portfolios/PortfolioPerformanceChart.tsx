
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { fmpAPI } from '@/services/api';

interface PerformanceDataPoint {
  date: Date;
  portfolioValue: number;
  portfolioReturn: number;
  sp500Return?: number;
}

interface PortfolioPerformanceChartProps {
  holdings: any[];
  trades: any[];
  portfolioName: string;
}

const PortfolioPerformanceChart = ({ holdings, trades, portfolioName }: PortfolioPerformanceChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'dollar' | 'percent'>('percent');
  const [timePeriod, setTimePeriod] = useState('1year');
  const [showSP500, setShowSP500] = useState(true);

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 80, bottom: 60, left: 80 };

  useEffect(() => {
    if (holdings.length > 0 && trades.length > 0) {
      calculatePortfolioPerformance();
    }
  }, [holdings, trades, timePeriod]);

  const calculatePortfolioPerformance = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timePeriod) {
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '3years':
          startDate.setFullYear(endDate.getFullYear() - 3);
          break;
        case '5years':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }

      const tickers = [...new Set(trades.map(t => t.ticker_symbol))];
      
      // Fetch historical data for all tickers and S&P 500
      const [tickerDataPromises, sp500Data] = await Promise.all([
        Promise.all(tickers.map(ticker => 
          fmpAPI.getHistoricalChart(ticker, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
        )),
        showSP500 ? fmpAPI.getHistoricalChart('SPY', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) : Promise.resolve([])
      ]);

      const tickerHistoricalData = Object.fromEntries(
        tickers.map((ticker, index) => [ticker, tickerDataPromises[index] || []])
      );

      // Calculate portfolio value over time
      const performanceData: PerformanceDataPoint[] = [];
      const dates = sp500Data.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
      
      let initialPortfolioValue = 0;
      let initialSP500Price = sp500Data.find(d => new Date(d.date).toDateString() === dates[0]?.toDateString())?.close || 1;

      dates.forEach(date => {
        let portfolioValue = 0;
        
        // Calculate holdings at this date
        tickers.forEach(ticker => {
          const tradesForTicker = trades
            .filter(t => t.ticker_symbol === ticker && new Date(t.trade_date) <= date)
            .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
          
          let sharesOwned = 0;
          tradesForTicker.forEach(trade => {
            if (trade.action === 'buy') {
              sharesOwned += trade.shares;
            } else {
              sharesOwned -= trade.shares;
            }
          });

          if (sharesOwned > 0) {
            const historicalPrice = tickerHistoricalData[ticker]?.find(
              h => new Date(h.date).toDateString() === date.toDateString()
            )?.close;
            
            if (historicalPrice) {
              portfolioValue += sharesOwned * historicalPrice;
            }
          }
        });

        if (initialPortfolioValue === 0 && portfolioValue > 0) {
          initialPortfolioValue = portfolioValue;
        }

        const portfolioReturn = initialPortfolioValue > 0 ? 
          ((portfolioValue - initialPortfolioValue) / initialPortfolioValue) * 100 : 0;

        let sp500Return = 0;
        if (showSP500) {
          const sp500Price = sp500Data.find(d => new Date(d.date).toDateString() === date.toDateString())?.close;
          if (sp500Price && initialSP500Price) {
            sp500Return = ((sp500Price - initialSP500Price) / initialSP500Price) * 100;
          }
        }

        performanceData.push({
          date,
          portfolioValue,
          portfolioReturn,
          sp500Return: showSP500 ? sp500Return : undefined
        });
      });

      setData(performanceData);
    } catch (error) {
      console.error('Error calculating portfolio performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data.length || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => viewType === 'dollar' ? d.portfolioValue : d.portfolioReturn) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    chart.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Axes
    chart.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')));

    chart.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => viewType === 'dollar' ? `$${d3.format('.2s')(d as number)}` : `${d}%`));

    // Portfolio line
    const portfolioLine = d3.line<PerformanceDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(viewType === 'dollar' ? d.portfolioValue : d.portfolioReturn))
      .curve(d3.curveMonotoneX);

    chart.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 3)
      .attr('d', portfolioLine);

    // S&P 500 line (if enabled)
    if (showSP500 && data.some(d => d.sp500Return !== undefined)) {
      const sp500YScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.sp500Return) as [number, number])
        .nice()
        .range([innerHeight, 0]);

      const sp500Line = d3.line<PerformanceDataPoint>()
        .x(d => xScale(d.date))
        .y(d => sp500YScale(d.sp500Return || 0))
        .curve(d3.curveMonotoneX);

      chart.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', sp500Line);
    }

    // Legend
    const legend = chart.append('g')
      .attr('transform', `translate(${innerWidth - 120}, 20)`);

    legend.append('line')
      .attr('x1', 0).attr('x2', 20)
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 5)
      .text(portfolioName)
      .style('font-size', '12px');

    if (showSP500) {
      legend.append('line')
        .attr('x1', 0).attr('x2', 20)
        .attr('y1', 20).attr('y2', 20)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      legend.append('text')
        .attr('x', 25)
        .attr('y', 25)
        .text('S&P 500')
        .style('font-size', '12px');
    }

  }, [data, viewType, showSP500, loading]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Switch
                id="sp500-toggle"
                checked={showSP500}
                onCheckedChange={setShowSP500}
              />
              <Label htmlFor="sp500-toggle" className="text-sm">Compare to S&P 500</Label>
            </div>
            <Select value={viewType} onValueChange={(value: 'dollar' | 'percent') => setViewType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Return (%)</SelectItem>
                <SelectItem value="dollar">Total Return ($)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="3years">3 Years</SelectItem>
                <SelectItem value="5years">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-600"></div>
          </div>
        ) : (
          <svg ref={svgRef} width={width} height={height} className="w-full h-auto" />
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioPerformanceChart;
