import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    User as UserIcon,
    Calendar,
    Clock,
    X,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const UsersPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [blockedFilter, setBlockedFilter] = useState(''); // '', 'true', 'false'
    const [timeFilter, setTimeFilter] = useState('');
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

    const getTimeFilterLabel = (filter) => {
        switch (filter) {
            case 'last24h':
                return 'Last 24 Hours';
            case 'last7d':
                return 'Last 7 Days';
            case 'last28d':
                return 'Last 28 Days';
            case 'thisWeek':
                return 'This Week';
            case 'thisMonth':
                return 'This Month';
            case 'thisYear':
                return 'This Year';
            default:
                return 'All Time';
        }
    };

    const filterByTime = (item, filter) => {
        if (!filter) return true;
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        switch (filter) {
            case 'last24h':
                return (
                    itemDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
                );
            case 'last7d':
                return (
                    itemDate >=
                    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                );
            case 'last28d':
                return (
                    itemDate >=
                    new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
                );
            case 'thisWeek': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return itemDate >= startOfWeek;
            }
            case 'thisMonth':
                return (
                    itemDate >= new Date(now.getFullYear(), now.getMonth(), 1)
                );
            case 'thisYear':
                return itemDate >= new Date(now.getFullYear(), 0, 1);
            default:
                return true;
        }
    };

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

    const totalPoints = useMemo(() => {
        return filteredAndSorted.reduce(
            (sum, u) => sum + (Number(u.wallet?.currentBalance) || 0),
            0,
        );
    }, [filteredAndSorted]);

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

                    {/* Search, View, Filters & Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        {/* Total Points Display */}
                        {timeFilter && (
                            <div className='mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <Clock className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                            Total Points (
                                            {getTimeFilterLabel(timeFilter)}):
                                        </span>
                                    </div>
                                    <span className='text-xl font-bold text-indigo-600 dark:text-indigo-400'>
                                        {totalPoints} points
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className='relative mb-4 max-w-xl'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by email or name'
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

                            {/* Blocked Filter */}
                            <select
                                value={blockedFilter}
                                onChange={(e) =>
                                    setBlockedFilter(e.target.value)
                                }
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Users</option>
                                <option value='true'>Blocked</option>
                                <option value='false'>Active</option>
                            </select>

                            {/* Time filter */}
                            <select
                                value={timeFilter}
                                onChange={(e) => {
                                    setTimeFilter(e.target.value);
                                    setPage(1);
                                }}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Time</option>
                                <option value='last24h'>Last 24 Hours</option>
                                <option value='last7d'>Last 7 Days</option>
                                <option value='last28d'>Last 28 Days</option>
                                <option value='thisWeek'>This Week</option>
                                <option value='thisMonth'>This Month</option>
                                <option value='thisYear'>This Year</option>
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

                            {/* Clear Filters */}
                            {(search || blockedFilter || timeFilter) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setBlockedFilter('');
                                        setTimeFilter('');
                                        setPage(1);
                                    }}
                                    className='flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium'
                                >
                                    <X className='w-4 h-4' />
                                    Clear Filters
                                </button>
                            )}
                        </div>
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
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6'>
                                    {current.map((u) => (
                                        <div
                                            key={u._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer'
                                            onClick={() =>
                                                navigate(`/users/${u._id}`)
                                            }
                                        >
                                            <div className='flex justify-between items-start mb-3'>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${u.blocked ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
                                                >
                                                    {u.blocked
                                                        ? 'Blocked'
                                                        : 'Active'}
                                                </span>
                                            </div>
                                            <div className='flex items-start gap-2 mb-3'>
                                                <UserIcon className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                                                <div className='min-w-0'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                        {u.username ||
                                                            u.name ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {u.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='mb-3 space-y-1'>
                                                <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                    Total Earned:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.totalEarning || 0}
                                                    </span>
                                                </div>
                                                <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                    Reward Balance:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.currentBalance ||
                                                            0}
                                                    </span>
                                                </div>
                                                <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                    Reward Redeemed:{' '}
                                                    <span className='font-semibold'>
                                                        {u.wallet
                                                            ?.totalWithdrawal ||
                                                            0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4'>
                                                <Calendar className='w-4 h-4' />
                                                {u.createdAt
                                                    ? new Date(
                                                          u.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
                                            </div>
                                            <div className='flex gap-2'>
                                                {u.blocked ? (
                                                    <button
                                                        onClick={() =>
                                                            handleUnblock(u._id)
                                                        }
                                                        className='w-full px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm'
                                                    >
                                                        Unblock
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleBlock(u._id)
                                                        }
                                                        className='w-full px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm'
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                            </div>
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
                                                        Current Balance
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Total Redeemed
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-6 py-3'></th>
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
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {u.username ||
                                                                u.name ||
                                                                'N/A'}
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
                                                            {u.wallet
                                                                ?.totalEarning ||
                                                                0}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {u.wallet
                                                                ?.currentBalance ||
                                                                0}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {u.wallet
                                                                ?.totalWithdrawal ||
                                                                0}
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
                                                                        handleUnblock(
                                                                            u._id,
                                                                        )
                                                                    }
                                                                    className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700'
                                                                >
                                                                    Unblock
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        handleBlock(
                                                                            u._id,
                                                                        )
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
