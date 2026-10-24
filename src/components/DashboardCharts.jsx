import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { UPCOMING_MATURITY_DATA } from '../data/sampleFdrData';

export function DashboardCharts({ records = [] }) {
  // Dynamically calculate status distribution from records
  const statusCounts = records.reduce((acc, r) => {
    acc[r.verificationStatus] = (acc[r.verificationStatus] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'Verified', value: statusCounts['Verified'] || 0, color: '#2ed573' },
    { name: 'Expiring Soon', value: statusCounts['Expiring Soon'] || 0, color: '#ff6b35' },
    { name: 'Pending', value: statusCounts['Pending'] || 0, color: '#ffa502' },
    { name: 'Discrepancy', value: statusCounts['Discrepancy'] || 0, color: '#ff4757' },
  ].filter(d => d.value > 0);

  // Custom Skeuomorphic Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="skeuo-panel p-2.5 rounded-lg border border-[#babecc] text-xs font-mono shadow-md">
          <div className="font-bold text-text-primary">{label || payload[0].name}</div>
          <div className="text-accent-orange mt-1">
            Count / Volume: <strong>{payload[0].value}</strong>
            {payload[0].payload.amountInLakhs && (
              <span className="text-text-muted ml-1">
                (₹{payload[0].payload.amountInLakhs} Lakhs)
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: FDR Status Distribution */}
      <div className="skeuo-panel p-5 relative overflow-hidden">
        {/* Hardware Corner Screws */}
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
              METRIC VIZ 01
            </span>
            <h3 className="text-sm font-bold text-text-primary">
              Status Distribution Portfolio
            </h3>
          </div>
          <div className="flex gap-1">
            <span className="vent-slot h-2.5 w-1" />
            <span className="vent-slot h-2.5 w-1" />
            <span className="vent-slot h-2.5 w-1" />
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="#e0e5ec"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend underneath */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-[#d1d9e6]/70">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded skeuo-recessed-shallow">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-text-muted">{item.name}</span>
              </div>
              <span className="font-bold text-text-primary ml-1">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Upcoming Maturity Schedule */}
      <div className="skeuo-panel p-5 relative overflow-hidden">
        {/* Hardware Corner Screws */}
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
              METRIC VIZ 02
            </span>
            <h3 className="text-sm font-bold text-text-primary">
              Upcoming Maturity Pipeline (₹ Lakhs)
            </h3>
          </div>
          <div className="flex gap-1">
            <span className="vent-slot h-2.5 w-1" />
            <span className="vent-slot h-2.5 w-1" />
            <span className="vent-slot h-2.5 w-1" />
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={UPCOMING_MATURITY_DATA}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#718096"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickLine={false}
              />
              <YAxis
                stroke="#718096"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amountInLakhs"
                fill="#ff6b35"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Footer */}
        <div className="mt-2 flex items-center justify-between text-xs font-mono pt-3 border-t border-[#d1d9e6]/70 text-text-muted">
          <span>Projected Lock-in Turnover</span>
          <span className="text-accent-orange font-bold">Total: ₹4.20 Crore (10 FDRs)</span>
        </div>
      </div>

    </div>
  );
}
