import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Gift, X } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import FilterBar from '../../components/Common/FilterBar';
import { getTimeFilterLabel } from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    Dialog,
    EmptyState,
    Field,
    MetaList,
    PageHeader,
    Stat,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Textarea,
    Th,
    Tr,
} from '../../components/ui';
import { formatPts, formatRupees, userName } from './financeFormat';
import {
    CopyButton,
    DateCell,
    PointsValue,
    RupeeValue,
    UserCell,
} from './financeParts';

const STATUS_TABS = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['approved', 'Paid'],
    ['rejected', 'Rejected'],
];

const STAT_LABELS = {
    '': 'Requested',
    pending: 'To pay',
    approved: 'Paid',
    rejected: 'Rejected',
};

// Older requests stored only a rupee amount in rewardBalance, no points.
const isLegacy = (row) => !(row.requestedPoints > 0);

/** What the student is owed: rewardBalance is rupees for current requests. */
const payLabel = (row) =>
    isLegacy(row)
        ? `Legacy amount: ${row.rewardBalance}`
        : formatRupees(row.rewardBalance);

const upiOf = (row) => row.upiId;

const RedemptionStatus = ({ row, showReason = true }) => (
    <div className='flex flex-col items-start gap-1'>
        {row.status === 'approved' ? (
            <StatusBadge tone='ok'>Paid</StatusBadge>
        ) : (
            <StatusBadge status={row.status} />
        )}
        {showReason && row.rejectionReason && (
            <span className='text-xs text-muted max-w-[220px] line-clamp-2'>
                {row.rejectionReason}
            </span>
        )}
    </div>
);

const Redemptions = () => {
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totals, setTotals] = useState({
        rupees: 0,
        points: 0,
        legacyCount: 0,
    });
    const [hasLoaded, setHasLoaded] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | points
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [payingRow, setPayingRow] = useState(null);
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(
                    '/transactions/redemption-requests',
                    {
                        params: {
                            page,
                            pageSize,
                            search,
                            status,
                            timeFilter,
                            sortBy,
                            sortOrder,
                            timezoneOffset: new Date().getTimezoneOffset(),
                        },
                        signal: controller.signal,
                    },
                );
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
                        'Couldn’t load redemption requests. Check your connection and try again.',
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
    }, [
        page,
        pageSize,
        search,
        status,
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
        setTimeFilter(tf);
        setSortBy(sb === 'points' ? 'points' : 'createdAt');
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
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    const updateStatus = async (id, newStatus, reason = '') => {
        try {
            if (newStatus.toLowerCase() === 'rejected' && !reason.trim()) {
                setRejectError('Add a reason so the student knows why.');
                return;
            }
            const payload = { status: newStatus };
            if (newStatus.toLowerCase() === 'rejected') {
                payload.rejectionReason = reason.trim();
            }
            setBusy(true);
            await api.put(`/transactions/redemption-requests/${id}`, payload);
            toast.success(
                newStatus === 'approved'
                    ? 'Marked as paid'
                    : 'Request rejected and points returned',
            );
            setRefresh((value) => value + 1);
            setPayingRow(null);
            if (showRejectModal) {
                setShowRejectModal(false);
                setSelectedId(null);
                setRejectReason('');
            }
        } catch (e) {
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t update the request. Try again.',
            );
        } finally {
            setBusy(false);
        }
    };

    const openReject = (row) => {
        setSelectedId(row._id);
        setRejectReason(row.rejectionReason || '');
        setRejectError('');
        setShowRejectModal(true);
    };
    const closeReject = () => {
        setShowRejectModal(false);
        setSelectedId(null);
        setRejectReason('');
    };

    const hasFilters = Boolean(search || (timeFilter && timeFilter !== 'all'));
    const clearFilters = () => {
        setSearch('');
        setTimeFilter('all');
        setPage(1);
    };

    if (loading && !hasLoaded) {
        return <Loader />;
    }

    const rejecting = items.find((row) => row._id === selectedId);
    const timeLabel = getTimeFilterLabel(timeFilter).toLowerCase();
    const legacyCount = totals?.legacyCount || 0;

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
            icon={Gift}
            tone={status === 'pending' && !hasFilters ? 'done' : 'neutral'}
            title={
                status === 'pending' && !hasFilters
                    ? 'Nothing to pay'
                    : hasFilters || status
                      ? 'No requests match'
                      : 'No redemption requests yet'
            }
            description={
                status === 'pending' && !hasFilters
                    ? 'New UPI withdrawal requests appear here.'
                    : hasFilters || status
                      ? 'Try another search, status or date range.'
                      : 'Students’ UPI withdrawal requests appear here.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const actions = (row) =>
        String(row.status).toLowerCase() === 'pending' ? (
            <div className='flex justify-end gap-1.5'>
                <Button
                    size='sm'
                    variant='ghost'
                    className='text-bad-ink hover:text-bad-ink'
                    aria-label={`Reject request from ${userName(row.owner)}`}
                    onClick={() => openReject(row)}
                >
                    Reject…
                </Button>
                <Button
                    size='sm'
                    variant='primary'
                    icon={Check}
                    aria-label={`Mark ${payLabel(row)} paid to ${userName(row.owner)}`}
                    onClick={() => setPayingRow(row)}
                >
                    Mark paid
                </Button>
            </div>
        ) : null;

    const pointsCell = (row) =>
        isLegacy(row) ? '—' : formatPts(row.requestedPoints);

    const payCell = (row, className = 'text-[13px]') =>
        isLegacy(row) ? (
            <div className='flex flex-col items-start gap-1'>
                <span className={`font-mono font-medium ${className}`}>
                    {payLabel(row)}
                </span>
                <StatusBadge tone='warn'>Needs reconciliation</StatusBadge>
            </div>
        ) : (
            <span className={`font-mono font-medium ${className}`}>
                {payLabel(row)}
            </span>
        );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='UPI redemptions'
                description='Students turning points into money. Mark a request paid only after the UPI transfer has gone through. Rejecting a pending request returns its reserved points.'
            />

            <div className='grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6'>
                <Stat
                    label={STAT_LABELS[status] || 'Requested'}
                    attention={status === 'pending' && totalItems > 0}
                    value={<RupeeValue amount={totals?.rupees} />}
                    note={`${formatNumber(Math.max(0, totalItems - legacyCount))} requests · ${timeLabel}`}
                />
                <Stat
                    label='Points'
                    value={<PointsValue points={totals?.points} />}
                    note='5 pts = ₹1'
                />
                <Stat
                    className='col-span-2 lg:col-span-1'
                    label='Requests'
                    value={formatNumber(totalItems)}
                    note={
                        legacyCount > 0
                            ? `${formatNumber(legacyCount)} need reconciling`
                            : 'UPI withdrawal requests'
                    }
                />
            </div>

            {legacyCount > 0 && (
                <Alert tone='warn' className='mb-4'>
                    {legacyCount === 1
                        ? '1 older request only stores a rupee amount, not points, so it’s left out of these totals and needs reconciling by hand.'
                        : `${formatNumber(legacyCount)} older requests only store a rupee amount, not points, so they’re left out of these totals and need reconciling by hand.`}
                </Alert>
            )}

            <Tabs
                label='Redemption status'
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
                searchPlaceholder='Search by username, email or request ID'
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
                        { value: 'points', label: 'Sort by points' },
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
                {loading ? 'Updating requests…' : ''}
            </p>

            {viewMode === 'table' ? (
                <div
                    aria-busy={loading}
                    className={`bg-sheet border border-line rounded-xl overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}
                >
                    {items.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={1040}>
                            <thead>
                                <tr>
                                    <Th>Student</Th>
                                    <Th align='right'>Points</Th>
                                    <Th>Pay</Th>
                                    <Th>UPI ID</Th>
                                    <Th>Status</Th>
                                    <Th>Requested</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <Tr key={row._id}>
                                        <Td className='max-w-[240px]'>
                                            <UserCell user={row.owner} />
                                        </Td>
                                        <Td
                                            align='right'
                                            mono
                                            className='whitespace-nowrap'
                                        >
                                            {pointsCell(row)}
                                        </Td>
                                        <Td className='whitespace-nowrap'>
                                            {payCell(row)}
                                        </Td>
                                        <Td>
                                            {upiOf(row) !== undefined &&
                                            upiOf(row) !== null ? (
                                                <div className='flex items-center gap-1'>
                                                    <code className='font-mono text-xs text-ink-2 whitespace-nowrap'>
                                                        {String(upiOf(row))}
                                                    </code>
                                                    <CopyButton
                                                        value={upiOf(row)}
                                                        what='UPI ID'
                                                        label={`Copy UPI ID for ${userName(row.owner)}`}
                                                    />
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </Td>
                                        <Td>
                                            <RedemptionStatus row={row} />
                                        </Td>
                                        <Td>
                                            <DateCell value={row.createdAt} />
                                        </Td>
                                        <Td align='right'>{actions(row)}</Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='flex flex-col gap-2 px-4 py-3 border-t border-line-soft'>
                            <span className='text-xs text-muted'>
                                5 pts = ₹1
                            </span>
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
                        {items.map((row) => (
                            <article
                                key={row._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0'>
                                        <UserCell user={row.owner} />
                                    </div>
                                    <RedemptionStatus
                                        row={row}
                                        showReason={false}
                                    />
                                </div>
                                <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                                    {payCell(row, 'text-lg text-ink')}
                                    {!isLegacy(row) && (
                                        <span className='font-mono text-[13px] text-muted'>
                                            {pointsCell(row)}
                                        </span>
                                    )}
                                </div>
                                {row.rejectionReason && (
                                    <p className='text-[13px] text-ink-2'>
                                        <span className='text-muted'>
                                            Reason:{' '}
                                        </span>
                                        {row.rejectionReason}
                                    </p>
                                )}
                                <div className='flex items-center gap-1 min-w-0 text-[13px] text-ink-2'>
                                    <span className='text-muted'>UPI</span>
                                    <code className='font-mono text-xs break-all'>
                                        {upiOf(row) ?? '—'}
                                    </code>
                                    {upiOf(row) !== undefined &&
                                        upiOf(row) !== null && (
                                            <CopyButton
                                                value={upiOf(row)}
                                                what='UPI ID'
                                                label={`Copy UPI ID for ${userName(row.owner)}`}
                                            />
                                        )}
                                </div>
                                <div className='flex flex-wrap items-center gap-2 pt-3 border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted whitespace-nowrap'>
                                        {formatDateTime(row.createdAt)}
                                    </span>
                                    {actions(row)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <Dialog
                open={Boolean(payingRow)}
                onClose={() => setPayingRow(null)}
                busy={busy}
                size='sm'
                title={
                    payingRow ? (
                        isLegacy(payingRow) ? (
                            'Mark this older request as paid?'
                        ) : (
                            <>
                                Mark{' '}
                                <RupeeValue amount={payingRow.rewardBalance} />{' '}
                                as paid?
                            </>
                        )
                    ) : (
                        ''
                    )
                }
                description='Only confirm after the UPI transfer has gone through. A paid request can’t be changed afterwards.'
                footer={
                    <>
                        <Button
                            onClick={() => setPayingRow(null)}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='primary'
                            icon={Check}
                            disabled={busy}
                            onClick={() =>
                                updateStatus(payingRow._id, 'approved')
                            }
                        >
                            {busy ? 'Saving…' : 'Mark paid'}
                        </Button>
                    </>
                }
            >
                {payingRow && (
                    <MetaList
                        labelWidth={88}
                        items={[
                            {
                                label: 'Student',
                                value: userName(payingRow.owner),
                            },
                            {
                                label: 'UPI ID',
                                value:
                                    upiOf(payingRow) !== undefined &&
                                    upiOf(payingRow) !== null
                                        ? String(upiOf(payingRow))
                                        : undefined,
                                mono: true,
                            },
                            {
                                label: 'Pay',
                                value: payLabel(payingRow),
                            },
                            {
                                label: 'Points',
                                value: isLegacy(payingRow)
                                    ? 'None recorded, needs reconciliation'
                                    : `${formatPts(payingRow.requestedPoints)}, already taken from the wallet`,
                            },
                            {
                                label: 'Requested',
                                value: `${formatDateTime(payingRow.createdAt)} (${relativeTime(payingRow.createdAt)})`,
                            },
                        ]}
                    />
                )}
            </Dialog>

            <Dialog
                open={showRejectModal}
                onClose={closeReject}
                busy={busy}
                size='sm'
                title='Reject this request?'
                description={
                    rejecting && !isLegacy(rejecting)
                        ? `${formatPts(rejecting.requestedPoints)} go back to ${userName(rejecting.owner)}’s wallet. The student sees your reason.`
                        : 'The student sees your reason.'
                }
                footer={
                    <>
                        <Button onClick={closeReject} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            variant='danger-solid'
                            icon={X}
                            disabled={busy}
                            onClick={() =>
                                selectedId &&
                                updateStatus(
                                    selectedId,
                                    'rejected',
                                    rejectReason,
                                )
                            }
                        >
                            {busy ? 'Rejecting…' : 'Reject request'}
                        </Button>
                    </>
                }
            >
                <div className='flex flex-col gap-3'>
                    {rejecting && isLegacy(rejecting) && (
                        <Alert tone='warn'>
                            This older request has no points recorded, so it
                            can’t be rejected until it’s reconciled.
                        </Alert>
                    )}
                    <Field
                        label='Reason for the student'
                        required
                        error={rejectError}
                    >
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => {
                                setRejectReason(e.target.value);
                                setRejectError('');
                            }}
                            rows={4}
                            placeholder='For example: the UPI ID doesn’t match your account name'
                            disabled={busy}
                        />
                    </Field>
                </div>
            </Dialog>
        </div>
    );
};

export default Redemptions;
