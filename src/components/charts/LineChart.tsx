
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  date: Date;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  color?: string;
  title?: string;
  yAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 50, left: 60 },
  color = '#0ea5e9',
  title,
  yAxisLabel
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear existing SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number * 1.1])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title if provided
    if (title) {
      chart.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-lg font-semibold')
        .text(title);
    }

    // Add grid lines
    chart.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Add x-axis with improved quarterly formatting
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth.every(3)) // Show quarterly ticks
      .tickFormat((d) => {
        const date = d as Date;
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      });
    
    chart.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('class', 'text-sm text-gray-600')
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('dy', '1.2em');

    // Add y-axis
    chart.append('g')
      .call(d3.axisLeft(yScale))
      .attr('class', 'text-sm text-gray-600');

    // Add y-axis label if provided
    if (yAxisLabel) {
      chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 15)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm text-gray-500')
        .text(yAxisLabel);
    }

    // Add line path
    chart.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add area gradient
    const gradient = chart.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.5);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    // Add area
    const area = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    chart.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Add tooltip dots
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute bg-white p-2 rounded shadow-lg text-xs hidden')
      .style('pointer-events', 'none');

    const focus = chart.append('g')
      .attr('class', 'focus')
      .style('display', 'none');

    focus.append('circle')
      .attr('r', 5)
      .attr('fill', color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Interactive overlay
    chart.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseover', () => {
        focus.style('display', null);
        tooltip.classed('hidden', false);
      })
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.classed('hidden', true);
      })
      .on('mousemove', (event) => {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        
        // Find closest data point
        const bisect = d3.bisector<DataPoint, Date>(d => d.date).left;
        const i = bisect(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        
        if (!d0 || !d1) return;
        
        const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        
        focus.attr('transform', `translate(${xScale(d.date)},${yScale(d.value)})`);
        
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div>
              <div class="font-semibold">${d.date.toLocaleDateString()}</div>
              <div>${d.value.toLocaleString()}</div>
            </div>
          `);
      });

    return () => {
      // Cleanup tooltip
      d3.select('body').select('.tooltip').remove();
    };
  }, [data, width, height, margin, color, title, yAxisLabel]);

  return (
    <div className="chart-container">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default LineChart;
