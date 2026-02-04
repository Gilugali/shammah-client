import { useState } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface FilterBarProps {
  filters: {
    type?: {
      label: string;
      options: FilterOption[];
      value: string;
      onChange: (value: string) => void;
    };
    select?: {
      label: string;
      options: FilterOption[];
      value: string;
      onChange: (value: string) => void;
    };
    dateRange?: {
      label?: string;
      value: DateRangeFilter;
      onChange: (range: DateRangeFilter) => void;
    };
  };
  onClear: () => void;
  showClearButton?: boolean;
}

const FilterBar = ({
  filters,
  onClear,
  showClearButton = true,
}: FilterBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters =
    filters.type?.value !== "" ||
    filters.select?.value !== "" ||
    filters.dateRange?.value.startDate ||
    filters.dateRange?.value.endDate;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
              Active
            </span>
          )}
        </button>
        {showClearButton && hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Type Filter */}
          {filters.type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filters.type.label}
              </label>
              <select
                value={filters.type.value}
                onChange={(e) => filters.type!.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {filters.type.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Select Filter */}
          {filters.select && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filters.select.label}
              </label>
              <select
                value={filters.select.value}
                onChange={(e) => filters.select!.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {filters.select.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Filter */}
          {filters.dateRange && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filters.dateRange.label || "Start Date"}
                </label>
                <input
                  type="date"
                  value={filters.dateRange.value.startDate || ""}
                  onChange={(e) =>
                    filters.dateRange!.onChange({
                      ...filters.dateRange.value,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filters.dateRange.label ? "" : "End Date"}
                </label>
                <input
                  type="date"
                  value={filters.dateRange.value.endDate || ""}
                  onChange={(e) =>
                    filters.dateRange!.onChange({
                      ...filters.dateRange.value,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

