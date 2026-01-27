import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
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

const statusClass = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'processing':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'cancelled':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

export default function OrderPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [orderType, setOrderType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
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

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await api.get(`/order`);
            setItems(res.data?.data);
        } catch (e) {
            console.error(e);
            const msg =
                e.response?.data?.message ||
                e.message ||
                'Failed to load orders';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const st = params.get('status') || '';
        const ot = params.get('orderType') || '';
        const pm = params.get('paymentMethod') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setStatus(st);
        setOrderType(ot);
        setPaymentMethod(pm);
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
        params.set('status', status || '');
        params.set('orderType', orderType || '');
        params.set('paymentMethod', paymentMethod || '');
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
        orderType,
        paymentMethod,
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

    const uniqueOrderTypes = useMemo(
        () =>
            Array.from(new Set(items.map((o) => o.orderType))).filter(Boolean),
        [items],
    );
    const uniquePaymentMethods = useMemo(
        () =>
            Array.from(new Set(items.map((o) => o.paymentMethod))).filter(
                Boolean,
            ),
        [items],
    );
    const uniqueStatuses = useMemo(
        () =>
            Array.from(
                new Set(items.map((o) => (o.status || '').toLowerCase())),
            ).filter(Boolean),
        [items],
    );

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = items.filter((o) => {
            const email = (o.user?.email || '').toLowerCase();
            const name = (o.user?.username || o.user?.name || '').toLowerCase();
            const id = (o._id || '').toLowerCase();
            const matchesSearch =
                !q || email.includes(q) || name.includes(q) || id.includes(q);
            const matchesStatus =
                !status || (o.status || '').toLowerCase() === status;
            const matchesOrderType = !orderType || o.orderType === orderType;
            const matchesMethod =
                !paymentMethod || o.paymentMethod === paymentMethod;
            const matchesTime = filterByTime(o, timeFilter);
            return (
                matchesSearch &&
                matchesStatus &&
                matchesOrderType &&
                matchesMethod &&
                matchesTime
            );
        });

        list.sort((a, b) => {
            let aVal = 0;
            let bVal = 0;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt || 0).getTime();
                bVal = new Date(b.createdAt || 0).getTime();
            } else if (sortBy === 'amount') {
                aVal = Number(a.amount || 0);
                bVal = Number(b.amount || 0);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return list;
    }, [
        items,
        search,
        status,
        orderType,
        paymentMethod,
        timeFilter,
        sortBy,
        sortOrder,
    ]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        return filteredAndSorted.reduce(
            (sum, o) => sum + (Number(o.amount) || 0),
            0,
        );
    }, [filteredAndSorted]);

    // total pages handled inside Pagination component

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
                    <BackButton title='Orders' TitleIcon={FileText} />

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
                                placeholder='Search by user email/name or order id'
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
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Types</option>
                                {uniqueOrderTypes.map((t) => (
                                    <option
                                        key={t}
                                        value={t}
                                        className='capitalize'
                                    >
                                        {t?.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Status</option>
                                {uniqueStatuses.map((s) => (
                                    <option
                                        key={s}
                                        value={s}
                                        className='capitalize'
                                    >
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={paymentMethod}
                                onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                }
                                className='px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-900 dark:text-white'
                            >
                                <option value=''>All Methods</option>
                                {uniquePaymentMethods.map((m) => (
                                    <option
                                        key={m}
                                        value={m}
                                        className='capitalize'
                                    >
                                        {m}
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

                            {(search ||
                                status ||
                                orderType ||
                                paymentMethod ||
                                timeFilter) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setStatus('');
                                        setOrderType('');
                                        setPaymentMethod('');
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
                                    {current.map((o) => {
                                        const amountLabel =
                                            o.paymentMethod === 'online'
                                                ? `₹ ${o.amount}`
                                                : `${o.amount} pts`;
                                        return (
                                            <div
                                                key={o._id}
                                                className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
                                            >
                                                <div className='flex justify-between items-start mb-2'>
                                                    <span
                                                        className={`px-1.5 py-0.5 text-xs rounded ${statusClass(o.status)}`}
                                                    >
                                                        {o.status}
                                                    </span>
                                                    <span className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                                        {o.orderType?.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className='mb-2'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                        {o.user?.username ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {o.user?.email || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className='mb-1'>
                                                    <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                        {amountLabel}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                                        {o.paymentMethod}
                                                    </div>
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                                                    {o.createdAt
                                                        ? new Date(
                                                              o.createdAt,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-400 dark:text-gray-500 truncate'>
                                                    {o._id}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                                        Order
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        User
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Type
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Method
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Amount
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Status
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                                                        Created
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((o) => {
                                                    const amountLabel =
                                                        o.paymentMethod ===
                                                        'online'
                                                            ? `₹ ${o.amount}`
                                                            : `${o.amount} pts`;
                                                    return (
                                                        <tr
                                                            key={o._id}
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-900'
                                                        >
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <div className='text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[120px]'>
                                                                    {o._id}
                                                                </div>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                    {o.user
                                                                        ?.username ||
                                                                        'N/A'}
                                                                </div>
                                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                                    {o.user
                                                                        ?.email ||
                                                                        'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span className='text-xs text-gray-600 dark:text-gray-400 capitalize'>
                                                                    {o.orderType?.replace(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap capitalize text-xs text-gray-600 dark:text-gray-400'>
                                                                {
                                                                    o.paymentMethod
                                                                }
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                                {amountLabel}
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap'>
                                                                <span
                                                                    className={`px-1.5 py-0.5 text-xs rounded ${statusClass(o.status)}`}
                                                                >
                                                                    {o.status}
                                                                </span>
                                                            </td>
                                                            <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400'>
                                                                {o.createdAt
                                                                    ? new Date(
                                                                          o.createdAt,
                                                                      ).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
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
                            <FileText className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-1'>
                                No Orders Found
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                No orders match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
