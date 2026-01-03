import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface BezierEdgeProps {
  start: Point;
  end: Point;
  type: 'uses' | 'depends' | 'calls';
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const getCurvePath = (start: Point, end: Point): string => {
  const dx = end.x - start.x;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  const controlPoint1 = { x: start.x + controlOffset, y: start.y };
  const controlPoint2 = { x: end.x - controlOffset, y: end.y };

  return `M${start.x},${start.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`;
};

export const BezierEdge: React.FC<BezierEdgeProps> = ({
  start,
  end,
  type,
  isHighlighted = false,
  isDimmed = false,
}) => {
  if (!start || !end) return null;

  const path = getCurvePath(start, end);

  const getStrokeColor = () => {
    if (isDimmed) return '#374151'; // gray-700
    // Color by type: uses=indigo, depends=gray, calls=purple
    const colorMap = {
      uses: '#6366f1',    // indigo
      depends: '#6b7280', // gray-500 (skill dependencies)
      calls: '#a855f7'    // purple (agent→agent)
    };
    return colorMap[type] || '#6366f1';
  };

  const strokeWidth = isHighlighted ? 3 : 2;
  const opacity = isDimmed ? 0.3 : 0.8;

  return (
    <g style={{ opacity }}>
      {/* Glow effect for highlighted edges */}
      {isHighlighted && (
        <path
          d={path}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth + 4}
          fill="none"
          strokeLinecap="round"
          style={{ filter: 'blur(4px)', opacity: 0.5 }}
        />
      )}

      {/* Main edge path */}
      <path
        d={path}
        stroke={getStrokeColor()}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={
          type === 'depends' ? '8,4' :
          type === 'calls' ? '12,4,4,4' : // distinctive pattern for agent→agent
          'none'
        }
      />

      {/* Arrow at the end */}
      <circle
        cx={end.x}
        cy={end.y}
        r={4}
        fill={getStrokeColor()}
      />
    </g>
  );
};

export default React.memo(BezierEdge);
