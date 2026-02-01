import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    Diamond,
    TrendingUp,
    TrendingDown,
    Gift,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
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

    const fetchSubscriptions = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.get('/subscription');
            setSubscriptions(response?.data?.data || []);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to load subscriptions';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const response = await api.get('/subscription/analytics');
            setAnalytics(response?.data?.data || null);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        fetchAnalytics();
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
        setSortBy(sb);
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

    // Responsive view mode
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Client-side filtering and sorting
    const filteredAndSortedSubscriptions = useMemo(() => {
        let filtered = [...subscriptions];

        // Search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    (s.client?.email || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (s.client?.username || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (s.productId || '').toLowerCase().includes(searchLower),
            );
        }

        // Status filter
        if (filterStatus) {
            filtered = filtered.filter((s) => s.status === filterStatus);
        }

        // Time filter
        filtered = filtered.filter((s) => filterByTime(s, timeFilter));

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            } else if (sortBy === 'expiryDate') {
                aVal = new Date(a.expiryDate).getTime();
                bVal = new Date(b.expiryDate).getTime();
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [subscriptions, search, filterStatus, timeFilter, sortBy, sortOrder]);

    // Pagination
    const totalItems = filteredAndSortedSubscriptions.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentSubscriptions = filteredAndSortedSubscriptions.slice(
        startIndex,
        endIndex,
    );

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'trial':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'expired':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle className='w-3.5 h-3.5' />;
            case 'trial':
                return <Gift className='w-3.5 h-3.5' />;
            case 'expired':
                return <Clock className='w-3.5 h-3.5' />;
            case 'cancelled':
                return <XCircle className='w-3.5 h-3.5' />;
            default:
                return <AlertCircle className='w-3.5 h-3.5' />;
        }
    };

    if (loading && analyticsLoading) {
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
                    {/* Header */}
                    <BackButton title='Subscriptions' TitleIcon={Diamond} />

                    {/* Analytics Cards */}
                    {analytics && (
                        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4'>
                            {/* Active */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-green-100 dark:bg-green-900/50'>
                                        <CheckCircle className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Active
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.overview?.activeSubscriptions ||
                                        0}
                                </p>
                            </div>

                            {/* Trials */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-blue-100 dark:bg-blue-900/50'>
                                        <Gift className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Trials
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.trials?.total || 0}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {analytics.trials?.today || 0} today
                                </p>
                            </div>

                            {/* Premium Users */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-amber-100 dark:bg-amber-900/50'>
                                        <Diamond className='w-3.5 h-3.5 text-amber-600 dark:text-amber-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Premium
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.overview?.premiumUsers || 0}
                                </p>
                            </div>

                            {/* Conversion Rate */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/50'>
                                        <TrendingUp className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Conversion
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.metrics?.conversionRate || 0}%
                                </p>
                            </div>

                            {/* Churn Rate */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-red-100 dark:bg-red-900/50'>
                                        <TrendingDown className='w-3.5 h-3.5 text-red-600 dark:text-red-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Churn
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.metrics?.churnRate || 0}%
                                </p>
                            </div>

                            {/* Expired */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-gray-100 dark:bg-gray-700'>
                                        <Clock className='w-3.5 h-3.5 text-gray-600 dark:text-gray-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Expired
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.overview?.expiredSubscriptions ||
                                        0}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3'>
                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            filters={[
                                {
                                    label: 'Status',
                                    value: filterStatus,
                                    onChange: setFilterStatus,
                                    options: [
                                        { value: '', label: 'All Statuses' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'trial', label: 'Trial' },
                                        { value: 'expired', label: 'Expired' },
                                        {
                                            value: 'cancelled',
                                            label: 'Cancelled',
                                        },
                                        { value: 'pending', label: 'Pending' },
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
                                        value: 'expiryDate',
                                        label: 'Sort by Expiry',
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
                                setFilterStatus('');
                                setTimeFilter('');
                                setPage(1);
                            }}
                            showClear={!!(search || filterStatus || timeFilter)}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded text-sm mb-3'>
                            {error}
                        </div>
                    )}

                    {/* Subscriptions Display */}
                    {currentSubscriptions.length > 0 ? (
                        <>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3'>
                                    {currentSubscriptions.map(
                                        (subscription) => (
                                            <div
                                                key={subscription._id}
                                                className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
                                            >
                                                {/* Status and Product */}
                                                <div className='flex justify-between items-start mb-2'>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${getStatusColor(subscription.status)}`}
                                                    >
                                                        {getStatusIcon(
                                                            subscription.status,
                                                        )}
                                                        {subscription.status}
                                                    </span>
                                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                        {subscription.productId ||
                                                            'N/A'}
                                                    </span>
                                                </div>

                                                {/* User Info */}
                                                <div className='mb-2'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                        {subscription.client
                                                            ?.username || 'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {subscription.client
                                                            ?.email || 'N/A'}
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className='text-xs text-gray-500 dark:text-gray-400 space-y-0.5'>
                                                    <div className='flex justify-between'>
                                                        <span>Started:</span>
                                                        <span>
                                                            {subscription.startDate
                                                                ? new Date(
                                                                      subscription.startDate,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between'>
                                                        <span>Expires:</span>
                                                        <span>
                                                            {subscription.expiryDate
                                                                ? new Date(
                                                                      subscription.expiryDate,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}

                            {/* Table View */}
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
                                                        Product
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Status
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Start Date
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Expiry Date
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Platform
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {currentSubscriptions.map(
                                                    (subscription) => (
                                                        <tr
                                                            key={
                                                                subscription._id
                                                            }
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-900'
                                                        >
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                    {subscription
                                                                        .client
                                                                        ?.username ||
                                                                        'N/A'}
                                                                </div>
                                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                                    {subscription
                                                                        .client
                                                                        ?.email ||
                                                                        'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span className='text-xs text-gray-600 dark:text-gray-400'>
                                                                    {subscription.productId ||
                                                                        'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span
                                                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${getStatusColor(subscription.status)}`}
                                                                >
                                                                    {getStatusIcon(
                                                                        subscription.status,
                                                                    )}
                                                                    {
                                                                        subscription.status
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                                {subscription.startDate
                                                                    ? new Date(
                                                                          subscription.startDate,
                                                                      ).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                                {subscription.expiryDate
                                                                    ? new Date(
                                                                          subscription.expiryDate,
                                                                      ).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                                {subscription.platform ||
                                                                    'N/A'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
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
                            <Diamond className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                No Subscriptions Found
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                No subscriptions match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Subscriptions;
