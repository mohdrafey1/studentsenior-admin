import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Loader, Search } from 'lucide-react';
import Pagination from '../components/Pagination';

const DashboardUsersPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/user/dashboard-users');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load dashboard users');
            toast.error('Failed to load dashboard users');
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
            const role = (u.role || '').toLowerCase();
            return (
                !q || email.includes(q) || name.includes(q) || role.includes(q)
            );
        });
    }, [items, search]);

    const start = (page - 1) * pageSize;
    const current = filtered.slice(start, start + pageSize);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading dashboard users...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-6 pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex items-center mb-8'>
                        <button
                            onClick={() => navigate('/reports')}
                            className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <div className='flex items-center'>
                            <div className='bg-rose-600 text-white p-3 rounded-lg mr-4'>
                                <Shield className='w-6 h-6' />
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                    Dashboard Users
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    Admins and moderators with dashboard access
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
                                    placeholder='Search by email, name or role'
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
                                            Role
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
                                                <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'>
                                                    {u.role || 'N/A'}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                {u.createdAt
                                                    ? new Date(
                                                          u.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
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
        </div>
    );
};

export default DashboardUsersPage;
