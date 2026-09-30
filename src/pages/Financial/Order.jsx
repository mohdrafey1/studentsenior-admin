import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, ShoppingBag } from 'lucide-react';
import api from '../../utils/api';
import { downloadCsv } from '../../utils/csv';
import { formatDateTime, formatNumber } from '../../utils/format';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { getTimeFilterLabel } from '../../components/Common/timeFilterUtils';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Stat,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import {
    EXPORT_LIMIT,
    ORDER_TYPE_LABELS,
    PAYMENT_METHOD_LABELS,
    fetchAllPages,
    formatOrderAmount,
    orderTypeLabel,
    paymentMethodLabel,
    shortId,
} from './financeFormat';
import { DateCell, PointsValue, RupeeValue, UserCell } from './financeParts';

const STATUS_TABS = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['processing', 'Processing'],
    ['completed', 'Completed'],
    ['failed', 'Failed'],
    ['cancelled', 'Cancelled'],
];

/** What was bought: the PYQ or note title, or the top-up size. */
const itemTitle = (o) => {
    if (o.orderType === 'add_points') {
        // Top-ups are paid in rupees and credit 5 pts per rupee.
        return o.paymentMethod === 'points'
            ? 'Wallet top-up'
            : `Wallet top-up · ${formatNumber(Number(o.amount || 0) * 5)} pts`;
    }
    return o.metadata?.resourceTitle || 'Untitled item';
};

export default function OrderPage() {
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totals, setTotals] = useState({ rupees: 0, points: 0 });
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [orderType, setOrderType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | amount
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const navigate = useNavigate();
    const location = useLocation();

    const listParams = () => ({
        search,
        status,
        orderType,
        paymentMethod,
        timeFilter,
        sortBy,
        sortOrder,
        timezoneOffset: new Date().getTimezoneOffset(),
    });

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/order', {
                    params: { page, pageSize, ...listParams() },
                    signal: controller.signal,
                });
                const result = response.data?.data;
                if (!Array.isArray(result?.items) || !result.pagination)
                    throw new Error('Invalid list response');
                setItems(result.items);
                setTotalItems(result.pagination.total);
                setTotals(result.totals);
                if (
                    result.pagination.totalPages > 0 &&
                    page > result.pagination.totalPages
                )
                    setPage(result.pagination.totalPages);
            } catch (failure) {
                if (controller.signal.aborted) return;
                setError(
                    failure.response?.data?.message ||
                        'Couldn’t load orders. Check your connection and try again.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setHasLoaded(true);
                }
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page,
        pageSize,
        search,
        status,
        orderType,
        paymentMethod,
        timeFilter,
        sortBy,
        sortOrder,
        refresh,
    ]);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const st = params.get('status') || '';
        const ot = params.get('orderType') || '';
        const pm = params.get('paymentMethod') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? Math.min(ps, 100) : 12);
        setStatus(st);
        setOrderType(ot);
        setPaymentMethod(pm);
        setTimeFilter(tf);
        setSortBy(sb === 'amount' ? 'amount' : 'createdAt');
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
        params.set('status', status || '');
        params.set('orderType', orderType || '');
        params.set('paymentMethod', paymentMethod || '');
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
        status,
        orderType,
        paymentMethod,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    const hasFilters = Boolean(
        search ||
            orderType ||
            paymentMethod ||
            (timeFilter && timeFilter !== 'all'),
    );
    const clearFilters = () => {
        setSearch('');
        setOrderType('');
        setPaymentMethod('');
        setTimeFilter('all');
        setPage(1);
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            const { rows, total } = await fetchAllPages('/order', listParams());
            downloadCsv(
                'orders',
                [
                    {
                        label: 'Created',
                        value: (o) => formatDateTime(o.createdAt),
                    },
                    { label: 'Order ID', value: (o) => o._id },
                    { label: 'Username', value: (o) => o.user?.username },
                    { label: 'Email', value: (o) => o.user?.email },
                    { label: 'Type', value: (o) => o.orderType },
                    { label: 'Item', value: (o) => o.metadata?.resourceTitle },
                    { label: 'Paid with', value: (o) => o.paymentMethod },
                    {
                        label: 'Amount (rupees)',
                        value: (o) =>
                            o.paymentMethod === 'points' ? '' : o.amount,
                    },
                    {
                        label: 'Amount (points)',
                        value: (o) =>
                            o.paymentMethod === 'points' ? o.amount : '',
                    },
                    { label: 'Status', value: (o) => o.status },
                    { label: 'Failure reason', value: (o) => o.failureReason },
                    { label: 'Payment ID', value: (o) => o.paymentId },
                ],
                rows,
            );
            toast.success(
                total > EXPORT_LIMIT
                    ? `Exported the first ${formatNumber(EXPORT_LIMIT)} of ${formatNumber(total)} orders`
                    : `Exported ${formatNumber(rows.length)} orders`,
            );
        } catch (failure) {
            toast.error(
                failure.response?.data?.message ||
                    'Couldn’t export orders. Try again.',
            );
        } finally {
            setExporting(false);
        }
    };

    if (loading && !hasLoaded) {
        return <Loader />;
    }

    const timeLabel = getTimeFilterLabel(timeFilter).toLowerCase();
    const statusLabel = STATUS_TABS.find(([v]) => v === status)?.[1] || 'All';
    const scope = `${statusLabel === 'All' ? 'All statuses' : statusLabel} · ${timeLabel}`;
    const paymentLink = (o) =>
        o.paymentId ? `/reports/payments/${o.paymentId}` : null;

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={ShoppingBag}
            title={hasFilters || status ? 'No orders match' : 'No orders yet'}
            description={
                hasFilters || status
                    ? 'Try another search, status or date range.'
                    : 'PYQ and note unlocks and wallet top-ups appear here.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const orderIdCell = (o) =>
        paymentLink(o) ? (
            <Link
                to={paymentLink(o)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Open the payment for order ${o._id}`}
                title={o._id}
                className='font-mono text-xs text-link hover:underline'
            >
                {shortId(o._id)}
            </Link>
        ) : (
            <code title={o._id} className='font-mono text-xs text-ink-2'>
                {shortId(o._id)}
            </code>
        );

    const statusCell = (o) => (
        <div className='flex flex-col items-start gap-1'>
            <StatusBadge status={o.status} />
            {o.failureReason && (
                <span className='text-xs text-muted max-w-[200px] line-clamp-2'>
                    {o.failureReason}
                </span>
            )}
        </div>
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Orders'
                description='Every purchase attempt: PYQ and note unlocks, and wallet top-ups.'
                actions={
                    <Button
                        icon={Download}
                        onClick={exportCsv}
                        disabled={!totalItems || exporting}
                    >
                        {exporting ? 'Exporting…' : 'Export CSV'}
                    </Button>
                }
            />

            <div className='grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6'>
                <Stat
                    label='Paid in rupees'
                    value={<RupeeValue amount={totals?.rupees} />}
                    note={`Online and in-app · ${scope}`}
                />
                <Stat
                    label='Paid in points'
                    value={<PointsValue points={totals?.points} />}
                    note={`From wallets · ${scope}`}
                />
                <Stat
                    className='col-span-2 lg:col-span-1'
                    label='Orders'
                    value={formatNumber(totalItems)}
                    note={
                        orderType
                            ? orderTypeLabel(orderType)
                            : 'Unlocks and top-ups'
                    }
                />
            </div>

            <Tabs
                label='Order status'
                className='mb-4'
                value={status}
                onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by username, email or order ID'
                filters={[
                    {
                        label: 'Order type',
                        value: orderType,
                        onChange: (value) => {
                            setOrderType(value);
                            setPage(1);
                        },
                        options: [
                            { value: '', label: 'Any type' },
                            ...Object.entries(ORDER_TYPE_LABELS).map(
                                ([value, label]) => ({ value, label }),
                            ),
                        ],
                    },
                    {
                        label: 'Payment method',
                        value: paymentMethod,
                        onChange: (value) => {
                            setPaymentMethod(value);
                            setPage(1);
                        },
                        options: [
                            { value: '', label: 'Any payment method' },
                            ...Object.entries(PAYMENT_METHOD_LABELS).map(
                                ([value, label]) => ({ value, label }),
                            ),
                        ],
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
                        <Button
                            size='sm'
                            onClick={() => setRefresh((v) => v + 1)}
                        >
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <p role='status' className='sr-only'>
                {loading ? 'Updating orders…' : ''}
            </p>

            {viewMode === 'table' ? (
                <div
                    aria-busy={loading}
                    className={`bg-sheet border border-line rounded-xl overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    {items.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={1000}>
                            <thead>
                                <tr>
                                    <Th>Order</Th>
                                    <Th>User</Th>
                                    <Th>Item</Th>
                                    <Th>Paid with</Th>
                                    <Th align='right'>Amount</Th>
                                    <Th>Status</Th>
                                    <Th>Created</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((o) => (
                                    <Tr
                                        key={o._id}
                                        onClick={
                                            paymentLink(o)
                                                ? () => navigate(paymentLink(o))
                                                : undefined
                                        }
                                    >
                                        <Td>{orderIdCell(o)}</Td>
                                        <Td className='max-w-[220px]'>
                                            <UserCell user={o.user} />
                                        </Td>
                                        <Td className='max-w-[300px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <span className='text-ink truncate'>
                                                    {itemTitle(o)}
                                                </span>
                                                {o.orderType !==
                                                    'add_points' && (
                                                    <span className='text-[12.5px] text-muted'>
                                                        {orderTypeLabel(
                                                            o.orderType,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td className='whitespace-nowrap text-ink-2'>
                                            {paymentMethodLabel(
                                                o.paymentMethod,
                                            )}
                                        </Td>
                                        <Td
                                            align='right'
                                            mono
                                            className='font-medium whitespace-nowrap'
                                        >
                                            {formatOrderAmount(o)}
                                        </Td>
                                        <Td>{statusCell(o)}</Td>
                                        <Td>
                                            <DateCell value={o.createdAt} />
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='flex flex-col gap-2 px-4 py-3 border-t border-line-soft'>
                            {items.some((o) => o.paymentId) && (
                                <span className='text-xs text-muted'>
                                    Online orders open their payment.
                                </span>
                            )}
                            {pagination}
                        </div>
                    )}
                </div>
            ) : items.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div
                    aria-busy={loading}
                    className={`flex flex-col gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {items.map((o) => (
                            <article
                                key={o._id}
                                onClick={
                                    paymentLink(o)
                                        ? () => navigate(paymentLink(o))
                                        : undefined
                                }
                                className={`flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl ${paymentLink(o) ? 'hover:border-line-strong cursor-pointer transition-colors' : ''}`}
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0'>
                                        <UserCell user={o.user} />
                                    </div>
                                    <StatusBadge status={o.status} />
                                </div>
                                {o.failureReason && (
                                    <p className='text-[13px] text-ink-2'>
                                        <span className='text-muted'>
                                            Failure:{' '}
                                        </span>
                                        {o.failureReason}
                                    </p>
                                )}
                                <div className='flex flex-col gap-0.5 min-w-0'>
                                    <span className='text-[13.5px] text-ink truncate'>
                                        {itemTitle(o)}
                                    </span>
                                    <span className='text-[12.5px] text-muted'>
                                        {orderTypeLabel(o.orderType)} ·{' '}
                                        {paymentMethodLabel(o.paymentMethod)}
                                    </span>
                                </div>
                                <span className='font-mono text-lg font-medium text-ink'>
                                    {formatOrderAmount(o)}
                                </span>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft text-xs text-muted'>
                                    <span className='flex-1 min-w-0 truncate'>
                                        {orderIdCell(o)}
                                    </span>
                                    <span className='whitespace-nowrap'>
                                        {formatDateTime(o.createdAt)}
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
}
