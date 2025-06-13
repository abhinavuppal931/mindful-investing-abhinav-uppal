
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AllocationData {
  ticker: string;
  value: number;
  percentage: number;
  color: string;
}

interface PortfolioDonutChartProps {
  holdings: any[];
}

const PortfolioDonutChart = ({ holdings }: PortfolioDonutChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.6;

  const colorScale = d3.scaleOrdinal([
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1'
  ]);

  useEffect(() => {
    if (!holdings.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
    
    const allocationData: AllocationData[] = holdings.map((holding, index) => ({
      ticker: holding.ticker,
      value: holding.totalValue,
      percentage: (holding.totalValue / totalValue) * 100,
      color: colorScale(index.toString())
    }));

    const pie = d3.pie<AllocationData>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<AllocationData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const labelArc = d3.arc<d3.PieArcDatum<AllocationData>>()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    const chart = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute bg-white p-2 rounded shadow-lg text-xs hidden border')
      .style('pointer-events', 'none');

    // Create pie slices
    const slices = chart.selectAll('.slice')
      .data(pie(allocationData))
      .enter()
      .append('g')
      .attr('class', 'slice');

    // Add paths
    slices.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip
          .classed('hidden', false)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="font-semibold">${d.data.ticker}</div>
            <div>Value: $${d.data.value.toLocaleString()}</div>
            <div>Allocation: ${d.data.percentage.toFixed(1)}%</div>
          `);
        
        // Highlight slice
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.05)');
      })
      .on('mouseout', (event) => {
        tooltip.classed('hidden', true);
        
        // Reset slice
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)');
      });

    // Add percentage labels
    slices.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(1)}%` : '');

    // Add center text showing total value
    chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .attr('y', -5)
      .text('Total Value');

    chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#111827')
      .attr('y', 15)
      .text(`$${totalValue.toLocaleString()}`);

    return () => {
      tooltip.remove();
    };
  }, [holdings]);

  if (!holdings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            No holdings to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <svg ref={svgRef} className="flex-shrink-0" />
          <div className="ml-6 space-y-2">
            {holdings.map((holding, index) => {
              const percentage = (holding.totalValue / totalValue) * 100;
              return (
                <div key={holding.ticker} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorScale(index.toString()) }}
                  />
                  <span className="text-sm font-medium">{holding.ticker}</span>
                  <span className="text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioDonutChart;
