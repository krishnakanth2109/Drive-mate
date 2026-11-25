import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';

export function DataTable({
  title,
  subtitle,
  columns,
  data = [],
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  filterOptions = [], // e.g. [{ label: 'All Statuses', value: 'all' }, { label: 'Active', value: 'active' }]
  filterKey,
  actions,
  pageSize = 8,
  onRowClick,
  emptyMessage = 'No matching records found'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered and searched data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filter key match
      if (filterKey && selectedFilter !== 'all') {
        const itemVal = String(item[filterKey] || '').toLowerCase();
        if (itemVal !== selectedFilter.toLowerCase()) {
          return false;
        }
      }

      // Search match
      if (!searchTerm.trim()) return true;
      const lowerSearch = searchTerm.toLowerCase();

      if (searchKeys.length > 0) {
        return searchKeys.some(key => {
          const val = key.includes('.')
            ? key.split('.').reduce((acc, part) => acc?.[part], item)
            : item[key];
          return String(val || '').toLowerCase().includes(lowerSearch);
        });
      }

      // Fallback search in all string values
      return Object.values(item).some(val =>
        String(val || '').toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchTerm, selectedFilter, filterKey, searchKeys]);

  // Pagination slice
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header & Controls */}
      <div className="p-5 md:p-6 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {title && <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>}
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filter Dropdown (Optional) */}
          {filterOptions.length > 0 && (
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="appearance-none bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs md:text-sm rounded-xl pl-4 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Custom Action Buttons (e.g. Add, Export) */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-950/60 text-neutral-400 text-xs uppercase tracking-wider border-b border-neutral-800">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3.5 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80 text-sm">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-neutral-500 text-sm"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-neutral-700 mb-2 stroke-[1.5]" />
                    <p>{emptyMessage}</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-emerald-400 hover:underline mt-2 font-medium"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || row._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-neutral-800/50' : 'hover:bg-neutral-800/30'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-white">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredData.length}</span> records
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
