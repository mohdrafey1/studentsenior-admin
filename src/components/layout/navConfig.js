import {
    BarChart3,
    CheckSquare,
    CreditCard,
    FileText,
    Home,
    Layers,
    Megaphone,
    PenLine,
    Users,
} from 'lucide-react';

/** Console-wide pages, always visible at the top of the sidebar. */
export const WORKSPACE_ITEMS = [
    { id: 'home', label: 'Home', to: '/dashboard', icon: Home },
    {
        id: 'reports',
        label: 'Reports',
        to: '/reports',
        icon: FileText,
        end: true,
    },
    { id: 'tasks', label: 'Tasks', to: '/tasks', icon: CheckSquare },
    {
        id: 'notifications',
        label: 'Push notifications',
        to: '/notifications',
        icon: Megaphone,
    },
];

/** Pages scoped to one college. `path` is appended to /:collegeslug. */
export const COLLEGE_ITEMS = [
    { id: 'overview', label: 'Overview', path: '', end: true },
    { id: 'pyqs', label: 'PYQs', path: 'pyqs' },
    { id: 'solutions', label: 'PYQ solutions', path: 'pyqs-solutions' },
    { id: 'bulk-import', label: 'Bulk import PYQs', path: 'pyqs-bulk-import' },
    { id: 'notes', label: 'Notes', path: 'notes' },
    { id: 'quick-notes', label: 'Quick notes', path: 'quick-notes' },
    { id: 'syllabus', label: 'Syllabus', path: 'syllabus' },
    { id: 'videos', label: 'Videos', path: 'videos' },
    { id: 'store', label: 'Store', path: 'products' },
    { id: 'seniors', label: 'Seniors', path: 'seniors' },
    { id: 'groups', label: 'WhatsApp groups', path: 'groups' },
    { id: 'opportunities', label: 'Opportunities', path: 'opportunities' },
    { id: 'lost-found', label: 'Lost & found', path: 'lost-found' },
];

/** Collapsible groups below the college section. */
export const NAV_GROUPS = [
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        items: [
            { label: 'Overview', to: '/analytics', end: true },
            { label: 'Audience', to: '/analytics/audience' },
            { label: 'Content', to: '/analytics/content' },
            { label: 'Academics', to: '/analytics/academics' },
            { label: 'Revenue', to: '/analytics/revenue' },
            { label: 'Realtime', to: '/analytics/realtime' },
        ],
    },
    {
        id: 'money',
        label: 'Money',
        icon: CreditCard,
        items: [
            { label: 'Payments', to: '/reports/payments' },
            { label: 'Transactions', to: '/reports/transactions' },
            { label: 'Orders', to: '/reports/orders' },
            { label: 'Refund requests', to: '/reports/refunds' },
            { label: 'Redemptions', to: '/reports/redemptions' },
            { label: 'Subscriptions', to: '/reports/subscriptions' },
            { label: 'Content purchases', to: '/reports/content-purchases' },
        ],
    },
    {
        id: 'people',
        label: 'People',
        icon: Users,
        items: [
            { label: 'Users', to: '/users' },
            { label: 'Support tickets', to: '/support' },
            { label: 'Community', to: '/community' },
            { label: 'Admin team', to: '/reports/dashboard-users' },
        ],
    },
    {
        id: 'catalog',
        label: 'Catalog',
        icon: Layers,
        items: [
            { label: 'Courses', to: '/reports/courses' },
            { label: 'Branches', to: '/reports/branches' },
            { label: 'Subjects', to: '/reports/subjects' },
            { label: 'Affiliate products', to: '/affiliate-products' },
        ],
    },
    {
        id: 'blog',
        label: 'Blog',
        icon: PenLine,
        items: [
            { label: 'Posts', to: '/blog', end: true },
            { label: 'New post', to: '/blog/create' },
            { label: 'Blog analytics', to: '/blog/analytics' },
        ],
    },
];

/** True when `pathname` is `to` or a page below it. */
export const isPathActive = (pathname, to, end = false) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
