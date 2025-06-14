
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmpAPI } from '@/services/api';

interface PerformanceDataPoint {
  date: Date;
  portfolioValue: number;
  portfolioReturn: number;
}

interface HistoricalDataPoint {
  date: string;
  close: number;
}

interface PortfolioPerformanceChartProps {
  holdings: any[];
  trades: any[];
  portfolioName: string;
}

const PortfolioPerformanceChart = ({ holdings, trades, portfolioName }: PortfolioPerformanceChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'dollar' | 'percent'>('percent');
  const [timePeriod, setTimePeriod] = useState('1year');
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = 400; // Fixed height for consistency
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
        case '1month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
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
      
      // Fetch historical data for all tickers with proper error handling
      const tickerDataPromises = tickers.map(async (ticker) => {
        try {
          const data = await fmpAPI.getHistoricalChart(ticker, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
          return { ticker, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          return { ticker, data: [] };
        }
      });

      const tickerDataResults = await Promise.all(tickerDataPromises);
      
      const tickerHistoricalData: Record<string, HistoricalDataPoint[]> = {};
      tickerDataResults.forEach(result => {
        if (result && result.ticker && Array.isArray(result.data)) {
          tickerHistoricalData[result.ticker] = result.data;
        }
      });

      // Get all unique dates and sort them
      const allDates = new Set<string>();
      Object.values(tickerHistoricalData).forEach(data => {
        if (Array.isArray(data)) {
          data.forEach(d => {
            if (d && d.date) {
              allDates.add(d.date);
            }
          });
        }
      });
      
      const sortedDates = Array.from(allDates).sort().map(d => new Date(d));

      // Calculate portfolio value over time
      const performanceData: PerformanceDataPoint[] = [];
      let initialPortfolioValue = 0;

      sortedDates.forEach(date => {
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
            const historicalData = tickerHistoricalData[ticker];
            if (Array.isArray(historicalData)) {
              const historicalPrice = historicalData.find(
                h => h && h.date && new Date(h.date).toDateString() === date.toDateString()
              )?.close;
              
              if (historicalPrice && typeof historicalPrice === 'number') {
                portfolioValue += sharesOwned * historicalPrice;
              }
            }
          }
        });

        if (initialPortfolioValue === 0 && portfolioValue > 0) {
          initialPortfolioValue = portfolioValue;
        }

        const portfolioReturn = initialPortfolioValue > 0 ? 
          ((portfolioValue - initialPortfolioValue) / initialPortfolioValue) * 100 : 0;

        if (portfolioValue > 0) {
          performanceData.push({
            date,
            portfolioValue,
            portfolioReturn
          });
        }
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

    const { width, height } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Set SVG dimensions
    svg.attr('width', width).attr('height', height);

    // Create gradient for line fill
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'portfolioGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', innerHeight);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8b5cf6')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#8b5cf6')
      .attr('stop-opacity', 0);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yValue = viewType === 'dollar' ? (d: PerformanceDataPoint) => d.portfolioValue : (d: PerformanceDataPoint) => d.portfolioReturn;
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, yValue) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add grid lines
    chart.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Create line and area generators
    const line = d3.line<PerformanceDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    const area = d3.area<PerformanceDataPoint>()
      .x(d => xScale(d.date))
      .y0(yScale(0))
      .y1(d => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    // Add area fill
    chart.append('path')
      .datum(data)
      .attr('fill', 'url(#portfolioGradient)')
      .attr('d', area);

    // Add line
    chart.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Axes
    chart.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')))
      .selectAll('text')
      .style('font-size', '12px');

    chart.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => 
        viewType === 'dollar' ? `$${d3.format('.2s')(d as number)}` : `${d}%`
      ))
      .selectAll('text')
      .style('font-size', '12px');

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute bg-white p-3 rounded-lg shadow-lg text-sm hidden border pointer-events-none z-50')
      .style('max-width', '200px');

    // Add invisible overlay for mouse events
    const overlay = chart.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    // Add focus circle
    const focus = chart.append('g')
      .style('display', 'none');

    focus.append('circle')
      .attr('r', 6)
      .attr('fill', '#8b5cf6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Bisector for finding closest data point
    const bisectDate = d3.bisector((d: PerformanceDataPoint) => d.date).left;

    overlay
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.classed('hidden', true);
      })
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = d1 && (x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()) ? d1 : d0;

        if (d) {
          focus.attr('transform', `translate(${xScale(d.date)},${yScale(yValue(d))})`);
          
          tooltip
            .classed('hidden', false)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`
              <div class="font-semibold text-purple-600">${portfolioName}</div>
              <div class="text-gray-600">${d.date.toLocaleDateString()}</div>
              <div class="font-medium">
                ${viewType === 'dollar' 
                  ? `Value: $${d.portfolioValue.toLocaleString()}` 
                  : `Return: ${d.portfolioReturn.toFixed(2)}%`
                }
              </div>
            `);
        }
      });

    return () => {
      tooltip.remove();
    };
  }, [data, viewType, loading, portfolioName, dimensions]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex gap-4 items-center">
            <Select value={viewType} onValueChange={(value: 'dollar' | 'percent') => setViewType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Return (%)</SelectItem>
                <SelectItem value="dollar">Total Value ($)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="3years">3 Years</SelectItem>
                <SelectItem value="5years">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-600"></div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-96">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioPerformanceChart;
