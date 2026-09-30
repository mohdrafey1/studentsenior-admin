import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination component with ellipsis and optional page size selector.
 * Props:
 * - currentPage: number (1-based)
 * - totalItems?: number
 * - totalPages?: number (used when totalItems is not provided)
 * - pageSize?: number (default 10)
 * - pageSizeOptions?: number[] (default [10, 20, 50, 100])
 * - onPageChange: (page: number) => void
 * - onPageSizeChange?: (size: number) => void
 * - showSummary?: boolean (default true, requires totalItems)
 * - className?: string
 * - siblingCount?: number (default 1)
 */
const Pagination = ({
    currentPage,
    totalItems,
    totalPages: totalPagesProp,
    pageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
    showSummary = true,
    className = '',
    siblingCount = 1,
}) => {
    const totalPages =
        typeof totalItems === 'number'
            ? Math.max(1, Math.ceil(totalItems / (pageSize || 1)))
            : Math.max(1, totalPagesProp || 1);

    const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

    const goToPage = (page) => {
        const p = clamp(page, 1, totalPages);
        if (p !== currentPage) onPageChange?.(p);
    };

    const startIndex = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
    const endIndex = totalItems
        ? Math.min(currentPage * pageSize, totalItems)
        : 0;

    // Build page range with ellipsis
    const getPageRange = () => {
        const totalPageNumbers = siblingCount * 2 + 5; // first, last, current, 2 siblings each, 2 ellipses
        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(
            currentPage + siblingCount,
            totalPages,
        );

        const showLeftEllipsis = leftSiblingIndex > 2;
        const showRightEllipsis = rightSiblingIndex < totalPages - 1;

        const range = [];
        range.push(1);
        if (showLeftEllipsis) range.push('...');

        const start = showLeftEllipsis ? leftSiblingIndex : 2;
        const end = showRightEllipsis ? rightSiblingIndex : totalPages - 1;
        for (let i = start; i <= end; i++) range.push(i);

        if (showRightEllipsis) range.push('...');
        range.push(totalPages);
        return range;
    };

    // Page sizes the caller uses may not be in the list (several pages use 12).
    const sizeOptions = pageSizeOptions.includes(pageSize)
        ? pageSizeOptions
        : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

    const box =
        'min-w-[30px] h-[30px] px-1.5 inline-flex items-center justify-center rounded-[7px] border text-xs font-mono';

    return (
        <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[13px] text-ink-2 ${className}`}
        >
            {showSummary && typeof totalItems === 'number' ? (
                <p>
                    Showing{' '}
                    <span className='font-medium text-ink'>
                        {totalItems ? `${startIndex}–${endIndex}` : 0}
                    </span>{' '}
                    of {totalItems.toLocaleString('en-IN')}
                </p>
            ) : (
                <span />
            )}

            <div className='flex flex-wrap items-center gap-3'>
                {onPageSizeChange && (
                    <label className='flex items-center gap-2 text-muted'>
                        Rows
                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
                            className='h-[30px] px-1.5 rounded-[7px] border border-line-strong bg-sheet text-[13px] text-ink cursor-pointer'
                        >
                            {sizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <nav
                    aria-label='Pagination'
                    className='flex items-center gap-1'
                >
                    <button
                        type='button'
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={`${box} border-line bg-sheet text-ink hover:bg-sunken disabled:text-faint disabled:hover:bg-sheet disabled:cursor-not-allowed cursor-pointer`}
                        aria-label='Previous page'
                    >
                        <ChevronLeft
                            className='w-3.5 h-3.5'
                            aria-hidden='true'
                        />
                    </button>
                    {getPageRange().map((p, idx) =>
                        p === '...' ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className='min-w-6 text-center text-muted select-none'
                            >
                                …
                            </span>
                        ) : (
                            <button
                                type='button'
                                key={p}
                                onClick={() => goToPage(p)}
                                className={
                                    p === currentPage
                                        ? `${box} border-inverse bg-inverse text-on-inverse`
                                        : `${box} border-line bg-sheet text-ink hover:bg-sunken cursor-pointer`
                                }
                                aria-current={
                                    p === currentPage ? 'page' : undefined
                                }
                            >
                                {p}
                            </button>
                        ),
                    )}
                    <button
                        type='button'
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={`${box} border-line bg-sheet text-ink hover:bg-sunken disabled:text-faint disabled:hover:bg-sheet disabled:cursor-not-allowed cursor-pointer`}
                        aria-label='Next page'
                    >
                        <ChevronRight
                            className='w-3.5 h-3.5'
                            aria-hidden='true'
                        />
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default Pagination;
