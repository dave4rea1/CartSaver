import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const TrendSparkline = ({ data = [], color = '#3b82f6', height = 60 }) => {
  // Generate sample trend data if not provided (for demo purposes)
  const trendData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Generate 24 data points representing hourly trend
    return Array.from({ length: 24 }, (_, i) => ({
      value: Math.floor(Math.random() * 30) + 70 // Random values between 70-100
    }));
  }, [data]);

  const gradientId = useMemo(
    () => `gradient-${color.replace('#', '')}`,
    [color]
  );

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={1000}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TrendSparkline);
