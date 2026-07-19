import React, { useState } from 'react';

const CustomChart = ({ data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No historical trends data available
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 280;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value for Y scaling
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.sales, d.purchases, 1000)) // Fallback to 1000 minimum scale
  );
  
  // Make max value nice rounded number
  const roundFactor = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const yMax = Math.ceil(maxVal / (roundFactor / 2)) * (roundFactor / 2);

  // Helper to convert data point to SVG coordinates
  const getCoordinates = (index, value) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (value / yMax) * chartHeight;
    return { x, y };
  };

  // Generate paths
  const salesPoints = data.map((d, i) => getCoordinates(i, d.sales));
  const purchasePoints = data.map((d, i) => getCoordinates(i, d.purchases));

  const createLinePath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');
  };

  const createAreaPath = (points) => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const linePath = createLinePath(points);
    return `${linePath} L ${last.x} ${paddingTop + chartHeight} L ${first.x} ${paddingTop + chartHeight} Z`;
  };

  const salesLine = createLinePath(salesPoints);
  const salesArea = createAreaPath(salesPoints);

  const purchaseLine = createLinePath(purchasePoints);
  const purchaseArea = createAreaPath(purchasePoints);

  // Grid lines
  const gridLines = [];
  const divisions = 4;
  for (let i = 0; i <= divisions; i++) {
    const ratio = i / divisions;
    const value = yMax * ratio;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    gridLines.push({ y, value });
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Sales Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--warning)' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Purchase Expense</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--warning)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines and Y-axis labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={width - paddingRight} 
              y2={line.y} 
              stroke="rgba(255,255,255,0.04)" 
              strokeDasharray="4 4" 
            />
            <text 
              x={paddingLeft - 10} 
              y={line.y + 4} 
              fill="var(--text-muted)" 
              fontSize="11px" 
              textAnchor="end"
              fontWeight="600"
            >
              ${line.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </g>
        ))}

        {/* X-axis Month Labels */}
        {data.map((d, i) => {
          const coords = getCoordinates(i, 0);
          return (
            <text 
              key={i}
              x={coords.x} 
              y={paddingTop + chartHeight + 20} 
              fill="var(--text-muted)" 
              fontSize="11px" 
              textAnchor="middle"
              fontWeight="600"
            >
              {d.month}
            </text>
          );
        })}

        {/* Areas */}
        <path d={salesArea} fill="url(#salesGrad)" />
        <path d={purchaseArea} fill="url(#purchaseGrad)" />

        {/* Lines */}
        <path d={salesLine} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        <path d={purchaseLine} fill="none" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round" />

        {/* Data Interactive Circles */}
        {salesPoints.map((pt, i) => (
          <circle 
            key={`s-${i}`} 
            cx={pt.x} 
            cy={pt.y} 
            r="5" 
            fill="var(--bg-main)" 
            stroke="var(--primary)" 
            strokeWidth="3" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => setHoveredPoint({
              x: pt.x,
              y: pt.y,
              title: data[i].month,
              label1: 'Sales',
              val1: data[i].sales,
              label2: 'Purchases',
              val2: data[i].purchases
            })}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {purchasePoints.map((pt, i) => (
          <circle 
            key={`p-${i}`} 
            cx={pt.x} 
            cy={pt.y} 
            r="5" 
            fill="var(--bg-main)" 
            stroke="var(--warning)" 
            strokeWidth="3" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => setHoveredPoint({
              x: pt.x,
              y: pt.y,
              title: data[i].month,
              label1: 'Sales',
              val1: data[i].sales,
              label2: 'Purchases',
              val2: data[i].purchases
            })}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div 
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 90}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(12, 18, 34, 0.95)',
            border: '1px solid var(--border-color-hover)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: '700', color: 'white', marginBottom: '4px', textAlign: 'center' }}>
            {hoveredPoint.title}
          </div>
          <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
            {hoveredPoint.label1}: ${hoveredPoint.val1.toLocaleString()}
          </div>
          <div style={{ color: 'var(--warning)', fontWeight: '600' }}>
            {hoveredPoint.label2}: ${hoveredPoint.val2.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomChart;
