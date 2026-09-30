import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Gem } from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatNumber } from '../../utils/format';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Panel,
    Stat,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import { humanize } from './financeFormat';
import { UserCell } from './financeParts';

const STATUS_TABS = [
    ['', 'All'],
    ['active', 'Active'],
    ['trial', 'Trial'],
    ['pending', 'Pending'],
    ['expired', 'Expired'],
    ['cancelled', 'Cancelled'],
];

const PLATFORM_LABELS = { android: 'Android', ios: 'iOS' };
const platformLabel = (p) => PLATFORM_LABELS[p] || humanize(p) || '—';
const planLabel = (productId) => humanize(productId) || 'Unknown plan';

/** "in 13 days", "today", "3 days ago" for an expiry date. */
const untilText = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const days = Math.round((date.getTime() - Date.now()) / 864e5);
    if (days === 0) return 'today';
    if (days > 0) return days === 1 ? 'in 1 day' : `in ${days} days`;
    return days === -1 ? '1 day ago' : `${-days} days ago`;
};

/** Share of active subscriptions by some key, as rows for a bar list. */
const splitBy = (subs, keyOf, labelOf) => {
    const counts = {};
    subs.forEach((s) => {
        const key = keyOf(s) || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
    });
    const total = subs.length || 1;
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
            key,
            label: labelOf(key),
            count,
            share: Math.round((count / total) * 100),
            width: Math.max(2, Math.round((count / max) * 100)),
        }));
};

const SplitPanel = ({ title, titleId, rows }) => (
    <Panel title={title} titleId={titleId} bodyClassName='px-5 py-4'>
        {rows.length === 0 ? (
            <p className='text-[13.5px] text-muted'>
                No active subscriptions yet.
            </p>
        ) : (
            <ul className='flex flex-col gap-3'>
                {rows.map((row) => (
                    <li key={row.key} className='flex flex-col gap-1.5'>
                        <div className='flex items-baseline gap-2 text-[13.5px]'>
                            <span className='flex-1 text-ink'>{row.label}</span>
                            <span className='font-mono text-[13px] text-ink'>
                                {formatNumber(row.count)}
                            </span>
                            <span className='w-10 text-right text-xs text-muted'>
                                {row.share}%
                            </span>
                        </div>
                        <div
                            className='h-1.5 rounded-full bg-line-soft overflow-hidden'
                            aria-hidden='true'
                        >
                            <div
                                className='h-full rounded-full bg-brand'
                                style={{ width: `${row.width}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </Panel>
);

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });
    const navigate = useNavigate();
    const location = useLocation();

    const fetchSubscriptions = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.get('/subscription');
            setSubscriptions(response?.data?.data || []);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Couldn’t load subscriptions. Check your connection and try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const response = await api.get('/subscription/analytics');
            setAnalytics(response?.data?.data || null);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        fetchAnalytics();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const fs = params.get('filterStatus') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterStatus(fs);
        setTimeFilter(tf);
        setSortBy(sb);
        setSortOrder(so === 'asc' ? 'asc' : 'desc');
        setViewMode(vm === 'grid' ? 'grid' : 'table');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist params on changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        params.set('search', search || '');
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('filterStatus', filterStatus || '');
        params.set('timeFilter', timeFilter || '');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('view', viewMode);
        const newSearch = params.toString();
        if (newSearch !== location.search.replace(/^\?/, '')) {
            navigate({ search: newSearch }, { replace: true });
        }
    }, [
        search,
        page,
        pageSize,
        filterStatus,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Search and time filters; the status tab is applied after, so tab
    // counts reflect everything else.
    const baseSubscriptions = useMemo(() => {
        let filtered = [...subscriptions];

        // Search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    (s.client?.email || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (s.client?.username || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (s.productId || '').toLowerCase().includes(searchLower),
            );
        }

        // Time filter
        return filtered.filter((s) => filterByTime(s, timeFilter));
    }, [subscriptions, search, timeFilter]);

    // Client-side status filter and sorting
    const filteredAndSortedSubscriptions = useMemo(() => {
        let filtered = [...baseSubscriptions];

        // Status filter
        if (filterStatus) {
            filtered = filtered.filter((s) => s.status === filterStatus);
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            } else if (sortBy === 'expiryDate') {
                aVal = new Date(a.expiryDate).getTime();
                bVal = new Date(b.expiryDate).getTime();
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [baseSubscriptions, filterStatus, sortBy, sortOrder]);

    const counts = useMemo(
        () =>
            baseSubscriptions.reduce(
                (acc, s) => {
                    acc[s.status] = (acc[s.status] || 0) + 1;
                    return acc;
                },
                { '': baseSubscriptions.length },
            ),
        [baseSubscriptions],
    );

    const active = useMemo(
        () => subscriptions.filter((s) => s.status === 'active'),
        [subscriptions],
    );

    // Pagination
    const totalItems = filteredAndSortedSubscriptions.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentSubscriptions = filteredAndSortedSubscriptions.slice(
        startIndex,
        endIndex,
    );

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const hasFilters = Boolean(search || (timeFilter && timeFilter !== 'all'));
    const clearFilters = () => {
        setSearch('');
        setTimeFilter('');
        setPage(1);
    };

    if (loading && analyticsLoading) {
        return <Loader />;
    }

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={Gem}
            title={
                subscriptions.length === 0
                    ? 'No subscriptions yet'
                    : 'No subscriptions match'
            }
            description={
                subscriptions.length === 0
                    ? 'Premium plans bought in the apps appear here.'
                    : 'Try another search, status or date range.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const expiryCell = (s) => (
        <div className='flex flex-col gap-0.5 whitespace-nowrap'>
            <span>{formatDate(s.expiryDate)}</span>
            {s.expiryDate && (
                <span
                    className={`text-xs ${
                        s.status === 'active' &&
                        !s.autoRenewing &&
                        new Date(s.expiryDate) - Date.now() < 7 * 864e5 &&
                        new Date(s.expiryDate) > Date.now()
                            ? 'text-warn-ink'
                            : 'text-muted'
                    }`}
                >
                    {untilText(s.expiryDate)}
                    {s.status === 'active' &&
                        s.autoRenewing === false &&
                        ', not renewing'}
                </span>
            )}
        </div>
    );

    const renewLabel = (s) =>
        s.autoRenewing === undefined || s.autoRenewing === null
            ? '—'
            : s.autoRenewing
              ? 'On'
              : 'Off';

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Subscriptions'
                description='Premium plans bought in the Android and iOS apps.'
            />

            {(analytics || analyticsLoading) && (
                <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6'>
                    <Stat
                        label='Active'
                        loading={analyticsLoading}
                        value={formatNumber(
                            analytics?.overview?.activeSubscriptions,
                        )}
                        note='Paid and current'
                    />
                    <Stat
                        label='Trials claimed'
                        loading={analyticsLoading}
                        value={formatNumber(analytics?.trials?.total)}
                        note={`${formatNumber(analytics?.trials?.today)} today`}
                    />
                    <Stat
                        label='Premium users'
                        loading={analyticsLoading}
                        value={formatNumber(analytics?.overview?.premiumUsers)}
                        note='Currently premium'
                    />
                    <Stat
                        label='Trial to paid'
                        loading={analyticsLoading}
                        value={`${analytics?.metrics?.conversionRate || 0}%`}
                        note='Trials that converted'
                    />
                    <Stat
                        label='Churn'
                        loading={analyticsLoading}
                        value={`${analytics?.metrics?.churnRate || 0}%`}
                        note='Cancelled or expired'
                    />
                    <Stat
                        label='Expired'
                        loading={analyticsLoading}
                        value={formatNumber(
                            analytics?.overview?.expiredSubscriptions,
                        )}
                        note='No longer premium'
                    />
                </div>
            )}

            {!loading && subscriptions.length > 0 && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                    <SplitPanel
                        title='Active by plan'
                        titleId='plan-split-title'
                        rows={splitBy(active, (s) => s.productId, planLabel)}
                    />
                    <SplitPanel
                        title='Active by platform'
                        titleId='platform-split-title'
                        rows={splitBy(active, (s) => s.platform, platformLabel)}
                    />
                </div>
            )}

            <Tabs
                label='Subscription status'
                className='mb-4'
                value={filterStatus}
                onChange={(value) => {
                    setFilterStatus(value);
                    setPage(1);
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                    count: counts[value] || 0,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by username, email or plan'
                timeFilter={{
                    value: timeFilter,
                    onChange: (v) => {
                        setTimeFilter(v);
                        setPage(1);
                    },
                }}
                sortBy={{
                    value: sortBy,
                    onChange: setSortBy,
                    options: [
                        { value: 'createdAt', label: 'Sort by date' },
                        { value: 'expiryDate', label: 'Sort by expiry' },
                    ],
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                viewMode={{
                    value: viewMode,
                    onChange: setViewMode,
                }}
                onClear={clearFilters}
                showClear={hasFilters}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchSubscriptions}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {currentSubscriptions.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={960}>
                            <thead>
                                <tr>
                                    <Th>Student</Th>
                                    <Th>Plan</Th>
                                    <Th>Status</Th>
                                    <Th>Platform</Th>
                                    <Th>Auto-renew</Th>
                                    <Th>Started</Th>
                                    <Th>Expires</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentSubscriptions.map((subscription) => (
                                    <Tr key={subscription._id}>
                                        <Td className='max-w-[260px]'>
                                            <UserCell
                                                user={subscription.client}
                                            />
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span>
                                                    {planLabel(
                                                        subscription.productId,
                                                    )}
                                                </span>
                                                {subscription.productId && (
                                                    <code className='font-mono text-xs text-muted'>
                                                        {subscription.productId}
                                                    </code>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <StatusBadge
                                                status={subscription.status}
                                            />
                                        </Td>
                                        <Td className='text-ink-2'>
                                            {platformLabel(
                                                subscription.platform,
                                            )}
                                        </Td>
                                        <Td className='text-ink-2'>
                                            {renewLabel(subscription)}
                                        </Td>
                                        <Td className='whitespace-nowrap'>
                                            {formatDate(subscription.startDate)}
                                        </Td>
                                        <Td>{expiryCell(subscription)}</Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='px-4 py-3 border-t border-line-soft'>
                            {pagination}
                        </div>
                    )}
                </div>
            ) : currentSubscriptions.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {currentSubscriptions.map((subscription) => (
                            <article
                                key={subscription._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0'>
                                        <UserCell user={subscription.client} />
                                    </div>
                                    <StatusBadge status={subscription.status} />
                                </div>
                                <div className='flex flex-wrap items-baseline gap-x-2 text-[13.5px]'>
                                    <span className='font-medium text-ink'>
                                        {planLabel(subscription.productId)}
                                    </span>
                                    <span className='text-muted'>
                                        {platformLabel(subscription.platform)} ·
                                        Auto-renew {renewLabel(subscription)}
                                    </span>
                                </div>
                                <div className='grid grid-cols-2 gap-3 pt-3 border-t border-line-soft text-[13px]'>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='text-xs text-muted'>
                                            Started
                                        </span>
                                        <span>
                                            {formatDate(subscription.startDate)}
                                        </span>
                                    </div>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='text-xs text-muted'>
                                            Expires
                                        </span>
                                        {expiryCell(subscription)}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
