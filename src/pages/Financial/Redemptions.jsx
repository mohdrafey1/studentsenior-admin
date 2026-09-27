import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Gift } from 'lucide-react';
import FilterBar from '../../components/Common/FilterBar';
import {
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';

const statusColors = {
    pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const redemptionAmount = (row) => row.requestedPoints > 0
    ? `${row.requestedPoints} pts (₹${row.rewardBalance})` : `Legacy amount: ${row.rewardBalance} — needs reconciliation`;

const Redemptions = () => {
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totals, setTotals] = useState({ rupees: 0, points: 0, legacyCount: 0 });
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
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true); setError(null);
            try {
                const response = await api.get('/transactions/redemption-requests', { params: { page, pageSize, search, status, timeFilter, sortBy, sortOrder, timezoneOffset: new Date().getTimezoneOffset() }, signal: controller.signal });
                const result = response.data?.data;
                if (!Array.isArray(result?.items) || !result.pagination) throw new Error('Invalid list response');
                setItems(result.items); setTotalItems(result.pagination.total); setTotals(result.totals);
                if (result.pagination.totalPages > 0 && page > result.pagination.totalPages) setPage(result.pagination.totalPages);
            } catch (failure) {
                if (controller.signal.aborted) return;
                const message = failure.response?.data?.message || 'Could not load records. Please retry.';
                setError(message); toast.error(message);
            } finally {
                if (!controller.signal.aborted) { setLoading(false); setHasLoaded(true); }
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [page, pageSize, search, status, timeFilter, sortBy, sortOrder, refresh]);

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

    // Responsive view mode - auto switch on resize
    useEffect(() => {
        const handleResize = () => {
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const current = items;
    const totalPoints = totals.points;

    const updateStatus = async (id, newStatus, reason = '') => {
        try {
            if (newStatus.toLowerCase() === 'rejected' && !reason.trim()) {
                toast.error('Please provide a rejection reason');
                return;
            }
            const payload = { status: newStatus };
            if (newStatus.toLowerCase() === 'rejected') {
                payload.rejectionReason = reason.trim();
            }
            await api.put(`/transactions/redemption-requests/${id}`, payload);
            toast.success('Status updated');
            setRefresh((value) => value + 1);
            if (showRejectModal) {
                setShowRejectModal(false);
                setSelectedId(null);
                setRejectReason('');
            }
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading && !hasLoaded) {
        return <Loader />;
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main
                className={`py-4 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6'>
                    <BackButton title='Redemptions' TitleIcon={Gift} />

                    {/* Compact Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        {/* Total Points - Compact */}
                        {timeFilter && (
                            <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Total ({getTimeFilterLabel(timeFilter)}):
                                </span>
                                <span className='font-semibold text-gray-900 dark:text-white'>
                                    {totalPoints} pts · ₹{totals.rupees}
                                </span>
                            </div>
                        )}
                        <FilterBar
                            search={search}
                            onSearch={(value) => { setSearch(value); setPage(1); }}
                            filters={[
                                {
                                    label: 'Status',
                                    value: status,
                                    onChange: setStatus,
                                    options: [
                                        { value: '', label: 'All Status' },
                                        { value: 'pending', label: 'Pending' },
                                        {
                                            value: 'approved',
                                            label: 'Approved',
                                        },
                                        {
                                            value: 'rejected',
                                            label: 'Rejected',
                                        },
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
                                    {
                                        value: 'createdAt',
                                        label: 'Sort by Date',
                                    },
                                    {
                                        value: 'points',
                                        label: 'Sort by Points',
                                    },
                                ],
                            }}
                            sortOrder={{
                                value: sortOrder,
                                onToggle: () =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    ),
                            }}
                            viewMode={{
                                value: viewMode,
                                onChange: setViewMode,
                            }}
                            onClear={() => {
                                setSearch('');
                                setStatus('');
                                setTimeFilter('all');
                                setPage(1);
                            }}
                            showClear={
                                !!(
                                    search ||
                                    status ||
                                    (timeFilter && timeFilter !== 'all')
                                )
                            }
                        />
                    </div>
                    <p className='text-sm text-gray-600 mb-2'>Mark a withdrawal paid only after confirming the UPI transfer. Rejecting a pending request returns its reserved points.</p>
                    {totals.legacyCount > 0 && <p className='text-sm text-amber-700 mb-2'>{totals.legacyCount} older requests need reconciliation and are excluded from totals.</p>}
                    {loading && <p role='status' className='text-sm text-gray-500 mb-2'>Updating records…</p>}
                    {/* Error */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded text-sm mb-3'>
                            {error}
                        </div>
                    )}
                    {/* Grid/Table Views */}
                    {current.length > 0 ? (
                        <>
                            {/* Compact Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3'>
                                    {current.map((row) => (
                                        <div
                                            key={row._id}
                                            className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
                                        >
                                            <div className='flex justify-between items-start mb-2'>
                                                <span
                                                    className={`px-1.5 py-0.5 text-xs rounded ${statusColors[row.status] || statusColors.Pending}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </div>
                                            <div className='mb-2'>
                                                <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                    {row.owner?.username ||
                                                        row.owner?.name ||
                                                        'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                    {row.owner?.email || 'N/A'}
                                                </div>
                                            </div>
                                            <div className='mb-1'>
                                                <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                    {redemptionAmount(row)}
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                    UPI:{' '}
                                                    {row.amount ??
                                                        row.upiId ??
                                                        '-'}
                                                </div>
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                {row.createdAt
                                                    ? new Date(
                                                          row.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                            {String(
                                                row.status,
                                            ).toLowerCase() === 'pending' ? (
                                                <div className='flex gap-1.5'>
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                row._id,
                                                                'approved',
                                                            )
                                                        }
                                                        className='flex-1 px-2 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 text-xs'
                                                    >
                                                        Mark paid
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedId(
                                                                row._id,
                                                            );
                                                            setRejectReason(
                                                                row.rejectionReason ||
                                                                    '',
                                                            );
                                                            setShowRejectModal(
                                                                true,
                                                            );
                                                        }}
                                                        className='flex-1 px-2 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-xs'
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='text-center text-gray-400 text-xs py-1'>
                                                    —
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Compact Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden mb-3'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-900'>
                                                <tr>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        User
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Points
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        UPI
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Status
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Date
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((row) => (
                                                    <tr
                                                        key={row._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-900'
                                                    >
                                                        <td className='px-3 py-2 whitespace-nowrap'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {row.owner
                                                                    ?.username ||
                                                                    row.owner
                                                                        ?.name ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                                {row.owner
                                                                    ?.email ||
                                                                    'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {redemptionAmount(row)}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                            {row.amount ??
                                                                row.upiId ??
                                                                0}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap'>
                                                            <span
                                                                className={`px-1.5 py-0.5 text-xs rounded ${statusColors[row.status] || statusColors.Pending}`}
                                                            >
                                                                {row.status}
                                                            </span>
                                                            {row.rejectionReason && (
                                                                <div className='mt-0.5 text-xs italic text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                                                                    {
                                                                        row.rejectionReason
                                                                    }
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                            {row.createdAt
                                                                ? new Date(
                                                                      row.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs'>
                                                            {String(
                                                                row.status,
                                                            ).toLowerCase() ===
                                                            'pending' ? (
                                                                <div className='inline-flex gap-1.5'>
                                                                    <button
                                                                        onClick={() =>
                                                                            updateStatus(
                                                                                row._id,
                                                                                'approved',
                                                                            )
                                                                        }
                                                                        className='px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:opacity-90'
                                                                    >
                                                                        Mark paid
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedId(
                                                                                row._id,
                                                                            );
                                                                            setRejectReason(
                                                                                row.rejectionReason ||
                                                                                    '',
                                                                            );
                                                                            setShowRejectModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className='px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:opacity-90'
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className='text-gray-400'>
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Compact Pagination */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-2'>
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
                            </div>
                        </>
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center py-12'>
                            <Gift className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                No Redemption Requests Found
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                No requests match your current filters.
                            </p>
                        </div>
                    )}
                    {showRejectModal && (
                        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                            <div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                                    Reject request
                                </h3>
                                <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
                                    Please provide a reason for rejection.
                                </p>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    rows={4}
                                    placeholder='Enter rejection reason...'
                                    className='w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500'
                                />
                                <div className='mt-4 flex justify-end gap-2'>
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setSelectedId(null);
                                            setRejectReason('');
                                        }}
                                        className='px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() =>
                                            selectedId &&
                                            updateStatus(
                                                selectedId,
                                                'rejected',
                                                rejectReason,
                                            )
                                        }
                                        className='px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700'
                                    >
                                        Confirm Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Redemptions;
