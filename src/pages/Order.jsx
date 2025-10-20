import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, Loader, Search } from 'lucide-react';
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
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
            });
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (orderType) params.set('orderType', orderType);
            if (paymentMethod) params.set('paymentMethod', paymentMethod);

            const res = await api.get(`/order?${params.toString()}`);
            const data = res.data?.data;
            setItems(data?.orders || []);
            setTotal(data?.pagination?.totalItems || 0);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const applyFilters = () => {
        setPage(1);
        fetchOrders();
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setOrderType('');
        setPaymentMethod('');
        setPage(1);
        fetchOrders();
    };

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

                    {/* Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                            <div className='relative md:col-span-2'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by user email/name'
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
                                <option value='processing'>Processing</option>
                                <option value='completed'>Completed</option>
                                <option value='failed'>Failed</option>
                                <option value='cancelled'>Cancelled</option>
                            </select>
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            >
                                <option value=''>All Types</option>
                                <option value='pyq_purchase'>
                                    PYQ Purchase
                                </option>
                                <option value='note_purchase'>
                                    Note Purchase
                                </option>
                                <option value='add_points'>Add Points</option>
                            </select>
                            <select
                                value={paymentMethod}
                                onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                }
                                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            >
                                <option value=''>All Methods</option>
                                <option value='online'>Online</option>
                                <option value='points'>Points</option>
                            </select>
                        </div>
                        <div className='mt-4 flex gap-2'>
                            <button
                                onClick={applyFilters}
                                className='px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700'
                            >
                                Apply
                            </button>
                            <button
                                onClick={resetFilters}
                                className='px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            >
                                Reset
                            </button>
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
                                    {items.map((o) => {
                                        const amountLabel =
                                            o.paymentMethod === 'online'
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
                                                        {o.user?.username ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {o.user?.email || 'N/A'}
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
                                                    {o.paymentMethod}
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
                        <div className='px-4 py-3 border-t border-gray-200 dark:border-gray-700'>
                            <Pagination
                                currentPage={page}
                                pageSize={pageSize}
                                totalItems={total}
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
        </div>
    );
}
