import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Shield, User as UserIcon, Calendar } from 'lucide-react';
import FilterBar from '../../components/Common/FilterBar';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Common/Loader';
import BackButton from '../../components/Common/BackButton';

const DashboardUsersPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialRoleFilter = params.get('role') || '';
    const initialTimeFilter = params.get('time') || 'all';
    const initialPage = parseInt(params.get('page')) || 1;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [roleFilter, setRoleFilter] = useState(initialRoleFilter); // filter by role only
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter); // time filter
    const [sortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const { mainContentMargin } = useSidebarLayout();

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

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        if (timeFilter) params.set('time', timeFilter);
        if (page > 1) params.set('page', page.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [search, roleFilter, timeFilter, page, navigate]);

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
                const role = (u.role || '').toLowerCase();
                const matchesSearch =
                    !q ||
                    email.includes(q) ||
                    name.includes(q) ||
                    role.includes(q);
                const matchesRole =
                    !roleFilter || role === roleFilter.toLowerCase();
                const matchesTime = filterByTime(u, timeFilter);
                return matchesSearch && matchesRole && matchesTime;
            })
            .sort((a, b) => {
                let aVal = 0;
                let bVal = 0;
                if (sortBy === 'createdAt') {
                    aVal = new Date(a.createdAt || 0).getTime();
                    bVal = new Date(b.createdAt || 0).getTime();
                }
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
        return list;
    }, [items, search, roleFilter, timeFilter, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    const totalUsers = timeFilter ? filteredAndSorted.length : 0;

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setTimeFilter('all');
        setPage(1);
    };

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
                    <BackButton title='Dashboard Users' TitleIcon={Shield} />

                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalUsers}
                            </span>
                        </div>

                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            filters={[
                                {
                                    label: 'Role',
                                    value: roleFilter,
                                    onChange: setRoleFilter,
                                    options: [
                                        { value: '', label: 'All Roles' },
                                        { value: 'admin', label: 'Admin' },
                                        {
                                            value: 'moderator',
                                            label: 'Moderator',
                                        },
                                        { value: 'viewer', label: 'Viewer' },
                                    ],
                                },
                            ]}
                            timeFilter={{
                                value: timeFilter,
                                onChange: setTimeFilter,
                            }}
                            sortBy={null}
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
                            onClear={clearFilters}
                            showClear={
                                !!(
                                    search ||
                                    roleFilter ||
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
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6'>
                                    {current.map((u) => (
                                        <div
                                            key={u._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                        >
                                            <div className='flex justify-between items-start mb-3'>
                                                <span className='px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'>
                                                    {u.role || 'N/A'}
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
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                                                <Calendar className='w-4 h-4' />
                                                {u.createdAt
                                                    ? new Date(
                                                          u.createdAt,
                                                      ).toLocaleString()
                                                    : 'N/A'}
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
                                                            {u.username ||
                                                                u.name ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {u.email || 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                            <span className='inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'>
                                                                {u.role ||
                                                                    'N/A'}
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
                            <Shield className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Dashboard Users Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No users match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DashboardUsersPage;
