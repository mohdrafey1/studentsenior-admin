// Data shaping and chart styling shared by the Analytics and Blog analytics
// pages. Components live in the .jsx files next to this one.

export const RANGE_OPTIONS = [
    { value: '1', label: 'Last 24 hours' },
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'Last 12 months' },
    { value: 'all', label: 'All time' },
];

export const rangeLabel = (range) =>
    RANGE_OPTIONS.find((option) => option.value === range)?.label || 'All time';

/**
 * Every content type the analytics endpoint reports, with the keys it uses
 * in each part of the response (totals, growthData, engagement and
 * percentageChanges all name them differently).
 */
export const CONTENT_TYPES = [
    {
        label: 'PYQs',
        total: 'totalNewPyqs',
        series: 'PYQs',
        change: 'pyqs',
    },
    {
        label: 'Notes',
        total: 'totalNotes',
        series: 'Notes',
        change: 'notes',
    },
    {
        label: 'Community posts',
        total: 'totalPost',
        series: 'Posts',
        change: 'posts',
    },
    {
        label: 'Videos',
        total: 'totalVideos',
        series: 'Videos',
        change: 'videos',
    },
    {
        label: 'Seniors',
        total: 'totalSeniors',
        series: 'Seniors',
        change: 'seniors',
    },
    {
        label: 'Store products',
        total: 'totalProduct',
        series: 'Products',
        change: 'products',
    },
    {
        label: 'WhatsApp groups',
        total: 'totalGroups',
        series: 'Groups',
        change: 'groups',
    },
    {
        label: 'Lost & found',
        total: 'totalLostFound',
        series: 'LostFound',
        change: 'lostFound',
    },
    {
        label: 'Opportunities',
        total: 'totalGiveOpportunity',
        series: 'Opportunities',
        change: 'opportunities',
    },
];

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

// The API groups by UTC calendar day ("2026-09-29"), so the axis does too.
const utcDayKey = (date) => date.toISOString().slice(0, 10);

/** "2026-09-29" → "29 Sep" */
export const dayLabel = (key) => {
    const [, month, day] = String(key).split('-');
    return `${Number(day)} ${MONTHS[Number(month) - 1] || ''}`;
};

/** "2026-09-29" → "29 Sep 2026" */
export const fullDayLabel = (key) =>
    `${dayLabel(key)} ${String(key).slice(0, 4)}`;

/** "2026-09" → "Sep 2026" */
export const monthLabel = (key) => {
    const [year, month] = String(key).split('-');
    return `${MONTHS[Number(month) - 1] || ''} ${year}`;
};

/** "2026-09" → "Sep", with the year on January so the axis stays readable. */
export const monthTick = (key) => {
    const [year, month] = String(key).split('-');
    const name = MONTHS[Number(month) - 1] || '';
    return month === '01' ? `${name} ${year}` : name;
};

/** "2026-09" → "Sep ’26", for axes that span more than a year. */
export const monthYearTick = (key) => {
    const [year, month] = String(key).split('-');
    return `${MONTHS[Number(month) - 1] || ''} ’${year.slice(2)}`;
};

/** Every month key from `first` to `last`, inclusive ("2025-11", …). */
export const monthRange = (first, last) => {
    const keys = [];
    let [year, month] = first.split('-').map(Number);
    const [endYear, endMonth] = last.split('-').map(Number);
    while (year < endYear || (year === endYear && month <= endMonth)) {
        keys.push(`${year}-${String(month).padStart(2, '0')}`);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
    return keys;
};

/**
 * Adds up the per-type daily counts into one series. Ranges up to 90 days
 * are shown per day (missing days are zero); longer ranges per month.
 */
export const buildTimeline = (growthData, range) => {
    const perDay = {};
    Object.values(growthData || {}).forEach((rows) =>
        (rows || []).forEach((row) => {
            if (!row?._id) return;
            perDay[row._id] = (perDay[row._id] || 0) + (row.count || 0);
        }),
    );

    const days = range === 'all' ? null : Number(range);
    const today = new Date();

    if (days && days <= 90) {
        const points = [];
        for (let i = days; i >= 0; i -= 1) {
            const key = utcDayKey(new Date(today.getTime() - i * 864e5));
            points.push({ key, value: perDay[key] || 0 });
        }
        return { unit: 'day', points };
    }

    const perMonth = {};
    Object.entries(perDay).forEach(([key, count]) => {
        const month = key.slice(0, 7);
        perMonth[month] = (perMonth[month] || 0) + count;
    });
    const known = Object.keys(perMonth).sort();
    const last = utcDayKey(today).slice(0, 7);
    const first = days
        ? utcDayKey(new Date(today.getTime() - days * 864e5)).slice(0, 7)
        : known[0] || last;
    return {
        unit: 'month',
        points: monthRange(first, last).map((key) => ({
            key,
            value: perMonth[key] || 0,
        })),
    };
};

/** Zero-filled daily series for the last `days` days, oldest first. */
export const lastDays = (rows, days) => {
    const counts = Object.fromEntries(
        (rows || []).map((row) => [row._id, row.count || 0]),
    );
    const today = Date.now();
    return Array.from({ length: days }, (_, i) => {
        const key = utcDayKey(new Date(today - (days - 1 - i) * 864e5));
        return { key, value: counts[key] || 0 };
    });
};

/** Percentage change, rounded to a whole number; null when there's no base. */
export const percentChange = (current, previous) => {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
};

// Chart styling: recessive axes and grid, 11px mono ticks, colours from the
// theme variables so dark mode follows the page.
export const MONO_FONT = "'Geist Mono', ui-monospace, monospace";

export const AXIS_PROPS = {
    stroke: 'var(--ss-line)',
    tickLine: false,
    tick: { fill: 'var(--ss-muted)', fontSize: 11, fontFamily: MONO_FONT },
};

export const GRID_PROPS = {
    stroke: 'var(--ss-line-soft)',
    vertical: false,
};

export const LINE_CURSOR = {
    stroke: 'var(--ss-muted)',
    strokeWidth: 1,
    strokeDasharray: '3 3',
};

export const BAR_CURSOR = { fill: 'var(--ss-line-soft)' };

export const BAR_RADIUS = [4, 4, 0, 0];
