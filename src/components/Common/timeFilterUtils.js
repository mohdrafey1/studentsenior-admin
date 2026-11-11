// Utility for time filter options and label
export const TIME_FILTER_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'last24h', label: 'Last 24 Hours' },
    { value: 'last7d', label: 'Last 7 Days' },
    { value: 'last28d', label: 'Last 28 Days' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
];

export function getTimeFilterLabel(filter) {
    const found = TIME_FILTER_OPTIONS.find((opt) => opt.value === filter);
    return found ? found.label : 'All Time';
}

// Helper function to filter by time
export function filterByTime(item, filter) {
    if (filter === 'all') return true;
    const itemDate = new Date(item.createdAt);
    const now = new Date();

    switch (filter) {
        case 'last24h': {
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            return itemDate >= last24h;
        }
        case 'last7d': {
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= last7d;
        }
        case 'last28d': {
            const last28d = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
            return itemDate >= last28d;
        }
        case 'thisWeek': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return itemDate >= startOfWeek;
        }
        case 'thisMonth': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return itemDate >= startOfMonth;
        }
        case 'thisYear': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return itemDate >= startOfYear;
        }
        case 'lastYear': {
            const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(now.getFullYear(), 0, 1);
            return itemDate >= startOfLastYear && itemDate < endOfLastYear;
        }
        default:
            return true;
    }
}

/**
 * The same windows as filterByTime, as `{ from, to }` ISO strings for lists
 * the server filters. Empty for 'all'. Uses the browser's timezone, so
 * "this week" means the reviewer's week.
 */
export function timeFilterRange(filter, now = new Date()) {
    const iso = (date) => date.toISOString();
    const ago = (ms) => ({ from: iso(new Date(now.getTime() - ms)) });
    const day = 24 * 60 * 60 * 1000;
    switch (filter) {
        case 'last24h':
            return ago(day);
        case 'last7d':
            return ago(7 * day);
        case 'last28d':
            return ago(28 * day);
        case 'thisWeek': {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            return { from: iso(start) };
        }
        case 'thisMonth':
            return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)) };
        case 'thisYear':
            return { from: iso(new Date(now.getFullYear(), 0, 1)) };
        case 'lastYear':
            return {
                from: iso(new Date(now.getFullYear() - 1, 0, 1)),
                to: iso(new Date(now.getFullYear(), 0, 1)),
            };
        default:
            return {};
    }
}
