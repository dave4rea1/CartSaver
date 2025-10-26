import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const GPSTrendChart = ({ data = [], height = 200 }) => {
  // Generate sample data if not provided (simulating hourly GPS tracking data)
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }

    // Generate 12 data points representing the last 12 hours
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const time = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000);
      const hour = time.getHours();
      return {
        time: `${hour}:00`,
        inside: Math.floor(Math.random() * 20) + 80, // 80-100
        outside: Math.floor(Math.random() * 10) + 0 // 0-10
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-3 shadow-premium">
          <p className="font-semibold text-grey-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} trolleys
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorInside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOutside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-grey-700 capitalize">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="inside"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#colorInside)"
            name="Inside Geofence"
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="outside"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorOutside)"
            name="Outside Geofence"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(GPSTrendChart);
