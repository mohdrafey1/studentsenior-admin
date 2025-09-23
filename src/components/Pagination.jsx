import React from "react";

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
    className = "",
    siblingCount = 1,
}) => {
    const totalPages =
        typeof totalItems === "number"
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
            totalPages
        );

        const showLeftEllipsis = leftSiblingIndex > 2;
        const showRightEllipsis = rightSiblingIndex < totalPages - 1;

        const range = [];
        range.push(1);
        if (showLeftEllipsis) range.push("...");

        const start = showLeftEllipsis ? leftSiblingIndex : 2;
        const end = showRightEllipsis ? rightSiblingIndex : totalPages - 1;
        for (let i = start; i <= end; i++) range.push(i);

        if (showRightEllipsis) range.push("...");
        range.push(totalPages);
        return range;
    };

    return (
        <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
        >
            {showSummary && typeof totalItems === "number" && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{startIndex}</span> to
                    <span className="font-medium"> {endIndex}</span> of
                    <span className="font-medium"> {totalItems}</span> results
                </p>
            )}

            <div className="flex items-center gap-3">
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Rows per page
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
                            className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    {getPageRange().map((p, idx) =>
                        p === "..." ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={
                                    p === currentPage
                                        ? "relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 dark:bg-blue-900 text-sm font-medium text-blue-600 dark:text-blue-300 z-10"
                                        : "relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                }
                                aria-current={
                                    p === currentPage ? "page" : undefined
                                }
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default Pagination;
