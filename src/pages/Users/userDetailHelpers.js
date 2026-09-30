import { formatINR, formatPoints, POINTS_PER_RUPEE } from '../../utils/format';
import { examTypeLabel } from '../../utils/labels';

export const EMPTY_CONTENT = {
    notes: [],
    pyqs: [],
    products: [],
    groups: [],
    opportunities: [],
    lostFound: [],
};

// One tab per list returned by GET /user/content/:userId. `path` is the
// college-scoped route of the item's detail page.
export const CONTENT_TABS = [
    { key: 'notes', label: 'Notes', noun: 'notes', path: 'notes' },
    { key: 'pyqs', label: 'PYQs', noun: 'PYQs', path: 'pyqs' },
    {
        key: 'products',
        label: 'Store',
        noun: 'store listings',
        path: 'products',
    },
    {
        key: 'groups',
        label: 'Groups',
        noun: 'WhatsApp groups',
        path: 'groups',
    },
    {
        key: 'opportunities',
        label: 'Opportunities',
        noun: 'opportunities',
        path: 'opportunities',
    },
    {
        key: 'lostFound',
        label: 'Lost & found',
        noun: 'lost & found posts',
        path: 'lost-found',
    },
];

const capitalise = (text) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : '';

/** Title and one line of context for an item in the Uploads panel. */
export const describeItem = (key, item) => {
    switch (key) {
        case 'notes':
            return {
                title: item.title || 'Untitled note',
                meta: item.isPaid ? formatPoints(item.price) : 'Free',
            };
        case 'pyqs':
            return {
                title: item.slug || 'Untitled PYQ',
                meta: [
                    examTypeLabel(item.examType),
                    item.year,
                    item.isPaid ? formatPoints(item.price) : 'Free',
                ]
                    .filter(Boolean)
                    .join(' · '),
            };
        case 'products':
            return {
                title: item.name || 'Untitled listing',
                meta: [
                    formatINR(item.price),
                    item.available === false ? 'Sold out' : 'Available',
                ].join(' · '),
            };
        case 'groups':
            return {
                title: item.title || 'Untitled group',
                meta: item.domain || item.info || 'WhatsApp group',
            };
        case 'opportunities':
            return {
                title: item.name || 'Untitled opportunity',
                meta: item.email || item.link || 'No contact given',
            };
        case 'lostFound':
            return {
                title: item.title || 'Untitled post',
                meta: [
                    capitalise(item.type),
                    item.location,
                    capitalise(item.currentStatus),
                ]
                    .filter(Boolean)
                    .join(' · '),
            };
        default:
            return { title: item.title || item.name || 'Untitled', meta: '' };
    }
};

/** Notes and PYQs count `clickCounts`; everything else `clickCount`. */
export const itemViews = (item) =>
    Number(item.clickCounts ?? item.clickCount ?? 0);

export const TRANSACTION_LABELS = {
    earn: 'Earned',
    spend: 'Spent',
    add: 'Points bought',
    redeem: 'Redeemed',
    refund: 'Refund',
    bonus: 'Bonus',
    sale: 'Sale',
    deduct: 'Deducted',
};

/** Rupee value of a points amount, with paise only when needed. */
export const pointsWorth = (points) => {
    const rupees = Number(points || 0) / POINTS_PER_RUPEE;
    return formatINR(rupees, { decimals: rupees % 1 !== 0 });
};

/** The date a grant of `days` days of premium ends, counted from now as the API does. */
export const premiumEndFromNow = (days) => {
    const end = new Date();
    end.setDate(end.getDate() + Number(days || 0));
    return end;
};
