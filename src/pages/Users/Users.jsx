import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    Users,
    ShieldBan,
    ShieldCheck,
    User as UserIcon,
    Calendar,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';

const UsersPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [blockedFilter, setBlockedFilter] = useState(''); // '', 'true', 'false'
    const [timeFilter, setTimeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'points'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();
    const location = useLocation();

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

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const bf = params.get('blockedFilter') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setBlockedFilter(bf);
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
        params.set('blockedFilter', blockedFilter || '');
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
        blockedFilter,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Responsive auto-switch for view mode
    useEffect(() => {
        const handleResize = () =>
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = items
            .filter((u) => {
                const email = (u.email || '').toLowerCase();
                const name = (u.username || u.name || '').toLowerCase();
                const matchesSearch =
                    !q || email.includes(q) || name.includes(q);
                const matchesBlocked =
                    blockedFilter === ''
                        ? true
                        : String(!!u.blocked) === blockedFilter;
                const matchesTime = filterByTime(u, timeFilter);
                return matchesSearch && matchesBlocked && matchesTime;
            })
            .sort((a, b) => {
                let aVal = 0;
                let bVal = 0;
                if (sortBy === 'createdAt') {
                    aVal = new Date(a.createdAt || 0).getTime();
                    bVal = new Date(b.createdAt || 0).getTime();
                } else if (sortBy === 'points') {
                    // Use currentBalance as the 'points' metric
                    aVal = Number(a.wallet?.currentBalance || 0);
                    bVal = Number(b.wallet?.currentBalance || 0);
                }
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
        return list;
    }, [items, search, blockedFilter, timeFilter, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    const totalUsers = timeFilter ? filteredAndSorted.length : 0;

    if (loading) {
        return <Loader />;
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main
                className={`pt-6 pb-12 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <BackButton title='Users' TitleIcon={UserIcon} />

                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalUsers}
                            </span>
                        </div>

                        {/* Search, View, Filters & Sort */}
                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            filters={[
                                {
                                    label: 'Status',
                                    value: blockedFilter,
                                    onChange: setBlockedFilter,
                                    options: [
                                        { value: '', label: 'All Users' },
                                        { value: 'true', label: 'Blocked' },
                                        { value: 'false', label: 'Active' },
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
                                setBlockedFilter('');
                                setTimeFilter('all');
                                setPage(1);
                            }}
                            showClear={
                                !!(
                                    search ||
                                    blockedFilter ||
                                    (timeFilter && timeFilter !== 'all')
                                )
                            }
                        />
                    </div>

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
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4'>
                                    {current.map((u) => (
                                        <div
                                            key={u._id}
                                            className='bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-2 hover:shadow-md transition-shadow cursor-pointer text-xs'
                                            onClick={() =>
                                                navigate(`/users/${u._id}`)
                                            }
                                        >
                                            <div className='flex justify-between items-center mb-1'>
                                                <span
                                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${u.blocked ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
                                                >
                                                    {u.blocked
                                                        ? 'Blocked'
                                                        : 'Active'}
                                                </span>
                                            </div>
                                            <div className='flex items-start gap-1 mb-1'>
                                                <UserIcon className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                                                <div className='min-w-0'>
                                                    <div className='font-medium text-gray-900 dark:text-white truncate'>
                                                        {u.username ||
                                                            u.name ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-gray-500 dark:text-gray-400 truncate'>
                                                        {u.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='mb-1'>
                                                <span className='text-gray-700 dark:text-gray-300'>
                                                    Earned:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.totalEarning || 0}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className='mb-1'>
                                                <span className='text-gray-700 dark:text-gray-300'>
                                                    Balance:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.currentBalance ||
                                                            0}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className='mb-1'>
                                                <span className='text-gray-700 dark:text-gray-300'>
                                                    Redeemed:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.totalWithdrawal ||
                                                            0}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-2'>
                                                <Calendar className='w-3.5 h-3.5' />
                                                {u.createdAt
                                                    ? new Date(
                                                          u.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
                                            </div>
                                            <div className='flex gap-1'>
                                                {u.blocked ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnblock(
                                                                u._id,
                                                            );
                                                        }}
                                                        className='p-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs flex-1 flex items-center justify-center'
                                                        title='Unblock'
                                                    >
                                                        <ShieldCheck className='w-3 h-3' />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBlock(u._id);
                                                        }}
                                                        className='p-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs flex-1 flex items-center justify-center'
                                                        title='Block'
                                                    >
                                                        <ShieldBan className='w-3 h-3' />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Name
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Email
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Earned
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Balance
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Redeemed
                                                    </th>
                                                    <th className='px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-3 py-2'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((u) => (
                                                    <tr
                                                        key={u._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                                        onClick={() =>
                                                            navigate(
                                                                `/users/${u._id}`,
                                                            )
                                                        }
                                                    >
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white max-w-[120px] truncate'>
                                                            {u.username ||
                                                                u.name ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white max-w-[160px] truncate'>
                                                            {u.email || 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap'>
                                                            {u.blocked ? (
                                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'>
                                                                    <ShieldBan className='w-3 h-3 mr-1' />
                                                                    Blocked
                                                                </span>
                                                            ) : (
                                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                                                                    <ShieldCheck className='w-3 h-3 mr-1' />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white'>
                                                            {u.wallet
                                                                ?.totalEarning ||
                                                                0}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white'>
                                                            {u.wallet
                                                                ?.currentBalance ||
                                                                0}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white'>
                                                            {u.wallet
                                                                ?.totalWithdrawal ||
                                                                0}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white'>
                                                            {u.createdAt
                                                                ? new Date(
                                                                      u.createdAt,
                                                                  ).toLocaleString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-right'>
                                                            {u.blocked ? (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleUnblock(
                                                                            u._id,
                                                                        );
                                                                    }}
                                                                    className='p-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs'
                                                                    title='Unblock'
                                                                >
                                                                    <ShieldCheck className='w-3 h-3' />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleBlock(
                                                                            u._id,
                                                                        );
                                                                    }}
                                                                    className='p-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs'
                                                                    title='Block'
                                                                >
                                                                    <ShieldBan className='w-3 h-3' />
                                                                </button>
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
                            <Users className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Users Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No users match your current filters.
                            </p>
                        </div>
                    )}
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
