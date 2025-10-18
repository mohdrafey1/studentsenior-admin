import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Gift, ArrowLeft, Loader, Search } from 'lucide-react';
import Pagination from '../components/Pagination';

const statusColors = {
    Pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const Redemptions = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((it) => {
            const user = it.owner || it.user; // backend populates 'owner'
            const email = (user?.email || '').toLowerCase();
            const name = (user?.username || user?.name || '').toLowerCase();
            const matchesSearch = !q || email.includes(q) || name.includes(q);
            const matchesStatus =
                !status ||
                (it.status || '').toLowerCase() === status.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [items, search, status]);

    const start = (page - 1) * pageSize;
    const current = filtered.slice(start, start + pageSize);

    const updateStatus = async (id, newStatus, reason = '') => {
        try {
            if (newStatus.toLowerCase() === 'rejected' && !reason.trim()) {
                toast.error('Please provide a rejection reason');
                return;
            }
            const payload = { status: capitalizeStatus(newStatus) };
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
                              status: capitalizeStatus(newStatus),
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

    const capitalizeStatus = (s) => {
        const v = (s || '').toLowerCase();
        if (v === 'pending') return 'Pending';
        if (v === 'approved') return 'Approved';
        if (v === 'rejected') return 'Rejected';
        return s;
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

                    {/* Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='relative'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by user (email/name)'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            >
                                <option value=''>All Status</option>
                                <option value='pending'>Pending</option>
                                <option value='approved'>Approved</option>
                                <option value='rejected'>Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Table */}
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
                                                    {row.owner?.username ||
                                                        row.owner?.name ||
                                                        'N/A'}
                                                </div>
                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {row.owner?.email || 'N/A'}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {row.rewardBalance} (₹
                                                {row.rewardBalance / 5})
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {row.amount ?? row.upiId ?? 0}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        statusColors[
                                                            row.status
                                                        ] ||
                                                        statusColors.Pending
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                                {row.rejectionReason && (
                                                    <div className='mt-1 text-xs italic text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                                                        Reason:{' '}
                                                        {row.rejectionReason}
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
                                                {(
                                                    row.status || ''
                                                ).toLowerCase() ===
                                                'pending' ? (
                                                    <div className='inline-flex gap-2'>
                                                        <button
                                                            onClick={() =>
                                                                updateStatus(
                                                                    row._id,
                                                                    'Approved',
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
                        <div className='px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                            <Pagination
                                currentPage={page}
                                pageSize={pageSize}
                                totalItems={filtered.length}
                                onPageChange={setPage}
                                onPageSizeChange={(s) => {
                                    setPageSize(s);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
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
                                                'Rejected',
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
