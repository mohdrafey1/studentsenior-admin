import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Users,
    ArrowLeft,
    Loader,
    Search,
    ShieldBan,
    ShieldCheck,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const UsersPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const updateItem = (id, partial) => {
        setItems((prev) =>
            prev.map((u) => (u._id === id ? { ...u, ...partial } : u)),
        );
    };

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'danger',
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleBlock = async (id) => {
        const ok = await showConfirm({
            title: 'Block User',
            message:
                'Are you sure you want to block this user? They will not be able to access their account.',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await api.patch(`/user/users/${id}/block`);
            updateItem(id, { blocked: true });
            toast.success('User blocked');
        } catch (e) {
            console.error(e);
            toast.error('Failed to block user');
        }
    };

    const handleUnblock = async (id) => {
        const ok = await showConfirm({
            title: 'Unblock User',
            message:
                'Unblock this user? They will regain access to their account.',
            variant: 'info',
        });
        if (!ok) return;
        try {
            await api.patch(`/user/users/${id}/unblock`);
            updateItem(id, { blocked: false });
            toast.success('User unblocked');
        } catch (e) {
            console.error(e);
            toast.error('Failed to unblock user');
        }
    };

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/user/users');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load users');
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((u) => {
            const email = (u.email || '').toLowerCase();
            const name = (u.username || u.name || '').toLowerCase();
            return !q || email.includes(q) || name.includes(q);
        });
    }, [items, search]);

    const start = (page - 1) * pageSize;
    const current = filtered.slice(start, start + pageSize);

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
                            Loading users...
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
                            <div className='bg-indigo-600 text-white p-3 rounded-lg mr-4'>
                                <Users className='w-6 h-6' />
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                    Users
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    All registered users
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='relative md:col-span-2'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by email or name'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>
                        </div>
                    </div>

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
                                            Name
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Email
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Status
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Total Earned
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Reward Balance
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Reward Redeemed
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                    {current.map((u) => (
                                        <tr
                                            key={u._id}
                                            className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.username || u.name || 'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.email || 'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                {u.blocked ? (
                                                    <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'>
                                                        <ShieldBan className='w-3 h-3 mr-1' />{' '}
                                                        Blocked
                                                    </span>
                                                ) : (
                                                    <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                                                        <ShieldCheck className='w-3 h-3 mr-1' />{' '}
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.rewardPoints || 0}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.rewardBalance || 0}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.rewardRedeemed || 0}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.createdAt
                                                    ? new Date(
                                                          u.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-right'>
                                                {u.blocked ? (
                                                    <button
                                                        onClick={() =>
                                                            handleUnblock(u._id)
                                                        }
                                                        className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700'
                                                    >
                                                        Unblock
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleBlock(u._id)
                                                        }
                                                        className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700'
                                                    >
                                                        Block
                                                    </button>
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
                </div>
            </main>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default UsersPage;
