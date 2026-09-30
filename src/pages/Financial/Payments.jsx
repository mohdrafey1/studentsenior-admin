import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, CreditCard, Download } from 'lucide-react';
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
    fetchAllPages,
    formatMoney,
    userName,
} from './financeFormat';
import { DateCell, RupeeValue, UserCell } from './financeParts';

const STATUS_TABS = [
    ['', 'All'],
    ['captured', 'Captured'],
    ['pending', 'Pending'],
    ['initiated', 'Initiated'],
    ['authorized', 'Authorized'],
    ['failed', 'Failed'],
    ['refunded', 'Refunded'],
];

const ORDER_TYPE_OPTIONS = [
    { value: '', label: 'Any type' },
    { value: 'pyq_purchase', label: 'PYQ purchase' },
    { value: 'note_purchase', label: 'Note purchase' },
    { value: 'add_points', label: 'Wallet top-up' },
];

const reference = (payment) =>
    payment.gatewayOrderId || payment.merchantOrderId || payment._id;

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totals, setTotals] = useState({ rupees: 0, points: 0 });
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [orderType, setOrderType] = useState('');
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

    const listParams = () => ({
        search,
        status: filterStatus,
        orderType,
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
                const response = await api.get('/payment', {
                    params: { page, pageSize, ...listParams() },
                    signal: controller.signal,
                });
                const result = response.data?.data;
                if (!Array.isArray(result?.items) || !result.pagination)
                    throw new Error('Invalid list response');
                setPayments(result.items);
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
                        'Couldn’t load payments. Check your connection and try again.',
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
        filterStatus,
        orderType,
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
        const fs = params.get('filterStatus') || '';
        setOrderType(params.get('orderType') || '');
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? Math.min(ps, 100) : 12);
        setFilterStatus(fs);
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
        params.set('filterStatus', filterStatus || '');
        params.set('orderType', orderType || '');
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
        orderType,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    const hasFilters = Boolean(
        search || orderType || (timeFilter && timeFilter !== 'all'),
    );
    const clearFilters = () => {
        setSearch('');
        setOrderType('');
        setTimeFilter('');
        setPage(1);
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            const { rows, total } = await fetchAllPages(
                '/payment',
                listParams(),
            );
            downloadCsv(
                'payments',
                [
                    {
                        label: 'Date',
                        value: (p) => formatDateTime(p.createdAt),
                    },
                    { label: 'Username', value: (p) => p.user?.username },
                    { label: 'Email', value: (p) => p.user?.email },
                    { label: 'Amount', value: (p) => p.amount },
                    { label: 'Currency', value: (p) => p.currency || 'INR' },
                    { label: 'Status', value: (p) => p.status },
                    { label: 'Provider', value: (p) => p.provider },
                    {
                        label: 'Gateway order ID',
                        value: (p) => p.gatewayOrderId,
                    },
                    {
                        label: 'Merchant order ID',
                        value: (p) => p.merchantOrderId,
                    },
                    { label: 'Payment record ID', value: (p) => p._id },
                ],
                rows,
            );
            toast.success(
                total > EXPORT_LIMIT
                    ? `Exported the first ${formatNumber(EXPORT_LIMIT)} of ${formatNumber(total)} payments`
                    : `Exported ${formatNumber(rows.length)} payments`,
            );
        } catch (failure) {
            toast.error(
                failure.response?.data?.message ||
                    'Couldn’t export payments. Try again.',
            );
        } finally {
            setExporting(false);
        }
    };

    if (loading && !hasLoaded) {
        return <Loader />;
    }

    const openPayment = (payment) =>
        navigate(`/reports/payments/${payment._id}`);
    const timeLabel = getTimeFilterLabel(timeFilter).toLowerCase();
    const statusLabel =
        STATUS_TABS.find(([v]) => v === filterStatus)?.[1] || 'All';

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={CreditCard}
            title={
                hasFilters || filterStatus
                    ? 'No payments match'
                    : 'No payments yet'
            }
            description={
                hasFilters || filterStatus
                    ? 'Try another search, status or date range.'
                    : 'Razorpay payments for PYQs, notes and wallet top-ups appear here.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Payments'
                description='Razorpay payments for PYQs, notes and wallet top-ups.'
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

            <div className='grid grid-cols-2 gap-3 sm:gap-4 mb-6'>
                <Stat
                    label={
                        filterStatus === 'captured'
                            ? 'Captured'
                            : 'Total amount'
                    }
                    value={<RupeeValue amount={totals?.rupees} />}
                    note={`${statusLabel === 'All' ? 'All statuses' : statusLabel} · ${timeLabel}`}
                />
                <Stat
                    label='Payments'
                    value={formatNumber(totalItems)}
                    note={
                        orderType
                            ? ORDER_TYPE_OPTIONS.find(
                                  (o) => o.value === orderType,
                              )?.label
                            : 'PYQs, notes and top-ups'
                    }
                />
            </div>

            <Tabs
                label='Payment status'
                className='mb-4'
                value={filterStatus}
                onChange={(value) => {
                    setFilterStatus(value);
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
                        options: ORDER_TYPE_OPTIONS,
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
                {loading ? 'Updating payments…' : ''}
            </p>

            {viewMode === 'table' ? (
                <div
                    aria-busy={loading}
                    className={`bg-sheet border border-line rounded-xl overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    {payments.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={860}>
                            <thead>
                                <tr>
                                    <Th>User</Th>
                                    <Th>Reference</Th>
                                    <Th align='right'>Amount</Th>
                                    <Th>Status</Th>
                                    <Th>Date</Th>
                                    <Th className='w-10'>
                                        <span className='sr-only'>Open</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <Tr
                                        key={payment._id}
                                        onClick={() => openPayment(payment)}
                                    >
                                        <Td className='max-w-[280px]'>
                                            <UserCell user={payment.user} />
                                        </Td>
                                        <Td className='max-w-[260px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <Link
                                                    to={`/reports/payments/${payment._id}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    aria-label={`Open payment ${reference(payment)}`}
                                                    className='font-mono text-xs text-ink-2 hover:underline truncate'
                                                >
                                                    {reference(payment)}
                                                </Link>
                                                <span className='text-xs text-muted'>
                                                    {payment.provider ||
                                                        'Unknown provider'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td
                                            align='right'
                                            mono
                                            className='font-medium whitespace-nowrap'
                                        >
                                            {formatMoney(
                                                payment.amount,
                                                payment.currency,
                                            )}
                                        </Td>
                                        <Td>
                                            <StatusBadge
                                                status={payment.status}
                                            />
                                        </Td>
                                        <Td>
                                            <DateCell
                                                value={payment.createdAt}
                                            />
                                        </Td>
                                        <Td align='right'>
                                            <ChevronRight
                                                className='w-4 h-4 text-muted inline'
                                                aria-hidden='true'
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
            ) : payments.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div
                    aria-busy={loading}
                    className={`flex flex-col gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {payments.map((payment) => (
                            <article
                                key={payment._id}
                                onClick={() => openPayment(payment)}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0'>
                                        <UserCell user={payment.user} />
                                    </div>
                                    <StatusBadge status={payment.status} />
                                </div>
                                <Link
                                    to={`/reports/payments/${payment._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Open payment of ${formatMoney(payment.amount, payment.currency)} by ${userName(payment.user)}`}
                                    className='font-mono text-lg font-medium text-ink hover:underline self-start'
                                >
                                    {formatMoney(
                                        payment.amount,
                                        payment.currency,
                                    )}
                                </Link>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft text-xs text-muted min-w-0'>
                                    <span className='font-mono truncate flex-1'>
                                        {reference(payment)}
                                    </span>
                                    <span className='whitespace-nowrap'>
                                        {formatDateTime(payment.createdAt)}
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

export default Payments;
