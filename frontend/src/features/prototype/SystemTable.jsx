import React, { useState } from 'react';
import { Search, Plus, Filter, Download, Check, AlertTriangle, Clock } from 'lucide-react';

export const SystemTable = ({ tableConfig, onAddClick, primaryColor = '#087BFF' }) => {
  if (!tableConfig) return null;

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(tableConfig.rows || []);

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('active') || s.includes('paid') || s.includes('in stock') || s.includes('stable')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {status}
        </span>
      );
    }
    if (s.includes('pending') || s.includes('low') || s.includes('recovery') || s.includes('under review')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {status}
        </span>
      );
    }
    if (s.includes('overdue') || s.includes('out of stock') || s.includes('critical') || s.includes('warning')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5 shadow-sm">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tableConfig.title}</h3>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={tableConfig.searchPlaceholder || 'Search records...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 w-48 sm:w-60 shadow-sm"
            />
          </div>

          {/* Add Button */}
          {onAddClick && (
            <button
              onClick={onAddClick}
              style={{ backgroundColor: primaryColor }}
              className="px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              {tableConfig.columns.map((col, idx) => (
                <th key={idx} className="py-2.5 px-3 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={tableConfig.columns.length} className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  No records match your query
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {Object.keys(row)
                    .filter((k) => k !== 'id')
                    .map((key, i) => (
                      <td key={i} className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {key === 'status' || key === 'fee' ? (
                          getStatusBadge(row[key])
                        ) : (
                          <span className="font-medium">{row[key]}</span>
                        )}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Showing {filteredRows.length} sample records</span>
        <span className="text-brand-blue dark:text-brand-cyan font-mono font-semibold">Interactive Prototype Preview</span>
      </div>
    </div>
  );
};

export default SystemTable;
