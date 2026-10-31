import React from 'react';

export const SystemChart = ({ chart, primaryColor = '#087BFF' }) => {
  if (!chart || !chart.data) return null;

  const maxVal = Math.max(...chart.data.map((d) => d.value), 1);

  if (chart.type === 'bar') {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{chart.title}</h4>
        <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
          {chart.data.map((item, idx) => {
            const heightPercent = Math.round((item.value / maxVal) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {typeof item.value === 'number' && item.value > 1000 ? `$${(item.value / 1000).toFixed(0)}k` : item.value}
                </span>
                <div
                  style={{
                    height: `${Math.max(heightPercent, 12)}%`,
                    backgroundColor: primaryColor,
                  }}
                  className="w-full rounded-t-lg transition-all duration-500 hover:brightness-125"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Donut / Breakdown style
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{chart.title}</h4>
      <div className="space-y-2.5 pt-2">
        {chart.data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color || primaryColor }}
                />
                {item.label}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{item.value}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color || primaryColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemChart;
