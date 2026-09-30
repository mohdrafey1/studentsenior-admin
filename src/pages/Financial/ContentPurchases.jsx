import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
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
    Td,
    Th,
    Tr,
} from '../../components/ui';
import { formatRupees } from './financeFormat';
import { DateCell, RupeeValue, UserCell } from './financeParts';

const TIER_OPTIONS = [
    { value: '', label: 'Any tier' },
    { value: 'content_tier_5', label: '₹5' },
    { value: 'content_tier_10', label: '₹10' },
    { value: 'content_tier_20', label: '₹20' },
    { value: 'content_tier_50', label: '₹50' },
    { value: 'content_tier_99', label: '₹99' },
];

const getTypeLabel = (orderType) =>
    orderType === 'pyq_purchase' ? 'PYQ' : 'Note';

const contentTitle = (purchase) =>
    purchase.metadata?.resourceTitle ||
    purchase.resourceId?.title ||
    'Unknown content';

const ContentPurchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTier, setFilterTier] = useState('');
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

    const fetchPurchases = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.get('/content-purchases');
            setPurchases(response?.data?.data || []);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Couldn’t load purchases. Check your connection and try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const response = await api.get('/content-purchases/analytics');
            setAnalytics(response?.data?.data || null);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchAnalytics();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const ft = params.get('filterType') || '';
        const fti = params.get('filterTier') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterType(ft);
        setFilterTier(fti);
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
        params.set('filterType', filterType || '');
        params.set('filterTier', filterTier || '');
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
        filterType,
        filterTier,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Client-side filtering and sorting
    const filteredAndSortedPurchases = useMemo(() => {
        let filtered = [...purchases];

        // Search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    (p.user?.email || '').toLowerCase().includes(searchLower) ||
                    (p.user?.username || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (p.metadata?.resourceTitle || '')
                        .toLowerCase()
                        .includes(searchLower),
            );
        }

        // Type filter
        if (filterType) {
            filtered = filtered.filter((p) => p.orderType === filterType);
        }

        // Tier filter
        if (filterTier) {
            filtered = filtered.filter(
                (p) => p.metadata?.productId === filterTier,
            );
        }

        // Time filter
        filtered = filtered.filter((p) => filterByTime(p, timeFilter));

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            } else if (sortBy === 'amount') {
                aVal = a.amount || 0;
                bVal = b.amount || 0;
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [
        purchases,
        search,
        filterType,
        filterTier,
        timeFilter,
        sortBy,
        sortOrder,
    ]);

    // Pagination
    const totalItems = filteredAndSortedPurchases.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPurchases = filteredAndSortedPurchases.slice(
        startIndex,
        endIndex,
    );

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const hasFilters = Boolean(
        search ||
            filterType ||
            filterTier ||
            (timeFilter && timeFilter !== 'all'),
    );
    const clearFilters = () => {
        setSearch('');
        setFilterType('');
        setFilterTier('');
        setTimeFilter('');
        setPage(1);
    };

    if (loading && analyticsLoading) {
        return <Loader />;
    }

    const tiers = analytics?.byTier || [];
    const maxTierRevenue = Math.max(1, ...tiers.map((t) => t.revenue || 0));

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
            icon={ShoppingCart}
            title={
                purchases.length === 0
                    ? 'No purchases yet'
                    : 'No purchases match'
            }
            description={
                purchases.length === 0
                    ? 'PYQs and notes bought through Google Play appear here.'
                    : 'Try another search, type, tier or date range.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const typeBadge = (purchase) => (
        <StatusBadge tone='outline'>
            {getTypeLabel(purchase.orderType)}
        </StatusBadge>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Content purchases'
                description='PYQs and notes bought through Google Play in-app purchases.'
            />

            {(analytics || analyticsLoading) && (
                <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6'>
                    <Stat
                        label='Revenue'
                        loading={analyticsLoading}
                        value={
                            <RupeeValue
                                amount={analytics?.overview?.totalRevenue}
                            />
                        }
                        note='Completed purchases, all time'
                    />
                    <Stat
                        label='Purchases'
                        loading={analyticsLoading}
                        value={formatNumber(
                            analytics?.overview?.totalPurchases,
                        )}
                        note='PYQs and notes'
                    />
                    <Stat
                        label='Buyers'
                        loading={analyticsLoading}
                        value={formatNumber(analytics?.overview?.uniqueBuyers)}
                        note='Unique students'
                    />
                    <Stat
                        label='Today'
                        loading={analyticsLoading}
                        value={
                            <RupeeValue amount={analytics?.today?.revenue} />
                        }
                        note={`${formatNumber(analytics?.today?.purchases)} purchases`}
                    />
                </div>
            )}

            {analytics && (
                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 mb-6 items-start'>
                    <Panel
                        title='Revenue by price tier'
                        titleId='tier-title'
                        action={
                            <span className='text-xs text-muted'>
                                Purchases · revenue
                            </span>
                        }
                        bodyClassName='px-5 py-4'
                    >
                        {tiers.length === 0 ? (
                            <p className='text-[13.5px] text-muted'>
                                No completed purchases yet.
                            </p>
                        ) : (
                            <ul className='flex flex-col gap-3'>
                                {tiers.map((tier) => (
                                    <li
                                        key={tier.productId || 'unknown'}
                                        className='grid grid-cols-[44px_minmax(0,1fr)_52px_76px] items-center gap-3 text-[13.5px]'
                                    >
                                        <span className='font-mono text-[13px] text-ink'>
                                            {tier.price
                                                ? formatRupees(tier.price)
                                                : tier.productId || '—'}
                                        </span>
                                        <span
                                            className='h-1.5 rounded-full bg-line-soft overflow-hidden'
                                            aria-hidden='true'
                                        >
                                            <span
                                                className='block h-full rounded-full bg-brand'
                                                style={{
                                                    width: `${Math.max(
                                                        2,
                                                        Math.round(
                                                            ((tier.revenue ||
                                                                0) /
                                                                maxTierRevenue) *
                                                                100,
                                                        ),
                                                    )}%`,
                                                }}
                                            />
                                        </span>
                                        <span className='text-right text-muted whitespace-nowrap'>
                                            {formatNumber(tier.count)}
                                        </span>
                                        <span className='text-right font-mono text-[13px] text-ink whitespace-nowrap'>
                                            {formatRupees(tier.revenue)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel
                        title='PYQs and notes'
                        titleId='type-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-4'
                    >
                        <div className='grid grid-cols-2 gap-3'>
                            {[
                                ['PYQs', analytics.byContentType?.pyqs],
                                ['Notes', analytics.byContentType?.notes],
                            ].map(([label, data]) => (
                                <div
                                    key={label}
                                    className='flex flex-col gap-1.5 p-3.5 rounded-lg bg-sunken'
                                >
                                    <span className='text-[13px] text-ink-2'>
                                        {label}
                                    </span>
                                    <span className='font-serif font-bold text-[24px] leading-none text-ink'>
                                        <RupeeValue amount={data?.revenue} />
                                    </span>
                                    <span className='text-[12.5px] text-muted'>
                                        {formatNumber(data?.count)} purchases
                                    </span>
                                </div>
                            ))}
                        </div>
                        <span className='text-[12.5px] text-muted'>
                            Amounts are what students paid, before Google Play’s
                            fee.
                        </span>
                    </Panel>
                </div>
            )}

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by content title or student'
                filters={[
                    {
                        label: 'Type',
                        value: filterType,
                        onChange: (value) => {
                            setFilterType(value);
                            setPage(1);
                        },
                        options: [
                            { value: '', label: 'PYQs and notes' },
                            { value: 'pyq_purchase', label: 'PYQs' },
                            { value: 'note_purchase', label: 'Notes' },
                        ],
                    },
                    {
                        label: 'Tier',
                        value: filterTier,
                        onChange: (value) => {
                            setFilterTier(value);
                            setPage(1);
                        },
                        options: TIER_OPTIONS,
                    },
                ]}
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
                        { value: 'amount', label: 'Sort by amount' },
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
                        <Button size='sm' onClick={fetchPurchases}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {currentPurchases.length === 0 ? (
                        !loading && !error && empty
                    ) : (
                        <Table minWidth={900}>
                            <thead>
                                <tr>
                                    <Th>Content</Th>
                                    <Th>Type</Th>
                                    <Th>Student</Th>
                                    <Th align='right'>Paid</Th>
                                    <Th>Status</Th>
                                    <Th>Date</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPurchases.map((purchase) => (
                                    <Tr key={purchase._id}>
                                        <Td className='max-w-[320px]'>
                                            <span className='block truncate font-medium text-ink'>
                                                {contentTitle(purchase)}
                                            </span>
                                        </Td>
                                        <Td>{typeBadge(purchase)}</Td>
                                        <Td className='max-w-[240px]'>
                                            <UserCell user={purchase.user} />
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex flex-col items-end gap-0.5'>
                                                <span className='font-mono text-[13px] font-medium whitespace-nowrap'>
                                                    {formatRupees(
                                                        purchase.amount,
                                                    )}
                                                </span>
                                                {purchase.metadata
                                                    ?.productId && (
                                                    <code className='font-mono text-[11.5px] text-muted'>
                                                        {
                                                            purchase.metadata
                                                                .productId
                                                        }
                                                    </code>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <StatusBadge
                                                status={purchase.status}
                                            />
                                        </Td>
                                        <Td>
                                            <DateCell
                                                value={purchase.createdAt}
                                            />
                                        </Td>
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
            ) : currentPurchases.length === 0 ? (
                !loading &&
                !error && (
                    <div className='bg-sheet border border-line rounded-xl'>
                        {empty}
                    </div>
                )
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {currentPurchases.map((purchase) => (
                            <article
                                key={purchase._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                <div className='flex items-start gap-2'>
                                    <span className='flex-1 min-w-0 font-medium text-ink line-clamp-2'>
                                        {contentTitle(purchase)}
                                    </span>
                                    <span className='font-mono text-[15px] font-medium text-ink whitespace-nowrap'>
                                        {formatRupees(purchase.amount)}
                                    </span>
                                </div>
                                <div className='flex flex-wrap items-center gap-1.5'>
                                    {typeBadge(purchase)}
                                    <StatusBadge status={purchase.status} />
                                </div>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft'>
                                    <div className='flex-1 min-w-0'>
                                        <UserCell user={purchase.user} />
                                    </div>
                                    <span className='text-xs text-muted whitespace-nowrap'>
                                        {formatDateTime(purchase.createdAt)}
                                    </span>
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

export default ContentPurchases;
