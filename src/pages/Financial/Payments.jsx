import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    CreditCard,
    Eye,
    Search,
    ArrowLeft,
    Loader,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    X,
    ChevronLeft,
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();
    const location = useLocation();

    const fetchPayments = async () => {
        try {
            setError(null);
            setLoading(true);
            // Fetch all payments - do client-side filtering and pagination
            const response = await api.get(`/payment`);
            setPayments(response?.data?.data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to load payments';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const fs = params.get('filterStatus') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
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
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper to get readable time filter label
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

    // Helper function to filter by time
    const filterByTime = (item, filter) => {
        if (!filter) return true;
        const itemDate = new Date(item.createdAt);
        const now = new Date();

        switch (filter) {
            case 'last24h': {
                const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return itemDate >= last24h;
            }
            case 'last7d': {
                const last7d = new Date(
                    now.getTime() - 7 * 24 * 60 * 60 * 1000,
                );
                return itemDate >= last7d;
            }
            case 'last28d': {
                const last28d = new Date(
                    now.getTime() - 28 * 24 * 60 * 60 * 1000,
                );
                return itemDate >= last28d;
            }
            case 'thisWeek': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return itemDate >= startOfWeek;
            }
            case 'thisMonth': {
                const startOfMonth = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                );
                return itemDate >= startOfMonth;
            }
            case 'thisYear': {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return itemDate >= startOfYear;
            }
            case 'all':
            default:
                return true;
        }
    };

    // Client-side filtering and sorting
    const filteredAndSortedPayments = useMemo(() => {
        let filtered = [...payments];

        // Search filter (email or user name)
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    (p.user?.email || '').toLowerCase().includes(searchLower) ||
                    (p.user?.name || '').toLowerCase().includes(searchLower),
            );
        }

        // Status filter
        if (filterStatus) {
            filtered = filtered.filter((p) => p.status === filterStatus);
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
    }, [payments, search, filterStatus, timeFilter, sortBy, sortOrder]);

    // Pagination
    const totalItems = filteredAndSortedPayments.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPayments = filteredAndSortedPayments.slice(
        startIndex,
        endIndex,
    );

    // Calculate total amount
    const totalAmount = useMemo(() => {
        return filteredAndSortedPayments.reduce(
            (sum, p) => sum + (Number(p.amount) || 0),
            0,
        );
    }, [filteredAndSortedPayments]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'captured':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div
                    className={`flex items-center justify-center py-12 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center gap-2'>
                        <Loader className='w-4 h-4 animate-spin text-gray-400' />
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                            Loading payments...
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
                className={`py-4 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6'>
                    {/* Compact Header */}
                    <div className='flex items-center gap-3 mb-4'>
                        <button
                            onClick={() => navigate('/reports')}
                            className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors'
                        >
                            <ChevronLeft className='w-4 h-4' />
                        </button>
                        <div className='flex items-center gap-2'>
                            <CreditCard className='w-4 h-4 text-gray-400' />
                            <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Payment History
                            </h1>
                        </div>
                    </div>

                    {/* Compact Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        {/* Total Amount - Compact */}
                        {timeFilter && (
                            <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Total ({getTimeFilterLabel(timeFilter)}):
                                </span>
                                <span className='font-semibold text-gray-900 dark:text-white'>
                                    ₹{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Search Bar - Compact */}
                        <div className='relative'>
                            <Search className='absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5' />
                            <input
                                type='text'
                                placeholder='Search by email or name...'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            />
                        </div>

                        {/* Filters Row - Compact */}
                        <div className='flex flex-wrap gap-2 items-center text-xs'>
                            {/* View Mode Toggle */}
                            <div className='flex bg-gray-100 dark:bg-gray-900 rounded p-0.5'>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                                    title='Grid view'
                                >
                                    <Grid3x3 className='w-3.5 h-3.5' />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                                    title='Table view'
                                >
                                    <List className='w-3.5 h-3.5' />
                                </button>
                            </div>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value)
                                }
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Statuses</option>
                                <option value='captured'>Captured</option>
                                <option value='pending'>Pending</option>
                                <option value='failed'>Failed</option>
                                <option value='refunded'>Refunded</option>
                            </select>

                            {/* Time filter */}
                            <select
                                value={timeFilter}
                                onChange={(e) => {
                                    setTimeFilter(e.target.value);
                                    setPage(1);
                                }}
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
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
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value='createdAt'>Sort by Date</option>
                                <option value='amount'>Sort by Amount</option>
                            </select>

                            {/* Sort Order */}
                            <button
                                onClick={() =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    )
                                }
                                className='p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
                                title={
                                    sortOrder === 'asc'
                                        ? 'Ascending'
                                        : 'Descending'
                                }
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className='w-3.5 h-3.5' />
                                ) : (
                                    <SortDesc className='w-3.5 h-3.5' />
                                )}
                            </button>

                            {/* Clear Filters */}
                            {(search || filterStatus || timeFilter) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterStatus('');
                                        setTimeFilter('');
                                        setPage(1);
                                    }}
                                    className='flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors'
                                >
                                    <X className='w-3 h-3' />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded text-sm mb-3'>
                            {error}
                        </div>
                    )}

                    {/* Payments Display */}
                    {currentPayments.length > 0 ? (
                        <>
                            {/* Compact Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3'>
                                    {currentPayments.map((payment) => (
                                        <div
                                            key={payment._id}
                                            className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer'
                                            onClick={() =>
                                                navigate(
                                                    `/reports/payments/${payment._id}`,
                                                )
                                            }
                                        >
                                            {/* Status and Provider */}
                                            <div className='flex justify-between items-start mb-2'>
                                                <span
                                                    className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(payment.status)}`}
                                                >
                                                    {payment.status}
                                                </span>
                                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                    {payment.provider || 'N/A'}
                                                </span>
                                            </div>

                                            {/* User Info */}
                                            <div className='mb-2'>
                                                <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                    {payment.user?.username ||
                                                        'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                    {payment.user?.email ||
                                                        'N/A'}
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
                                                {payment.currency || 'INR'}{' '}
                                                {payment.amount || 0}
                                            </div>

                                            {/* Date */}
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                {payment.createdAt
                                                    ? new Date(
                                                          payment.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
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
                                                        Provider
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Amount
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Status
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {currentPayments.map(
                                                    (payment) => (
                                                        <tr
                                                            key={payment._id}
                                                            onClick={() =>
                                                                navigate(
                                                                    `/reports/payments/${payment._id}`,
                                                                )
                                                            }
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-900'
                                                        >
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                    {payment
                                                                        .user
                                                                        ?.username ||
                                                                        'N/A'}
                                                                </div>
                                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                                    {payment
                                                                        .user
                                                                        ?.email ||
                                                                        'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span className='text-xs text-gray-600 dark:text-gray-400'>
                                                                    {payment.provider ||
                                                                        'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                                {payment.currency ||
                                                                    'INR'}{' '}
                                                                {payment.amount ||
                                                                    0}
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span
                                                                    className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(payment.status)}`}
                                                                >
                                                                    {
                                                                        payment.status
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                                {payment.createdAt
                                                                    ? new Date(
                                                                          payment.createdAt,
                                                                      ).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Compact Pagination */}
                            {totalItems > 0 && (
                                <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-2'>
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
                                </div>
                            )}
                        </>
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center py-12'>
                            <CreditCard className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                No Payments Found
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                No payments match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Payments;
