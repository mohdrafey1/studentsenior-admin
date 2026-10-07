import { collegeSlugFromPath } from '../../context/CollegeContext';
import { COLLEGE_ITEMS } from './navConfig';

// Console-wide paths: [pattern segments, trail]. `:id` matches any segment.
// Each trail entry is [label, link or null].
const ROUTES = [
    [['dashboard'], [['Home']]],
    [['analytics'], [['Analytics'], ['Overview']]],
    [
        ['analytics', 'chatbot'],
        [['Analytics', '/analytics'], ['Chatbot']],
    ],
    [
        ['analytics', 'audience'],
        [['Analytics', '/analytics'], ['Audience']],
    ],
    [
        ['analytics', 'content'],
        [['Analytics', '/analytics'], ['Content']],
    ],
    [
        ['analytics', 'content', ':id'],
        [['Analytics', '/analytics'], ['Content']],
    ],
    [
        ['analytics', 'academics'],
        [['Analytics', '/analytics'], ['Academics']],
    ],
    [
        ['analytics', 'revenue'],
        [['Analytics', '/analytics'], ['Revenue']],
    ],
    [
        ['analytics', 'realtime'],
        [['Analytics', '/analytics'], ['Realtime']],
    ],
    [
        ['analytics', 'open', ':id', ':id'],
        [['Analytics', '/analytics'], ['Open content']],
    ],
    [['tasks'], [['Tasks']]],
    [['notifications'], [['Push notifications']]],
    [['reports'], [['Reports']]],
    [['community'], [['People'], ['Community']]],
    [['affiliate-products'], [['Catalog'], ['Affiliate products']]],
    [['users'], [['People'], ['Users']]],
    [
        ['users', ':id'],
        [['People'], ['Users', '/users'], ['User']],
    ],
    [
        ['reports', 'payments'],
        [['Money', '/reports'], ['Payments']],
    ],
    [
        ['reports', 'payments', ':id'],
        [['Money', '/reports'], ['Payments', '/reports/payments'], ['Payment']],
    ],
    [
        ['reports', 'transactions'],
        [['Money', '/reports'], ['Transactions']],
    ],
    [
        ['reports', 'orders'],
        [['Money', '/reports'], ['Orders']],
    ],
    [
        ['reports', 'refunds'],
        [['Money', '/reports'], ['Refund requests']],
    ],
    [
        ['reports', 'redemptions'],
        [['Money', '/reports'], ['Redemptions']],
    ],
    [
        ['reports', 'subscriptions'],
        [['Money', '/reports'], ['Subscriptions']],
    ],
    [
        ['reports', 'content-purchases'],
        [['Money', '/reports'], ['Content purchases']],
    ],
    [['support'], [['People'], ['Support tickets']]],
    [
        ['support', ':id'],
        [['People'], ['Support tickets', '/support'], ['Ticket']],
    ],
    [
        ['reports', 'clients'],
        [['People'], ['Users']],
    ],
    [
        ['reports', 'dashboard-users'],
        [['People'], ['Admin team']],
    ],
    [
        ['reports', 'courses'],
        [['Catalog'], ['Courses']],
    ],
    [
        ['reports', 'branches'],
        [['Catalog'], ['Branches']],
    ],
    [
        ['reports', 'branches', ':id', 'subjects'],
        [['Catalog'], ['Branches', '/reports/branches'], ['Subjects']],
    ],
    [
        ['reports', 'subjects'],
        [['Catalog'], ['Subjects']],
    ],
    [
        ['reports', 'subjects', ':id', 'quick-notes'],
        [['Catalog'], ['Subjects', '/reports/subjects'], ['Quick notes']],
    ],
    [['blog'], [['Blog'], ['Posts']]],
    [
        ['blog', 'create'],
        [['Blog'], ['Posts', '/blog'], ['New post']],
    ],
    [
        ['blog', 'edit', ':id'],
        [['Blog'], ['Posts', '/blog'], ['Edit post']],
    ],
    [
        ['blog', 'analytics'],
        [['Blog'], ['Analytics']],
    ],
];

const matches = (pattern, segments) =>
    pattern.length === segments.length &&
    pattern.every((part, i) => part === ':id' || part === segments[i]);

/**
 * Breadcrumb trail for a path, as [{ label, to }]. The last entry is the
 * current page and has no link.
 */
export function buildBreadcrumbs(pathname, collegeName) {
    const segments = pathname.split('/').filter(Boolean);
    const slug = collegeSlugFromPath(pathname);

    if (slug) {
        const base = `/${slug}`;
        const trail = [{ label: collegeName || slug, to: base }];
        const section = COLLEGE_ITEMS.find(
            (item) => item.path && item.path === segments[1],
        );
        if (section) {
            trail.push({ label: section.label, to: `${base}/${section.path}` });
            if (segments[2]) {
                trail.push({
                    label: 'Details',
                    to: `${base}/${section.path}/${segments[2]}`,
                });
            }
            if (segments[3] === 'aisolution') {
                trail.push({ label: 'AI solutions', to: null });
            }
        }
        trail[trail.length - 1].to = null;
        return trail;
    }

    const route = ROUTES.find(([pattern]) => matches(pattern, segments));
    if (!route) return [];
    return route[1].map(([label, to], index, all) => ({
        label,
        to: index === all.length - 1 ? null : to || null,
    }));
}
