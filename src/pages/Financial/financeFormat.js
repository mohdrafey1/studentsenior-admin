// Labels, money formatting and CSV paging shared by the Money pages.
// Units, as stored by the API:
//   Payment.amount                  rupees
//   Order.amount                    points when paymentMethod is 'points',
//                                   rupees for 'online' and 'iap'
//   Transaction.points              points, negative for debits
//   RedemptionRequest.requestedPoints points; rewardBalance is rupees (a string)
//   list totals.rupees / .points    rupees / points over the filtered records
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatINR, formatNumber } from '../../utils/format';

export const humanize = (value) => {
    if (!value) return '';
    const text = String(value).replace(/[_-]+/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export const ORDER_TYPE_LABELS = {
    pyq_purchase: 'PYQ purchase',
    note_purchase: 'Note purchase',
    add_points: 'Wallet top-up',
};
export const orderTypeLabel = (type) =>
    ORDER_TYPE_LABELS[type] || humanize(type) || '—';

export const PAYMENT_METHOD_LABELS = {
    points: 'Points',
    online: 'Online',
    iap: 'In-app',
};
export const paymentMethodLabel = (method) =>
    PAYMENT_METHOD_LABELS[method] || humanize(method) || '—';

export const TRANSACTION_TYPE_LABELS = {
    earn: 'Earned',
    spend: 'Spent',
    add: 'Top-up',
    redeem: 'Redeemed',
    refund: 'Refund',
    bonus: 'Bonus',
    sale: 'Sale',
    deduct: 'Deducted',
};
export const transactionTypeLabel = (type) =>
    TRANSACTION_TYPE_LABELS[type] || humanize(type) || '—';

/** Rupees, exact: shows paise only when the amount has them. */
export const formatRupees = (amount) => {
    const n = Number(amount || 0);
    const text = formatINR(Math.abs(n), { decimals: !Number.isInteger(n) });
    return n < 0 ? `−${text}` : text;
};

/** Amount in its own currency; Razorpay payments are INR. */
export const formatMoney = (amount, currency = 'INR') =>
    !currency || currency.toUpperCase() === 'INR'
        ? formatRupees(amount)
        : `${currency.toUpperCase()} ${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatPts = (points) => `${formatNumber(points)} pts`;

/** "+50 pts" / "−50 pts" for ledger entries. */
export const formatSignedPts = (points) => {
    const n = Number(points || 0);
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return `${sign}${formatNumber(Math.abs(n))} pts`;
};

/** Order.amount is points for points orders and rupees otherwise. */
export const formatOrderAmount = (order) =>
    order?.paymentMethod === 'points'
        ? formatPts(order.amount)
        : formatRupees(order?.amount);

/** "18:42" in local time, or '' for a missing date. */
export const timeOf = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export const userName = (user) =>
    user?.username || user?.name || user?.email || 'Unknown user';

export const isObjectId = (value) =>
    typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

/** "66f9a1…c3e2" — short form of a Mongo id for tables. */
export const shortId = (id) => {
    const text = String(id || '');
    return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
};

export const copyText = async (text, what) => {
    try {
        await navigator.clipboard.writeText(String(text));
        toast.success(`${what} copied`);
    } catch {
        toast.error('Couldn’t copy. Select the text and copy it instead.');
    }
};

export const EXPORT_LIMIT = 5000;

/**
 * Fetch every page of a financial list with the page's current filters, for
 * CSV export. Stops at EXPORT_LIMIT rows.
 */
export async function fetchAllPages(endpoint, params) {
    const rows = [];
    let total = 0;
    for (let page = 1; rows.length < EXPORT_LIMIT; page += 1) {
        const response = await api.get(endpoint, {
            params: { ...params, page, pageSize: 100 },
        });
        const result = response.data?.data;
        if (!Array.isArray(result?.items) || !result.pagination) {
            throw new Error('Invalid list response');
        }
        rows.push(...result.items);
        total = result.pagination.total;
        if (page >= result.pagination.totalPages) break;
    }
    return { rows: rows.slice(0, EXPORT_LIMIT), total };
}
