import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    MapPin,
    CheckCircle,
    XCircle,
    Phone,
    Clock,
    Package,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import LostFoundEditModal from '../../components/LostFoundEditModal';
import FilterBar from '../../components/Common/FilterBar';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';

const LostFoundList = () => {
    const location = useLocation();
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialSubmissionStatus = params.get('submissionStatus') || '';
    const initialDeleted = params.get('deleted') || '';
    const initialType = params.get('type') || '';
    const initialCurrentStatus = params.get('currentStatus') || '';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: initialSubmissionStatus,
        deleted: initialDeleted,
        type: initialType,
        currentStatus: initialCurrentStatus,
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'danger',
                onConfirm: () => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchItems();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
        if (filters.deleted) params.set('deleted', filters.deleted);
        if (filters.type) params.set('type', filters.type);
        if (filters.currentStatus)
            params.set('currentStatus', filters.currentStatus);
        if (page > 1) params.set('page', page.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/lostandfound/all/${collegeslug}`);
            setItems(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching lost & found items:', error);
            setError('Failed to fetch lost & found items');
            toast.error('Failed to fetch lost & found items');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        const confirmed = await showConfirm({
            title: 'Delete Item',
            message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/lostandfound/delete/${item._id}`);
                toast.success('Item deleted successfully');
                fetchItems();
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error('Failed to delete item');
            }
        }
    };

    const handleView = (item) => {
        navigate(`/${collegeslug}/lost-found/${item._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleModalSuccess = () => {
        fetchItems();
        handleModalClose();
    };

    const getTypeColor = (type) => {
        return type === 'lost'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getCurrentStatusColor = (status) => {
        return status === 'open'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className='h-4 w-4' />;
            case 'pending':
                return <Clock className='h-4 w-4' />;
            case 'rejected':
                return <XCircle className='h-4 w-4' />;
            default:
                return <Clock className='h-4 w-4' />;
        }
    };

    // Filter, sort, and paginate
    const filtered = items.filter((item) => {
        const matchesSearch =
            item.title?.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()) ||
            item.location?.toLowerCase().includes(search.toLowerCase()) ||
            item.owner?.username?.toLowerCase().includes(search.toLowerCase());

        const matchesSubmissionStatus =
            !filters.submissionStatus ||
            item.submissionStatus === filters.submissionStatus;
        const matchesDeleted =
            !filters.deleted || item.deleted?.toString() === filters.deleted;
        const matchesType = !filters.type || item.type === filters.type;
        const matchesCurrentStatus =
            !filters.currentStatus ||
            item.currentStatus === filters.currentStatus;

        // Time filter
        const matchesTime = filterByTime(item, timeFilter);

        return (
            matchesSearch &&
            matchesSubmissionStatus &&
            matchesDeleted &&
            matchesType &&
            matchesCurrentStatus &&
            matchesTime
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortBy === 'createdAt') {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        }

        if (sortBy === 'clickCounts') {
            const aCount = Number(aValue) || 0;
            const bCount = Number(bValue) || 0;
            return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
        }

        return 0;
    });

    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const uniqueStatuses = [
        ...new Set(items.map((item) => item.submissionStatus)),
    ].filter(Boolean);
    const uniqueTypes = [...new Set(items.map((item) => item.type))].filter(
        Boolean,
    );
    const uniqueCurrentStatuses = [
        ...new Set(items.map((item) => item.currentStatus)),
    ].filter(Boolean);

    const clearAllFilters = () => {
        setSearch('');
        setTimeFilter('');
        setFilters({
            submissionStatus: '',
            deleted: '',
            type: '',
            currentStatus: '',
        });
        setPage(1);
    };

    const activeFiltersCount =
        (filters.submissionStatus ? 1 : 0) +
        (filters.deleted ? 1 : 0) +
        (filters.type ? 1 : 0) +
        (filters.currentStatus ? 1 : 0);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center'>
                        <div className='text-red-600 dark:text-red-400 text-lg font-medium mb-2'>
                            Error Loading Items
                        </div>
                        <p className='text-red-500 dark:text-red-300 mb-4'>
                            {error}
                        </p>
                        <button
                            onClick={fetchItems}
                            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors'
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <BackButton
                        title={`Lost & Found for ${collegeslug}`}
                        TitleIcon={Package}
                    />

                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalItems}
                            </span>
                        </div>

                        {/* FilterBar */}
                        <FilterBar
                            search={search}
                            onSearch={(v) => {
                                setSearch(v);
                                setPage(1);
                            }}
                            searchPlaceholder='Search items...'
                            filters={[
                                {
                                    label: 'Status',
                                    value: filters.submissionStatus,
                                    onChange: (v) =>
                                        setFilters({
                                            ...filters,
                                            submissionStatus: v,
                                        }),
                                    options: [
                                        { value: '', label: 'All Statuses' },
                                        ...uniqueStatuses.map((s) => ({
                                            value: s,
                                            label:
                                                s.charAt(0).toUpperCase() +
                                                s.slice(1),
                                        })),
                                    ],
                                },
                                {
                                    label: 'Deleted',
                                    value: filters.deleted,
                                    onChange: (v) =>
                                        setFilters({ ...filters, deleted: v }),
                                    options: [
                                        { value: '', label: 'All (Deleted)' },
                                        { value: 'true', label: 'Deleted' },
                                        {
                                            value: 'false',
                                            label: 'Not Deleted',
                                        },
                                    ],
                                },
                                {
                                    label: 'Type',
                                    value: filters.type,
                                    onChange: (v) =>
                                        setFilters({ ...filters, type: v }),
                                    options: [
                                        { value: '', label: 'All Types' },
                                        ...uniqueTypes.map((type) => ({
                                            value: type,
                                            label:
                                                type === 'lost'
                                                    ? 'Lost Items'
                                                    : 'Found Items',
                                        })),
                                    ],
                                },
                                {
                                    label: 'Current Status',
                                    value: filters.currentStatus,
                                    onChange: (v) =>
                                        setFilters({
                                            ...filters,
                                            currentStatus: v,
                                        }),
                                    options: [
                                        {
                                            value: '',
                                            label: 'All Current Statuses',
                                        },
                                        ...uniqueCurrentStatuses.map((s) => ({
                                            value: s,
                                            label:
                                                s.charAt(0).toUpperCase() +
                                                s.slice(1),
                                        })),
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
                                        value: 'clickCounts',
                                        label: 'Sort by Views',
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
                            onClear={clearAllFilters}
                            showClear={
                                !!(
                                    search ||
                                    timeFilter ||
                                    activeFiltersCount > 0
                                )
                            }
                        />
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {current.length === 0 ? (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center'>
                            <Package className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                No items found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {search || activeFiltersCount > 0
                                    ? 'Try adjusting your search or filters'
                                    : 'No lost & found items have been submitted yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Item
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Type
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Submission Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Current Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Location / Posted By
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Views / Date
                                                    </th>
                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((item) => (
                                                    <tr
                                                        key={item._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                                        onClick={() =>
                                                            handleView(item)
                                                        }
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center'>
                                                                <div className='flex-shrink-0 h-12 w-12'>
                                                                    {item.imageUrl ? (
                                                                        <img
                                                                            src={
                                                                                item.imageUrl
                                                                            }
                                                                            alt={
                                                                                item.title
                                                                            }
                                                                            className='h-12 w-12 rounded-lg object-cover'
                                                                        />
                                                                    ) : (
                                                                        <div className='h-12 w-12 rounded-lg bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center'>
                                                                            <Package className='h-6 w-6 text-white' />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className='ml-4'>
                                                                    <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                                        {
                                                                            item.title
                                                                        }
                                                                    </div>
                                                                    <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                                        {item.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                                                    item.type,
                                                                )}`}
                                                            >
                                                                {item.type ===
                                                                'lost'
                                                                    ? 'Lost'
                                                                    : 'Found'}
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                    item.submissionStatus,
                                                                )}`}
                                                            >
                                                                {getStatusIcon(
                                                                    item.submissionStatus,
                                                                )}
                                                                <span className='capitalize'>
                                                                    {
                                                                        item.submissionStatus
                                                                    }
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCurrentStatusColor(
                                                                    item.currentStatus,
                                                                )}`}
                                                            >
                                                                {item.currentStatus ===
                                                                'open' ? (
                                                                    <Clock className='h-4 w-4' />
                                                                ) : (
                                                                    <CheckCircle className='h-4 w-4' />
                                                                )}
                                                                <span className='capitalize'>
                                                                    {
                                                                        item.currentStatus
                                                                    }
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='space-y-1'>
                                                                <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                    <MapPin className='h-4 w-4 text-blue-500 mr-2' />
                                                                    <span className='truncate max-w-xs'>
                                                                        {item.location ||
                                                                            'Not specified'}
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                    <User className='h-4 w-4 mr-2' />
                                                                    {item.owner
                                                                        ?.username ||
                                                                        'Unknown'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='space-y-1'>
                                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                    <Eye className='h-4 w-4 mr-2' />
                                                                    {item.clickCounts ||
                                                                        0}{' '}
                                                                    views
                                                                </div>
                                                                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                    <Calendar className='h-4 w-4 mr-2' />
                                                                    {new Date(
                                                                        item.createdAt,
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                            <div className='flex items-center justify-end space-x-2'>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(
                                                                            item,
                                                                        );
                                                                    }}
                                                                    className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                                    title='Edit Item'
                                                                >
                                                                    <Edit2 className='h-4 w-4' />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(
                                                                            item,
                                                                        );
                                                                    }}
                                                                    className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                                    title='Delete Item'
                                                                >
                                                                    <Trash2 className='h-4 w-4' />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                    {current.map((item) => (
                                        <div
                                            key={item._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer overflow-hidden'
                                            onClick={() => handleView(item)}
                                        >
                                            {/* Header with gradient */}
                                            <div className='bg-gradient-to-r from-purple-500 to-indigo-500 p-4'>
                                                <div className='flex items-start justify-between'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                                                            <Package className='h-6 w-6 text-white' />
                                                        </div>
                                                        <div>
                                                            <h3 className='text-white font-medium line-clamp-1'>
                                                                {item.title}
                                                            </h3>
                                                            <div className='flex items-center gap-2 mt-1'>
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                                                        item.type,
                                                                    )}`}
                                                                >
                                                                    {item.type ===
                                                                    'lost'
                                                                        ? 'Lost'
                                                                        : 'Found'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Image or fallback */}
                                            {item.imageUrl && (
                                                <div className='w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-700'>
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        className='w-full h-full object-cover'
                                                    />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className='p-4 space-y-3'>
                                                {item.description && (
                                                    <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className='space-y-2'>
                                                    <div className='flex items-center justify-between'>
                                                        <span
                                                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                item.submissionStatus,
                                                            )}`}
                                                        >
                                                            {getStatusIcon(
                                                                item.submissionStatus,
                                                            )}
                                                            <span className='capitalize'>
                                                                {
                                                                    item.submissionStatus
                                                                }
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCurrentStatusColor(
                                                                item.currentStatus,
                                                            )}`}
                                                        >
                                                            {item.currentStatus ===
                                                            'open' ? (
                                                                <Clock className='h-4 w-4' />
                                                            ) : (
                                                                <CheckCircle className='h-4 w-4' />
                                                            )}
                                                            <span className='capitalize'>
                                                                {
                                                                    item.currentStatus
                                                                }
                                                            </span>
                                                        </span>
                                                    </div>

                                                    {item.location && (
                                                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                            <MapPin className='h-4 w-4 text-blue-500' />
                                                            <span className='truncate'>
                                                                {item.location}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {item.whatsapp && (
                                                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                            <Phone className='h-4 w-4 text-green-500' />
                                                            <span>
                                                                {item.whatsapp}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                        <User className='h-4 w-4' />
                                                        <span>
                                                            {item.owner
                                                                ?.username ||
                                                                'Unknown'}
                                                        </span>
                                                    </div>

                                                    <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                                                        <div className='flex items-center gap-1'>
                                                            <Eye className='h-3 w-3' />
                                                            {item.clickCounts ||
                                                                0}{' '}
                                                            views
                                                        </div>
                                                        <div className='flex items-center gap-1'>
                                                            <Calendar className='h-3 w-3' />
                                                            {new Date(
                                                                item.createdAt,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className='flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(item);
                                                        }}
                                                        className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item);
                                                        }}
                                                        className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='mt-6'>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        pageSize={pageSize}
                                        onPageSizeChange={setPageSize}
                                        totalItems={totalItems}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <LostFoundEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                item={editingItem}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default LostFoundList;
