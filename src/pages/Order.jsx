import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
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

const typeClass = (type) => {
    switch (type) {
        case 'pyq_purchase':
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
        case 'note_purchase':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'add_points':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | amount
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();

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

    // Responsive view mode - auto switch on resize
    useEffect(() => {
        const handleResize = () => {
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
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
            return (
                matchesSearch &&
                matchesStatus &&
                matchesOrderType &&
                matchesMethod
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
    }, [items, search, status, orderType, paymentMethod, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    // total pages handled inside Pagination component

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
                            Loading orders...
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
                    {/* Header */}
                    <div className='flex items-center mb-8'>
                        <button
                            onClick={() => navigate('/reports')}
                            className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <div className='flex items-center'>
                            <div className='bg-gray-800 text-white p-3 rounded-lg mr-4'>
                                <FileText className='w-6 h-6' />
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                    Orders
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    List of orders with filters and pagination
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
                                placeholder='Search by user email/name or order id'
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

                            {/* Filters */}
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
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
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
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
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
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

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
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
                                    {current.map((o) => {
                                        const amountLabel =
                                            o.paymentMethod === 'online'
                                                ? `₹ ${o.amount}`
                                                : `${o.amount} pts`;
                                        return (
                                            <div
                                                key={o._id}
                                                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                            >
                                                <div className='flex justify-between items-start mb-3'>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass(o.status)}`}
                                                    >
                                                        {o.status}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${typeClass(o.orderType)}`}
                                                    >
                                                        {o.orderType?.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className='flex items-start gap-2 mb-3'>
                                                    <User className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                                                    <div className='min-w-0'>
                                                        <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                            {o.user?.username ||
                                                                'N/A'}
                                                        </div>
                                                        <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                            {o.user?.email ||
                                                                'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='mb-3'>
                                                    <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                                                        {amountLabel}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                                        Method:{' '}
                                                        {o.paymentMethod}
                                                    </div>
                                                </div>
                                                <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                    <Calendar className='w-4 h-4' />
                                                    {o.createdAt
                                                        ? new Date(
                                                              o.createdAt,
                                                          ).toLocaleString()
                                                        : 'N/A'}
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400 break-all'>
                                                    Order: {o._id}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                                        Order
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        User
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Type
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Method
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Amount
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
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
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        >
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <div className='text-xs font-mono text-gray-700 dark:text-gray-300 break-all'>
                                                                    {o._id}
                                                                </div>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                    {o.user
                                                                        ?.username ||
                                                                        'N/A'}
                                                                </div>
                                                                <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                    {o.user
                                                                        ?.email ||
                                                                        'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${typeClass(o.orderType)}`}
                                                                >
                                                                    {o.orderType?.replace(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap capitalize text-sm text-gray-900 dark:text-white'>
                                                                {
                                                                    o.paymentMethod
                                                                }
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                                {amountLabel}
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass(o.status)}`}
                                                                >
                                                                    {o.status}
                                                                </span>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                                {o.createdAt
                                                                    ? new Date(
                                                                          o.createdAt,
                                                                      ).toLocaleString()
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
                            <FileText className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Orders Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No orders match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
