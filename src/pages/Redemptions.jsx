import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Gift,
    ArrowLeft,
    Loader,
    Search,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    User,
    Calendar,
} from 'lucide-react';
import Pagination from '../components/Pagination';

const statusColors = {
    pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const Redemptions = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
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

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/transactions/redemption-requests');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load redemption requests');
            toast.error('Failed to load redemption requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Responsive view mode - auto switch on resize
    useEffect(() => {
        const handleResize = () => {
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = items
            .filter((it) => {
                const user = it.owner || it.user; // backend populates 'owner'
                const email = (user?.email || '').toLowerCase();
                const name = (user?.username || user?.name || '').toLowerCase();
                const matchesSearch =
                    !q || email.includes(q) || name.includes(q);
                const matchesStatus =
                    !status ||
                    (it.status || '').toLowerCase() === status.toLowerCase();
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                let aVal = 0;
                let bVal = 0;
                if (sortBy === 'createdAt') {
                    aVal = new Date(a.createdAt || 0).getTime();
                    bVal = new Date(b.createdAt || 0).getTime();
                } else if (sortBy === 'points') {
                    aVal = Number(a.rewardBalance || 0);
                    bVal = Number(b.rewardBalance || 0);
                }
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
        return list;
    }, [items, search, status, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

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
            setItems((prev) =>
                prev.map((x) =>
                    x._id === id
                        ? {
                              ...x,
                              status: newStatus,
                              rejectionReason:
                                  newStatus.toLowerCase() === 'rejected'
                                      ? reason.trim()
                                      : '',
                          }
                        : x,
                ),
            );
            if (showRejectModal) {
                setShowRejectModal(false);
                setSelectedId(null);
                setRejectReason('');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div
                    className={`flex items-center justify-center py-20 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading redemption requests...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main
                className={`pt-6 pb-12 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex items-center mb-8'>
                        <button
                            onClick={() => navigate('/reports')}
                            className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <div className='flex items-center'>
                            <div className='bg-purple-600 text-white p-3 rounded-lg mr-4'>
                                <Gift className='w-6 h-6' />
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                    Redemption Requests
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    Review and update redemption requests
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search, Filters, View & Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        {/* Search */}
                        <div className='relative mb-4'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by user (email/name)'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            />
                        </div>

                        <div className='flex flex-wrap items-center gap-3'>
                            {/* View toggle */}
                            <div className='flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Grid view'
                                >
                                    <Grid3x3 className='w-4 h-4' />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Table view'
                                >
                                    <List className='w-4 h-4' />
                                </button>
                            </div>

                            {/* Status Filter */}
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Status</option>
                                <option value='pending'>Pending</option>
                                <option value='approved'>Approved</option>
                                <option value='rejected'>Rejected</option>
                            </select>

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value='createdAt'>Sort by Date</option>
                                <option value='points'>Sort by Points</option>
                            </select>

                            {/* Sort Order */}
                            <button
                                onClick={() =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    )
                                }
                                className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                title={
                                    sortOrder === 'asc'
                                        ? 'Ascending'
                                        : 'Descending'
                                }
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className='w-4 h-4' />
                                ) : (
                                    <SortDesc className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Grid/Table Views */}
                    {current.length > 0 ? (
                        <>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6'>
                                    {current.map((row) => (
                                        <div
                                            key={row._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                        >
                                            <div className='flex justify-between items-start mb-3'>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.status] || statusColors.Pending}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </div>
                                            <div className='flex items-start gap-2 mb-3'>
                                                <User className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                                                <div className='min-w-0'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                        {row.owner?.username ||
                                                            row.owner?.name ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {row.owner?.email ||
                                                            'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='mb-3'>
                                                <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                                                    {row.rewardBalance} pts (₹{' '}
                                                    {Math.round(
                                                        (row.rewardBalance ||
                                                            0) / 5,
                                                    )}
                                                    )
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                    UPI/Amount:{' '}
                                                    {row.amount ??
                                                        row.upiId ??
                                                        '-'}
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4'>
                                                <Calendar className='w-4 h-4' />
                                                {row.createdAt
                                                    ? new Date(
                                                          row.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
                                            </div>
                                            {String(
                                                row.status,
                                            ).toLowerCase() === 'pending' ? (
                                                <div className='flex gap-2'>
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                row._id,
                                                                'approved',
                                                            )
                                                        }
                                                        className='w-full px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm'
                                                    >
                                                        Approve
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
                                                        className='w-full px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm'
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='text-center text-gray-400 text-sm'>
                                                    —
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        User
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Points
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Upi Id
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Requested
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((row) => (
                                                    <tr
                                                        key={row._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {row.owner
                                                                    ?.username ||
                                                                    row.owner
                                                                        ?.name ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                {row.owner
                                                                    ?.email ||
                                                                    'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {row.rewardBalance}{' '}
                                                            (₹{' '}
                                                            {Math.round(
                                                                (row.rewardBalance ||
                                                                    0) / 5,
                                                            )}
                                                            )
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {row.amount ??
                                                                row.upiId ??
                                                                0}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.status] || statusColors.Pending}`}
                                                            >
                                                                {row.status}
                                                            </span>
                                                            {row.rejectionReason && (
                                                                <div className='mt-1 text-xs italic text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                                                                    Reason:{' '}
                                                                    {
                                                                        row.rejectionReason
                                                                    }
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {row.createdAt
                                                                ? new Date(
                                                                      row.createdAt,
                                                                  ).toLocaleString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                            {String(
                                                                row.status,
                                                            ).toLowerCase() ===
                                                            'pending' ? (
                                                                <div className='inline-flex gap-2'>
                                                                    <button
                                                                        onClick={() =>
                                                                            updateStatus(
                                                                                row._id,
                                                                                'approved',
                                                                            )
                                                                        }
                                                                        className='px-3 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:opacity-90'
                                                                    >
                                                                        Approve
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
                                                                        className='px-3 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:opacity-90'
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

                            {/* Pagination */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3'>
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
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-12'>
                            <Gift className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Redemption Requests Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
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
