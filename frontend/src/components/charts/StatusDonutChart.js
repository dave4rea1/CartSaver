import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StatusDonutChart = ({ statusCounts }) => {
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!statusCounts) return [];

    return [
      { name: 'Active', value: statusCounts.active || 0, color: '#22c55e' },
      { name: 'Maintenance', value: statusCounts.maintenance || 0, color: '#f59e0b' },
      { name: 'Stolen', value: statusCounts.stolen || 0, color: '#ef4444' },
      { name: 'Decommissioned', value: statusCounts.decommissioned || 0, color: '#6b7280' },
      { name: 'Recovered', value: statusCounts.recovered || 0, color: '#3b82f6' }
    ].filter(item => item.value > 0); // Only show non-zero values
  }, [statusCounts]);

  const total = useMemo(() =>
    chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="glass-strong rounded-lg p-3 shadow-premium">
          <p className="font-semibold text-grey-900">{data.name}</p>
          <p className="text-sm text-grey-600">
            {data.value} trolleys ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy }) => {
    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-grey-900 text-2xl font-bold"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-grey-600 text-xs"
        >
          Total Trolleys
        </text>
      </g>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-grey-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={CustomLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry) => (
              <span className="text-sm text-grey-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(StatusDonutChart);
