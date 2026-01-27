import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    BarChart3,
    Search,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    X,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';

const Transactions = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    // Filters
    const [type, setType] = useState(''); // credit | debit
    const [resourceType, setResourceType] = useState(''); // e.g., pyq, notes
    const [timeFilter, setTimeFilter] = useState(''); // last24h, last7d, last28d, thisWeek, thisMonth, thisYear, all
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | amount
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();
    const location = useLocation();

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/transactions/all');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load transactions');
            toast.error('Failed to load transactions');
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
        const t = params.get('type') || '';
        const rt = params.get('resourceType') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setType(t);
        setResourceType(rt);
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
        params.set('type', type || '');
        params.set('resourceType', resourceType || '');
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
        type,
        resourceType,
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

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = items.filter((t) => {
            const email = (t.user?.email || '').toLowerCase();
            const name = (t.user?.username || t.user?.name || '').toLowerCase();
            const matchesSearch = !q || email.includes(q) || name.includes(q);
            const matchesType = !type || (t.type || '').toLowerCase() === type;
            const matchesResType =
                !resourceType ||
                (t.resourceType || '').toLowerCase() === resourceType;
            const matchesTime = filterByTime(t, timeFilter);
            return (
                matchesSearch && matchesType && matchesResType && matchesTime
            );
        });

        // Sorting
        list.sort((a, b) => {
            let aVal = 0;
            let bVal = 0;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt || 0).getTime();
                bVal = new Date(b.createdAt || 0).getTime();
            } else if (sortBy === 'amount') {
                aVal = Number(a.points || 0);
                bVal = Number(b.points || 0);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return list;
    }, [items, search, type, resourceType, timeFilter, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        return filteredAndSorted.reduce(
            (sum, t) => sum + (Number(t.points) || 0),
            0,
        );
    }, [filteredAndSorted]);

    const uniqueTypes = useMemo(
        () =>
            Array.from(
                new Set(items.map((i) => (i.type || '').toLowerCase())),
            ).filter(Boolean),
        [items],
    );
    const uniqueResourceTypes = useMemo(
        () =>
            Array.from(
                new Set(items.map((i) => (i.resourceType || '').toLowerCase())),
            ).filter(Boolean),
        [items],
    );

    const typeBadge = (t) => {
        const v = (t || '').toLowerCase();
        if (v === 'credit')
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        if (v === 'debit')
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };
    const resTypeBadge = () =>
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';

    if (loading) {
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
                    {/* Compact Header */}
                    <BackButton title='Transactions' TitleIcon={BarChart3} />

                    {/* Compact Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        {/* Total Amount - Compact */}
                        {timeFilter && (
                            <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Total ({getTimeFilterLabel(timeFilter)}):
                                </span>
                                <span className='font-semibold text-gray-900 dark:text-white'>
                                    {totalAmount} pts
                                </span>
                            </div>
                        )}
                        {/* Search - Compact */}
                        <div className='relative'>
                            <Search className='absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5' />
                            <input
                                type='text'
                                placeholder='Search by user (email/name)'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            />
                        </div>

                        {/* Filters Row - Compact */}
                        <div className='flex flex-wrap gap-2 items-center text-xs'>
                            {/* View toggle */}
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

                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Types</option>
                                {uniqueTypes.map((t) => (
                                    <option
                                        key={t}
                                        value={t}
                                        className='capitalize'
                                    >
                                        {t}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={resourceType}
                                onChange={(e) =>
                                    setResourceType(e.target.value)
                                }
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Resources</option>
                                {uniqueResourceTypes.map((rt) => (
                                    <option
                                        key={rt}
                                        value={rt}
                                        className='capitalize'
                                    >
                                        {rt || '-'}
                                    </option>
                                ))}
                            </select>

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

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value='createdAt'>Sort by Date</option>
                                <option value='amount'>Sort by Amount</option>
                            </select>

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

                            {(search || type || resourceType || timeFilter) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setType('');
                                        setResourceType('');
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
                                    {current.map((t) => (
                                        <div
                                            key={t._id}
                                            className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
                                        >
                                            <div className='flex justify-between items-start gap-1 mb-2'>
                                                <span
                                                    className={`px-1.5 py-0.5 text-xs rounded ${typeBadge(t.type)}`}
                                                >
                                                    {t.type || 'N/A'}
                                                </span>
                                                <span
                                                    className={`px-1.5 py-0.5 text-xs rounded ${resTypeBadge(t.resourceType)}`}
                                                >
                                                    {t.resourceType || '-'}
                                                </span>
                                            </div>
                                            <div className='mb-2'>
                                                <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                    {t.user?.username ||
                                                        t.user?.name ||
                                                        'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                    {t.user?.email || 'N/A'}
                                                </div>
                                            </div>
                                            <div className='mb-1'>
                                                <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                    {t.points || 0} pts
                                                </div>
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                {t.createdAt
                                                    ? new Date(
                                                          t.createdAt,
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
                                                        Type
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Amount
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Resource
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((t) => (
                                                    <tr
                                                        key={t._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-900'
                                                    >
                                                        <td className='px-3 py-2 whitespace-nowrap'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {t.user
                                                                    ?.username ||
                                                                    t.user
                                                                        ?.name ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                                {t.user
                                                                    ?.email ||
                                                                    'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white capitalize'>
                                                            {t.type || 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {t.points || 0} pts
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                            {t.resourceType ||
                                                                '-'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                            {t.createdAt
                                                                ? new Date(
                                                                      t.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
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
                            <BarChart3 className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                No Transactions Found
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                No transactions match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Transactions;
