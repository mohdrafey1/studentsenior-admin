import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Briefcase,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
    Grid3x3,
    List,
    Filter,
    X,
    SortAsc,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import OpportunityEditModal from '../components/OpportunityEditModal';

const OpportunityList = () => {
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

    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: initialSubmissionStatus,
        deleted: initialDeleted,
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

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
        fetchOpportunities();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
        if (filters.deleted) params.set('deleted', filters.deleted);
        if (page > 1) params.set('page', page.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/opportunity/${collegeslug}`);
            setOpportunities(response.data.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            setError('Failed to fetch opportunities');
            toast.error('Failed to fetch opportunities');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (opportunity) => {
        setEditingOpportunity(opportunity);
        setShowModal(true);
    };

    const handleDelete = async (opportunity) => {
        const confirmed = await showConfirm({
            title: 'Delete Opportunity',
            message: `Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/opportunity/delete/${opportunity._id}`);
                toast.success('Opportunity deleted successfully');
                fetchOpportunities();
            } catch (error) {
                console.error('Error deleting opportunity:', error);
                toast.error('Failed to delete opportunity');
            }
        }
    };

    const handleView = (opportunity) => {
        navigate(`/${collegeslug}/opportunities/${opportunity._id}`);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingOpportunity(null);
    };

    const handleModalSuccess = () => {
        fetchOpportunities();
        handleModalClose();
    };

    // Toggle view mode (user can still manually switch)
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // Get unique values for filters
    const uniqueStatuses = ['pending', 'approved', 'rejected'];

    const getStatusColor = (status) => {
        const colors = {
            approved:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            rejected:
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status) => {
        const icons = {
            approved: CheckCircle,
            pending: Clock,
            rejected: XCircle,
        };
        const Icon = icons[status] || Clock;
        return <Icon className='h-4 w-4' />;
    };

    // Apply filters and sorting
    const filtered = opportunities.filter((opp) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            opp.title?.toLowerCase().includes(q) ||
            opp.company?.toLowerCase().includes(q) ||
            opp.description?.toLowerCase().includes(q) ||
            opp.location?.toLowerCase().includes(q) ||
            opp.submissionStatus?.toLowerCase().includes(q);

        const matchesStatus =
            !filters.submissionStatus ||
            opp.submissionStatus === filters.submissionStatus;
        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? opp.deleted : !opp.deleted);

        // Time filter
        const matchesTime = (() => {
            if (!timeFilter) return true;
            const itemDate = new Date(opp.createdAt || 0);
            const now = new Date();

            switch (timeFilter) {
                case 'last24h':
                    return now - itemDate <= 24 * 60 * 60 * 1000;
                case 'last7d':
                    return now - itemDate <= 7 * 24 * 60 * 60 * 1000;
                case 'last28d':
                    return now - itemDate <= 28 * 24 * 60 * 60 * 1000;
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
        })();

        return matchesSearch && matchesStatus && matchesDeleted && matchesTime;
    }); // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'createdAt') {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === 'clickCounts') {
            const countA = a.clickCounts || 0;
            const countB = b.clickCounts || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        }
        return 0;
    });

    const start = (page - 1) * pageSize;
    const current = sorted.slice(start, start + pageSize);

    const totalOpportunities = timeFilter ? sorted.length : 0;
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    const getTimeFilterLabel = () => {
        switch (timeFilter) {
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
            case 'all':
                return 'All Time';
            default:
                return '';
        }
    };

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
            deleted: '',
        });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const clearAllFilters = () => {
        setSearch('');
        setTimeFilter('');
        resetFilters();
        setPage(1);
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading opportunities...
                        </p>
                    </div>
                </div>
            </div>
        );
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
                            Error Loading Opportunities
                        </div>
                        <p className='text-red-500 dark:text-red-300 mb-4'>
                            {error}
                        </p>
                        <button
                            onClick={fetchOpportunities}
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
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center space-x-4'>
                            <button
                                onClick={() => navigate(-1)}
                                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                            </button>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3'>
                                    <div className='p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl'>
                                        <Briefcase className='h-8 w-8 text-white' />
                                    </div>
                                    Opportunities
                                </h1>
                                <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                    Manage job and internship opportunities for
                                    this college
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Opportunities Banner */}
                    {timeFilter && (
                        <div className='bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-6 mb-6 text-white'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-orange-100 text-sm font-medium mb-1'>
                                        {getTimeFilterLabel()}
                                    </p>
                                    <p className='text-3xl font-bold'>
                                        {totalOpportunities} Opportunities
                                    </p>
                                </div>
                                <div className='bg-white/20 p-3 rounded-lg'>
                                    <Briefcase className='w-8 h-8' />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='space-y-6'>
                        {/* Search and Controls */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4'>
                            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                                {/* Search Bar */}
                                <div className='relative flex-1 max-w-md'>
                                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                                    <input
                                        type='text'
                                        placeholder='Search opportunities...'
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    />
                                </div>

                                {/* Controls */}
                                <div className='flex items-center gap-3'>
                                    {/* View Mode Toggle */}
                                    <div className='flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                        <button
                                            onClick={() =>
                                                toggleViewMode('grid')
                                            }
                                            className={`p-2 rounded transition-colors ${
                                                viewMode === 'grid'
                                                    ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                            title='Grid View'
                                        >
                                            <Grid3x3 className='h-5 w-5' />
                                        </button>
                                        <button
                                            onClick={() =>
                                                toggleViewMode('table')
                                            }
                                            className={`p-2 rounded transition-colors ${
                                                viewMode === 'table'
                                                    ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                            title='Table View'
                                        >
                                            <List className='h-5 w-5' />
                                        </button>
                                    </div>

                                    {/* Filter Toggle */}
                                    <button
                                        onClick={() =>
                                            setShowFilters(!showFilters)
                                        }
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            showFilters
                                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Filter className='h-4 w-4' />
                                        Filters
                                        {activeFiltersCount > 0 && (
                                            <span className='bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Time Filter */}
                                    <div className='relative'>
                                        <Clock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
                                        <select
                                            value={timeFilter}
                                            onChange={(e) =>
                                                setTimeFilter(e.target.value)
                                            }
                                            className='pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm appearance-none'
                                        >
                                            <option value=''>
                                                Time Filter
                                            </option>
                                            <option value='last24h'>
                                                Last 24 Hours
                                            </option>
                                            <option value='last7d'>
                                                Last 7 Days
                                            </option>
                                            <option value='last28d'>
                                                Last 28 Days
                                            </option>
                                            <option value='thisWeek'>
                                                This Week
                                            </option>
                                            <option value='thisMonth'>
                                                This Month
                                            </option>
                                            <option value='thisYear'>
                                                This Year
                                            </option>
                                            <option value='all'>
                                                All Time
                                            </option>
                                        </select>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <select
                                        value={`${sortBy}-${sortOrder}`}
                                        onChange={(e) => {
                                            const [field, order] =
                                                e.target.value.split('-');
                                            setSortBy(field);
                                            setSortOrder(order);
                                        }}
                                        className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    >
                                        <option value='createdAt-desc'>
                                            Newest First
                                        </option>
                                        <option value='createdAt-asc'>
                                            Oldest First
                                        </option>
                                        <option value='clickCounts-desc'>
                                            Most Views
                                        </option>
                                        <option value='clickCounts-asc'>
                                            Least Views
                                        </option>
                                    </select>

                                    {/* Clear Filters */}
                                    {(activeFiltersCount > 0 ||
                                        search ||
                                        timeFilter) && (
                                        <button
                                            onClick={clearAllFilters}
                                            className='flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
                                        >
                                            <X className='h-4 w-4' />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter Panel */}
                            {showFilters && (
                                <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'>
                                        <select
                                            value={filters.submissionStatus}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    submissionStatus:
                                                        e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All Submission Statuses
                                            </option>
                                            {uniqueStatuses.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        status.slice(1)}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={filters.deleted}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    deleted: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All (Deleted Status)
                                            </option>
                                            <option value='true'>
                                                Deleted
                                            </option>
                                            <option value='false'>
                                                Not Deleted
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {current.length === 0 ? (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center'>
                            <Briefcase className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                No opportunities found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {search || activeFiltersCount > 0
                                    ? 'Try adjusting your search or filters'
                                    : 'No opportunities have been submitted yet'}
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
                                                        Opportunity
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Contact
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Posted By
                                                    </th>

                                                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((opportunity) => (
                                                    <tr
                                                        key={opportunity._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                                        onClick={() =>
                                                            handleView(
                                                                opportunity,
                                                            )
                                                        }
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center'>
                                                                <div className='flex-shrink-0 h-10 w-10'>
                                                                    <div className='h-10 w-10 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center'>
                                                                        <Briefcase className='h-6 w-6 text-white' />
                                                                    </div>
                                                                </div>
                                                                <div className='ml-4'>
                                                                    <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                                        {
                                                                            opportunity.name
                                                                        }
                                                                    </div>
                                                                    <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                                                                        {opportunity.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='space-y-1'>
                                                                <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                    <Mail className='h-4 w-4 text-blue-500 mr-2' />
                                                                    <span className='truncate max-w-xs'>
                                                                        {opportunity.email ||
                                                                            'Not provided'}
                                                                    </span>
                                                                </div>
                                                                {opportunity.whatsapp && (
                                                                    <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                        <Phone className='h-4 w-4 text-green-500 mr-2' />
                                                                        {
                                                                            opportunity.whatsapp
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <span
                                                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                    opportunity.submissionStatus,
                                                                )}`}
                                                            >
                                                                {getStatusIcon(
                                                                    opportunity.submissionStatus,
                                                                )}
                                                                <span className='capitalize'>
                                                                    {
                                                                        opportunity.submissionStatus
                                                                    }
                                                                </span>
                                                            </span>
                                                            {opportunity.clickCounts >
                                                                0 && (
                                                                <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400'>
                                                                    <Eye className='w-4 h-4' />
                                                                    <span className='text-xs'>
                                                                        {
                                                                            opportunity.clickCounts
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap'>
                                                            <div className='flex items-center text-sm text-gray-900 dark:text-gray-100'>
                                                                <User className='h-4 w-4 text-gray-400 mr-2' />
                                                                {opportunity
                                                                    .owner
                                                                    ?.username ||
                                                                    'Unknown'}
                                                            </div>
                                                            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                <Calendar className='h-4 w-4 mr-2' />
                                                                {new Date(
                                                                    opportunity.createdAt,
                                                                ).toLocaleDateString()}
                                                            </div>
                                                        </td>

                                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                            <div className='flex items-center justify-end space-x-2'>
                                                                {opportunity.link && (
                                                                    <button
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            window.open(
                                                                                opportunity.link,
                                                                                '_blank',
                                                                            );
                                                                        }}
                                                                        className='text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded'
                                                                        title='Open External Link'
                                                                    >
                                                                        <ExternalLink className='h-4 w-4' />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(
                                                                            opportunity,
                                                                        );
                                                                    }}
                                                                    className='text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded'
                                                                    title='Edit Opportunity'
                                                                >
                                                                    <Edit2 className='h-4 w-4' />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(
                                                                            opportunity,
                                                                        );
                                                                    }}
                                                                    className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded'
                                                                    title='Delete Opportunity'
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
                                    {current.map((opportunity) => (
                                        <div
                                            key={opportunity._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer overflow-hidden'
                                            onClick={() =>
                                                handleView(opportunity)
                                            }
                                        >
                                            {/* Header with gradient */}
                                            <div className='bg-gradient-to-r from-orange-500 to-red-500 p-4'>
                                                <div className='flex items-start justify-between'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                                                            <Briefcase className='h-6 w-6 text-white' />
                                                        </div>
                                                        <div>
                                                            <h3 className='text-white font-medium line-clamp-1'>
                                                                {
                                                                    opportunity.name
                                                                }
                                                            </h3>
                                                            <div className='flex items-center gap-2 mt-1'>
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                        opportunity.submissionStatus,
                                                                    )}`}
                                                                >
                                                                    {
                                                                        opportunity.submissionStatus
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className='p-4 space-y-3'>
                                                {opportunity.description && (
                                                    <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
                                                        {
                                                            opportunity.description
                                                        }
                                                    </p>
                                                )}

                                                <div className='space-y-2'>
                                                    {opportunity.email && (
                                                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                            <Mail className='h-4 w-4 text-blue-500' />
                                                            <span className='truncate'>
                                                                {
                                                                    opportunity.email
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    {opportunity.whatsapp && (
                                                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                            <Phone className='h-4 w-4 text-green-500' />
                                                            <span>
                                                                {
                                                                    opportunity.whatsapp
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                        <User className='h-4 w-4' />
                                                        <span>
                                                            {opportunity.owner
                                                                ?.username ||
                                                                'Unknown'}
                                                        </span>
                                                    </div>

                                                    <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                                                        <div className='flex items-center gap-1'>
                                                            <Eye className='h-3 w-3' />
                                                            {opportunity.clickCounts ||
                                                                0}{' '}
                                                            views
                                                        </div>
                                                        <div className='flex items-center gap-1'>
                                                            <Calendar className='h-3 w-3' />
                                                            {new Date(
                                                                opportunity.createdAt,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className='flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700'>
                                                    {opportunity.link && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                    opportunity.link,
                                                                    '_blank',
                                                                );
                                                            }}
                                                            className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors'
                                                        >
                                                            <ExternalLink className='h-4 w-4' />
                                                            Visit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(
                                                                opportunity,
                                                            );
                                                        }}
                                                        className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors'
                                                    >
                                                        <Edit2 className='h-4 w-4' />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(
                                                                opportunity,
                                                            );
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

            <OpportunityEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                opportunity={editingOpportunity}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default OpportunityList;
