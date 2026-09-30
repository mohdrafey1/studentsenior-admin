// Display formatting shared by every page, so numbers, money and dates
// read the same everywhere (Indian digit grouping, day-month-year).

export const POINTS_PER_RUPEE = 5;

export const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN');

export const formatINR = (rupees, { decimals = false } = {}) =>
    `₹${Number(rupees || 0).toLocaleString('en-IN', {
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
    })}`;

/** What a student pays in rupees for a price in points (rounded up, as the API charges). */
export const pointsToRupees = (points) =>
    Math.ceil(Number(points || 0) / POINTS_PER_RUPEE);

/** PYQ and note prices are in points; this shows "Free" or "₹10 · 50 pts". */
export const formatPoints = (points) => {
    const p = Number(points || 0);
    if (p <= 0) return 'Free';
    return `${formatINR(pointsToRupees(p))} · ${formatNumber(p)} pts`;
};

// Fixed month names: browsers disagree on "Sep" vs "Sept".
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

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const time = (date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** "29 Sep 2026" */
export const formatDate = (value) => {
    const date = toDate(value);
    if (!date) return '—';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** "29 Sep 2026, 18:42" */
export const formatDateTime = (value) => {
    const date = toDate(value);
    if (!date) return '—';
    return `${formatDate(date)}, ${time(date)}`;
};

/** "29 Sep, 18:42" — for tables; adds the year when it isn't this year. */
export const formatShortDateTime = (value) => {
    const date = toDate(value);
    if (!date) return '—';
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return `${date.getDate()} ${MONTHS[date.getMonth()]}${sameYear ? '' : ` ${date.getFullYear()}`}, ${time(date)}`;
};

/** "29 Sep" (or "29 Sep 2025" for another year) */
export const formatShortDate = (value) => {
    const date = toDate(value);
    if (!date) return '—';
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return `${date.getDate()} ${MONTHS[date.getMonth()]}${sameYear ? '' : ` ${date.getFullYear()}`}`;
};
