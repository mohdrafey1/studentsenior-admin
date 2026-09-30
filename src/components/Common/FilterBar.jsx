import { LayoutGrid, List, Search, SortAsc, SortDesc, X } from 'lucide-react';
import { TIME_FILTER_OPTIONS } from './timeFilterUtils';
import Segmented from '../ui/Segmented';

const CONTROL =
    'h-9 rounded-lg border border-line-strong bg-sheet text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer';

const FilterBar = ({
    search = '',
    onSearch,
    searchPlaceholder = 'Search',
    filters = [],
    timeFilter,
    sortBy,
    sortOrder,
    viewMode,
    onClear,
    showClear,
    className = '',
}) => {
    const selects = [
        ...filters.map((filter, idx) => (
            <select
                key={filter.label || idx}
                aria-label={filter.label}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`${CONTROL} px-2.5 ${filter.value ? 'border-brand/50 bg-brand-soft/40' : ''}`}
                {...filter.props}
            >
                {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        )),
        timeFilter && (
            <select
                key='time'
                aria-label='Date range'
                value={timeFilter.value}
                onChange={(e) => timeFilter.onChange(e.target.value)}
                className={`${CONTROL} px-2.5 ${
                    timeFilter.value && timeFilter.value !== 'all'
                        ? 'border-brand/50 bg-brand-soft/40'
                        : ''
                }`}
            >
                {TIME_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        ),
    ].filter(Boolean);

    const clearButton = showClear && (
        <button
            type='button'
            onClick={onClear}
            className='inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] text-ink-2 hover:bg-sunken hover:text-ink cursor-pointer'
        >
            <X className='w-3.5 h-3.5' aria-hidden='true' />
            Clear filters
        </button>
    );

    // Search, sort and view on the first row; filters (and Clear) below, so
    // the search box keeps its width however many filters a page has.
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className='flex flex-wrap gap-2 items-center'>
                {onSearch && (
                    <label className='flex items-center gap-2 flex-1 min-w-[220px] h-9 px-3 rounded-lg border border-line-strong bg-sheet text-muted focus-within:ring-2 focus-within:ring-brand/30'>
                        <Search
                            className='w-[15px] h-[15px] shrink-0'
                            aria-hidden='true'
                        />
                        <input
                            type='search'
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            className='flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-muted'
                        />
                    </label>
                )}

                {sortBy && (
                    <select
                        aria-label='Sort by'
                        value={sortBy.value}
                        onChange={(e) => sortBy.onChange(e.target.value)}
                        className={`${CONTROL} px-2.5`}
                    >
                        {sortBy.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}

                {sortOrder && (
                    <button
                        type='button'
                        onClick={sortOrder.onToggle}
                        aria-label={
                            sortOrder.value === 'asc'
                                ? 'Sorted ascending, switch to descending'
                                : 'Sorted descending, switch to ascending'
                        }
                        title={
                            sortOrder.value === 'asc'
                                ? 'Ascending'
                                : 'Descending'
                        }
                        className={`${CONTROL} w-9 flex items-center justify-center text-ink-2 hover:bg-sunken`}
                    >
                        {sortOrder.value === 'asc' ? (
                            <SortAsc className='w-4 h-4' aria-hidden='true' />
                        ) : (
                            <SortDesc className='w-4 h-4' aria-hidden='true' />
                        )}
                    </button>
                )}

                {viewMode && (
                    <Segmented
                        label='View'
                        value={viewMode.value}
                        onChange={viewMode.onChange}
                        options={[
                            {
                                value: 'table',
                                icon: List,
                                ariaLabel: 'Table view',
                            },
                            {
                                value: 'grid',
                                icon: LayoutGrid,
                                ariaLabel: 'Grid view',
                            },
                        ]}
                    />
                )}

                {selects.length === 0 && clearButton}
            </div>

            {selects.length > 0 && (
                <div className='flex flex-wrap gap-2 items-center'>
                    {selects}
                    {clearButton}
                </div>
            )}
        </div>
    );
};

export default FilterBar;
