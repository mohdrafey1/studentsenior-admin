import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    ShoppingCart,
    FileText,
    BookOpen,
    TrendingUp,
    IndianRupee,
    Users,
    Calendar,
    CheckCircle,
    Package,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';

const ContentPurchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTier, setFilterTier] = useState('');
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

    const fetchPurchases = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.get('/content-purchases');
            setPurchases(response?.data?.data || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to load purchases';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const response = await api.get('/content-purchases/analytics');
            setAnalytics(response?.data?.data || null);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchAnalytics();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const ft = params.get('filterType') || '';
        const fti = params.get('filterTier') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterType(ft);
        setFilterTier(fti);
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
        params.set('filterType', filterType || '');
        params.set('filterTier', filterTier || '');
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
        filterType,
        filterTier,
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
    const filteredAndSortedPurchases = useMemo(() => {
        let filtered = [...purchases];

        // Search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    (p.user?.email || '').toLowerCase().includes(searchLower) ||
                    (p.user?.username || '')
                        .toLowerCase()
                        .includes(searchLower) ||
                    (p.metadata?.resourceTitle || '')
                        .toLowerCase()
                        .includes(searchLower),
            );
        }

        // Type filter
        if (filterType) {
            filtered = filtered.filter((p) => p.orderType === filterType);
        }

        // Tier filter
        if (filterTier) {
            filtered = filtered.filter(
                (p) => p.metadata?.productId === filterTier,
            );
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
    }, [
        purchases,
        search,
        filterType,
        filterTier,
        timeFilter,
        sortBy,
        sortOrder,
    ]);

    // Pagination
    const totalItems = filteredAndSortedPurchases.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPurchases = filteredAndSortedPurchases.slice(
        startIndex,
        endIndex,
    );

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const getTypeIcon = (orderType) => {
        return orderType === 'pyq_purchase' ? (
            <FileText className='w-4 h-4 text-blue-600' />
        ) : (
            <BookOpen className='w-4 h-4 text-green-600' />
        );
    };

    const getTypeLabel = (orderType) => {
        return orderType === 'pyq_purchase' ? 'PYQ' : 'Note';
    };

    const getTypeColor = (orderType) => {
        return orderType === 'pyq_purchase'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    <BackButton
                        title='Content Purchases (IAP)'
                        TitleIcon={ShoppingCart}
                    />

                    {/* Analytics Cards */}
                    {analytics && (
                        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4'>
                            {/* Total Revenue */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-green-100 dark:bg-green-900/50'>
                                        <IndianRupee className='w-3.5 h-3.5 text-green-600 dark:text-green-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Total Revenue
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    ₹{analytics.overview?.totalRevenue || 0}
                                </p>
                            </div>

                            {/* Total Purchases */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-blue-100 dark:bg-blue-900/50'>
                                        <ShoppingCart className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Purchases
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.overview?.totalPurchases || 0}
                                </p>
                            </div>

                            {/* Unique Buyers */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-purple-100 dark:bg-purple-900/50'>
                                        <Users className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Buyers
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.overview?.uniqueBuyers || 0}
                                </p>
                            </div>

                            {/* Today's Revenue */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-amber-100 dark:bg-amber-900/50'>
                                        <Calendar className='w-3.5 h-3.5 text-amber-600 dark:text-amber-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Today
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    ₹{analytics.today?.revenue || 0}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {analytics.today?.purchases || 0} purchases
                                </p>
                            </div>

                            {/* PYQ Purchases */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-cyan-100 dark:bg-cyan-900/50'>
                                        <FileText className='w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        PYQs
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.byContentType?.pyqs?.count || 0}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    ₹
                                    {analytics.byContentType?.pyqs?.revenue ||
                                        0}
                                </p>
                            </div>

                            {/* Note Purchases */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <div className='p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/50'>
                                        <BookOpen className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        Notes
                                    </span>
                                </div>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    {analytics.byContentType?.notes?.count || 0}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    ₹
                                    {analytics.byContentType?.notes?.revenue ||
                                        0}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tier Breakdown */}
                    {analytics?.byTier && analytics.byTier.length > 0 && (
                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-4'>
                            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                                Revenue by Tier
                            </h3>
                            <div className='flex flex-wrap gap-3'>
                                {analytics.byTier.map((tier) => (
                                    <div
                                        key={tier.productId}
                                        className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded'
                                    >
                                        <Package className='w-4 h-4 text-gray-500' />
                                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                            ₹{tier.price}
                                        </span>
                                        <span className='text-xs text-gray-500'>
                                            {tier.count} purchases
                                        </span>
                                        <span className='text-xs font-semibold text-green-600'>
                                            ₹{tier.revenue}
                                        </span>
                                    </div>
                                ))}
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
                                    label: 'Type',
                                    value: filterType,
                                    onChange: setFilterType,
                                    options: [
                                        { value: '', label: 'All Types' },
                                        {
                                            value: 'pyq_purchase',
                                            label: 'PYQs',
                                        },
                                        {
                                            value: 'note_purchase',
                                            label: 'Notes',
                                        },
                                    ],
                                },
                                {
                                    label: 'Tier',
                                    value: filterTier,
                                    onChange: setFilterTier,
                                    options: [
                                        { value: '', label: 'All Tiers' },
                                        {
                                            value: 'content_tier_5',
                                            label: '₹5',
                                        },
                                        {
                                            value: 'content_tier_10',
                                            label: '₹10',
                                        },
                                        {
                                            value: 'content_tier_20',
                                            label: '₹20',
                                        },
                                        {
                                            value: 'content_tier_50',
                                            label: '₹50',
                                        },
                                        {
                                            value: 'content_tier_99',
                                            label: '₹99',
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
                                        value: 'amount',
                                        label: 'Sort by Amount',
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
                                onToggle: () =>
                                    setViewMode(
                                        viewMode === 'grid' ? 'table' : 'grid',
                                    ),
                            }}
                        />
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-4'>
                            <p className='text-red-600 dark:text-red-400'>
                                {error}
                            </p>
                            <button
                                onClick={fetchPurchases}
                                className='mt-2 text-sm text-red-700 dark:text-red-300 underline'
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && currentPurchases.length === 0 && (
                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-8 text-center'>
                            <ShoppingCart className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
                                No purchases found
                            </h3>
                            <p className='text-gray-500 dark:text-gray-400'>
                                {search ||
                                filterType ||
                                filterTier ||
                                timeFilter
                                    ? 'Try adjusting your filters'
                                    : 'Content purchases will appear here'}
                            </p>
                        </div>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && currentPurchases.length > 0 && (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'>
                            {currentPurchases.map((purchase) => (
                                <div
                                    key={purchase._id}
                                    className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3'
                                >
                                    <div className='flex items-start justify-between mb-2'>
                                        <div className='flex items-center gap-2'>
                                            {getTypeIcon(purchase.orderType)}
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(purchase.orderType)}`}
                                            >
                                                {getTypeLabel(
                                                    purchase.orderType,
                                                )}
                                            </span>
                                        </div>
                                        <span className='text-lg font-bold text-green-600'>
                                            ₹{purchase.amount}
                                        </span>
                                    </div>

                                    <h4 className='text-sm font-medium text-gray-900 dark:text-white truncate mb-1'>
                                        {purchase.metadata?.resourceTitle ||
                                            'Unknown'}
                                    </h4>

                                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                        <img
                                            src={
                                                purchase.user?.profilePicture ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(purchase.user?.username || 'U')}&background=random`
                                            }
                                            alt=''
                                            className='w-5 h-5 rounded-full'
                                        />
                                        <span className='truncate'>
                                            {purchase.user?.username ||
                                                purchase.user?.email ||
                                                'Unknown'}
                                        </span>
                                    </div>

                                    <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                                        <span>
                                            {formatDate(purchase.createdAt)}
                                        </span>
                                        <span className='flex items-center gap-1'>
                                            <CheckCircle className='w-3 h-3 text-green-500' />
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && currentPurchases.length > 0 && (
                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='w-full'>
                                    <thead className='bg-gray-50 dark:bg-gray-700'>
                                        <tr>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                Content
                                            </th>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                Type
                                            </th>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                User
                                            </th>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                Amount
                                            </th>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                Date
                                            </th>
                                            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                                        {currentPurchases.map((purchase) => (
                                            <tr
                                                key={purchase._id}
                                                className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            >
                                                <td className='px-4 py-3'>
                                                    <div className='flex items-center gap-2'>
                                                        {getTypeIcon(
                                                            purchase.orderType,
                                                        )}
                                                        <span className='text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]'>
                                                            {purchase.metadata
                                                                ?.resourceTitle ||
                                                                'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(purchase.orderType)}`}
                                                    >
                                                        {getTypeLabel(
                                                            purchase.orderType,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <div className='flex items-center gap-2'>
                                                        <img
                                                            src={
                                                                purchase.user
                                                                    ?.profilePicture ||
                                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(purchase.user?.username || 'U')}&background=random`
                                                            }
                                                            alt=''
                                                            className='w-6 h-6 rounded-full'
                                                        />
                                                        <div>
                                                            <p className='text-sm text-gray-900 dark:text-white'>
                                                                {purchase.user
                                                                    ?.username ||
                                                                    'Unknown'}
                                                            </p>
                                                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                                {
                                                                    purchase
                                                                        .user
                                                                        ?.email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <span className='text-sm font-semibold text-green-600'>
                                                        ₹{purchase.amount}
                                                    </span>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                                        {formatDate(
                                                            purchase.createdAt,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <span className='flex items-center gap-1 text-xs text-green-600'>
                                                        <CheckCircle className='w-3.5 h-3.5' />
                                                        Completed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalItems > pageSize && (
                        <div className='mt-4'>
                            <Pagination
                                currentPage={page}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ContentPurchases;
