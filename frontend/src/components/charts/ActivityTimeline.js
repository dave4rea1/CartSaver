import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const ActivityTimeline = ({ activities = [], height = 180 }) => {
  // Process activities into hourly buckets for the last 24 hours
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) {
      // Generate sample data for visualization
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: Math.floor(Math.random() * 15)
      }));
    }

    // Create hourly buckets
    const now = new Date();
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
      return {
        hour: `${hour}:00`,
        count: 0
      };
    });

    // Count activities in each bucket
    activities.forEach(activity => {
      const activityTime = new Date(activity.timestamp);
      const hoursDiff = Math.floor((now - activityTime) / (1000 * 60 * 60));
      if (hoursDiff >= 0 && hoursDiff < 24) {
        buckets[23 - hoursDiff].count++;
      }
    });

    return buckets;
  }, [activities]);

  const maxValue = useMemo(
    () => Math.max(...chartData.map(d => d.count)),
    [chartData]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-3 shadow-premium">
          <p className="font-semibold text-grey-900">{payload[0].payload.hour}</p>
          <p className="text-sm text-grey-600">
            {payload[0].value} {payload[0].value === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={3}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => {
              // Color gradient based on value
              const intensity = maxValue > 0 ? entry.count / maxValue : 0;
              const color = intensity > 0.7
                ? '#ef4444'
                : intensity > 0.4
                ? '#f59e0b'
                : '#3b82f6';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(ActivityTimeline);
