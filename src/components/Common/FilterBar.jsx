import { Search, Grid3x3, List, SortAsc, SortDesc, X } from 'lucide-react';
import { TIME_FILTER_OPTIONS } from './timeFilterUtils';

const FilterBar = ({
    search = '',
    onSearch,
    filters = [],
    timeFilter,
    sortBy,
    sortOrder,
    viewMode,
    onClear,
    showClear,
    className = '',
}) => {
    return (
        <div
            className={`flex flex-wrap gap-2 items-center text-xs ${className}`}
        >
            {/* Search */}
            <div className='w-full md:max-w-xs'>
                <input
                    type='text'
                    placeholder='Search...'
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    className='w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                />
            </div>

            {/* View Mode Toggle */}
            {viewMode && (
                <div className='flex bg-gray-100 dark:bg-gray-900 rounded p-0.5'>
                    <button
                        onClick={() => viewMode.onChange('grid')}
                        className={`p-1.5 rounded transition-colors ${viewMode.value === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        title='Grid view'
                    >
                        <Grid3x3 className='w-3.5 h-3.5' />
                    </button>
                    <button
                        onClick={() => viewMode.onChange('table')}
                        className={`p-1.5 rounded transition-colors ${viewMode.value === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        title='Table view'
                    >
                        <List className='w-3.5 h-3.5' />
                    </button>
                </div>
            )}

            {/* Other select filters */}
            {filters.map((filter, idx) => (
                <select
                    key={filter.label || idx}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                    {...filter.props}
                >
                    {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ))}

            {/* Time Filter */}
            {timeFilter && (
                <select
                    value={timeFilter.value}
                    onChange={(e) => timeFilter.onChange(e.target.value)}
                    className={`px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white ${className}`}
                >
                    {TIME_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}

            {/* Sort By */}
            {sortBy && (
                <select
                    value={sortBy.value}
                    onChange={(e) => sortBy.onChange(e.target.value)}
                    className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                >
                    {sortBy.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}

            {/* Sort Order */}
            {sortOrder && (
                <button
                    onClick={sortOrder.onToggle}
                    className='p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
                    title={
                        sortOrder.value === 'asc' ? 'Ascending' : 'Descending'
                    }
                >
                    {sortOrder.value === 'asc' ? (
                        <SortAsc className='w-3.5 h-3.5' />
                    ) : (
                        <SortDesc className='w-3.5 h-3.5' />
                    )}
                </button>
            )}

            {/* Clear Filters */}
            {showClear && (
                <button
                    onClick={onClear}
                    className='flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors'
                >
                    <X className='w-3 h-3' />
                    Clear
                </button>
            )}
        </div>
    );
};

export default FilterBar;
