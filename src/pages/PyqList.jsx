import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import { getStatusBadge } from '../utils/getStatusColor';
import toast from 'react-hot-toast';
import {
    FileText,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Calendar,
    BookOpen,
    Building,
    Grid3x3,
    List,
    Filter,
    X,
    SortAsc,
    Eye,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import PyqEditModal from '../components/PyqEditModal';

const PyqList = () => {
    const location = useLocation();
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialYear = params.get('year') || '';
    const initialExamType = params.get('examType') || '';
    const initialSubmissionStatus = params.get('submissionStatus') || '';
    const initialSolved = params.get('solved') || '';
    const initialIsPaid = params.get('isPaid') || '';
    const initialDeleted = params.get('deleted') || '';

    const [pyqs, setPyqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingPyq, setEditingPyq] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        year: initialYear,
        examType: initialExamType,
        submissionStatus: initialSubmissionStatus,
        solved: initialSolved,
        isPaid: initialIsPaid,
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
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const fetchPyqs = async () => {
        try {
            setError(null);
            const response = await api.get(`/pyq/all/${collegeslug}`);
            setPyqs(response.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load PYQs');
            toast.error('Failed to load PYQs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPyqs();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.year) params.set('year', filters.year);
        if (filters.examType) params.set('examType', filters.examType);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
        if (filters.solved) params.set('solved', filters.solved);
        if (filters.isPaid) params.set('isPaid', filters.isPaid);
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

    const handleEdit = (pyq) => {
        setEditingPyq(pyq);
        setShowModal(true);
    };

    const handleDelete = async (pyq) => {
        const ok = await showConfirm({
            title: 'Delete PYQ',
            message: `Are you sure you want to delete this PYQ for ${pyq.subject?.subjectName}? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/pyq/delete/${pyq._id}`);
            setPyqs(pyqs.filter((p) => p._id !== pyq._id));
            toast.success('PYQ deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete PYQ');
        }
    };

    const handleView = (pyq) => {
        navigate(`/${collegeslug}/pyqs/${pyq._id}`);
    };

    // Toggle view mode (user can still manually switch)
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // Get unique values for filters
    const uniqueYears = [...new Set(pyqs.map((p) => p.year))]
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a));
    const uniqueExamTypes = [...new Set(pyqs.map((p) => p.examType))].filter(
        Boolean,
    );
    const uniqueStatuses = ['pending', 'approved', 'rejected'];

    // Apply filters and sorting
    const filtered = pyqs.filter((p) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            p.subject?.subjectName?.toLowerCase().includes(q) ||
            p.subject?.subjectCode?.toLowerCase().includes(q) ||
            p.subject?.branch?.branchName?.toLowerCase().includes(q) ||
            p.subject?.branch?.course?.courseName?.toLowerCase().includes(q) ||
            p.year?.toString().includes(q) ||
            p.examType?.toLowerCase().includes(q) ||
            p.submissionStatus?.toLowerCase().includes(q);

        const matchesYear = !filters.year || p.year === filters.year;
        const matchesExamType =
            !filters.examType || p.examType === filters.examType;
        const matchesStatus =
            !filters.submissionStatus ||
            p.submissionStatus === filters.submissionStatus;

        // Time filter
        const matchesTime = (() => {
            if (!timeFilter) return true;
            const itemDate = new Date(p.createdAt || 0);
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
        const matchesSolved =
            filters.solved === '' ||
            (filters.solved === 'true' ? p.solved : !p.solved);
        const matchesPaid =
            filters.isPaid === '' ||
            (filters.isPaid === 'true' ? p.isPaid : !p.isPaid);
        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? p.deleted : !p.deleted);

        return (
            matchesSearch &&
            matchesYear &&
            matchesExamType &&
            matchesStatus &&
            matchesTime &&
            matchesSolved &&
            matchesPaid &&
            matchesDeleted
        );
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        let compareValue = 0;

        if (sortBy === 'createdAt') {
            compareValue = new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortBy === 'clickCounts') {
            compareValue = (a.clickCounts || 0) - (b.clickCounts || 0);
        }

        return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    const start = (page - 1) * pageSize;
    const current = sorted.slice(start, start + pageSize);

    const totalPyqs = timeFilter ? sorted.length : 0;

    const resetFilters = () => {
        setFilters({
            year: '',
            examType: '',
            submissionStatus: '',
            solved: '',
            isPaid: '',
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
                <div className='flex items-center justify-center py-20'>
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading PYQs...
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
            <main className='pt-6 pb-12'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate(`/${collegeslug}`)}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-purple-600 text-white p-3 rounded-lg mr-4'>
                                    <FileText className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Previous Year Questions
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage PYQs for {collegeslug}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total PYQs Banner */}
                    {timeFilter && (
                        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-blue-100 text-sm font-medium mb-1'>
                                        {getTimeFilterLabel()}
                                    </p>
                                    <p className='text-3xl font-bold'>
                                        {totalPyqs} PYQs
                                    </p>
                                </div>
                                <div className='bg-white/20 p-3 rounded-lg'>
                                    <FileText className='w-8 h-8' />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search and Controls */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='flex flex-col gap-4'>
                            {/* Search Bar */}
                            <div className='relative flex-1'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by subject, course, branch, year, or exam type...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>

                            {/* View Toggle, Filters, and Sort Controls */}
                            <div className='flex flex-wrap items-center gap-3'>
                                {/* View Mode Toggle */}
                                <div className='flex gap-2'>
                                    <button
                                        onClick={() => toggleViewMode('grid')}
                                        className={`p-2 rounded-lg border ${
                                            viewMode === 'grid'
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                        title='Grid View'
                                    >
                                        <Grid3x3 className='w-5 h-5' />
                                    </button>
                                    <button
                                        onClick={() => toggleViewMode('table')}
                                        className={`p-2 rounded-lg border ${
                                            viewMode === 'table'
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                        title='Table View'
                                    >
                                        <List className='w-5 h-5' />
                                    </button>
                                </div>

                                {/* Filter Toggle Button */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                        showFilters
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Filter className='w-5 h-5' />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <span className='bg-blue-500 text-white text-xs rounded-full px-2 py-0.5'>
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
                                        className='pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm appearance-none'
                                    >
                                        <option value=''>Time Filter</option>
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
                                        <option value='all'>All Time</option>
                                    </select>
                                </div>

                                {/* Sort Controls */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                >
                                    <option value='createdAt'>
                                        Sort by Date
                                    </option>
                                    <option value='clickCounts'>
                                        Sort by Views
                                    </option>
                                </select>
                                <button
                                    onClick={() =>
                                        setSortOrder(
                                            sortOrder === 'asc'
                                                ? 'desc'
                                                : 'asc',
                                        )
                                    }
                                    className='p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700 dark:text-white'
                                    title={
                                        sortOrder === 'asc'
                                            ? 'Ascending'
                                            : 'Descending'
                                    }
                                >
                                    <SortAsc
                                        className={`w-5 h-5 transition-transform ${
                                            sortOrder === 'desc'
                                                ? 'rotate-180'
                                                : ''
                                        }`}
                                    />
                                </button>

                                {/* Clear Filters */}
                                {(activeFiltersCount > 0 ||
                                    search ||
                                    timeFilter) && (
                                    <button
                                        onClick={clearAllFilters}
                                        className='px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2'
                                    >
                                        <X className='w-4 h-4' />
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Filter Panel */}
                            {showFilters && (
                                <div className='p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600'>
                                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                                        <select
                                            value={filters.year}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    year: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>All Years</option>
                                            {uniqueYears.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={filters.examType}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    examType: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All Exam Types
                                            </option>
                                            {uniqueExamTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>

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
                                                All Statuses
                                            </option>
                                            {uniqueStatuses.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={filters.solved}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    solved: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All (Solved Status)
                                            </option>
                                            <option value='true'>Solved</option>
                                            <option value='false'>
                                                Unsolved
                                            </option>
                                        </select>

                                        <select
                                            value={filters.isPaid}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    isPaid: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All (Price Type)
                                            </option>
                                            <option value='true'>Paid</option>
                                            <option value='false'>Free</option>
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

                    {/* PYQs Table View */}
                    {viewMode === 'table' && (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                    <thead className='bg-gray-50 dark:bg-gray-700'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Subject Details
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Year & Exam
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Status
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Price
                                            </th>

                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Created
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                        {current.map((pyq) => (
                                            <tr
                                                key={pyq._id}
                                                className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                                onClick={() => handleView(pyq)}
                                            >
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className='flex items-center'>
                                                        <div className='flex-shrink-0 h-10 w-10'>
                                                            <div className='h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center'>
                                                                <BookOpen className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                                            </div>
                                                        </div>
                                                        <div className='ml-4'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {pyq.subject
                                                                    ?.subjectName ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                {
                                                                    pyq.subject
                                                                        ?.subjectCode
                                                                }{' '}
                                                                • Sem{' '}
                                                                {
                                                                    pyq.subject
                                                                        ?.semester
                                                                }
                                                            </div>
                                                            <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                                <Building className='w-3 h-3 mr-1' />
                                                                {
                                                                    pyq.subject
                                                                        ?.branch
                                                                        ?.branchCode
                                                                }{' '}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className='flex items-center'>
                                                        <Calendar className='w-4 h-4 text-gray-400 mr-2' />
                                                        <div>
                                                            <div className='text-sm text-gray-900 dark:text-white'>
                                                                {pyq.year ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                {pyq.examType ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                            pyq.submissionStatus,
                                                        )}`}
                                                    >
                                                        {pyq.submissionStatus ||
                                                            'pending'}
                                                    </span>
                                                    {pyq.submissionStatus ===
                                                        'approved' && (
                                                        <p className='text-xs text-gray-500 dark:text-gray-400 text-center mt-1'>
                                                            <Eye className='w-3 h-3 inline-block ml-1' />{' '}
                                                            {pyq.clickCounts}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {pyq.price > 0
                                                            ? `₹${pyq.price / 5} `
                                                            : 'Free'}
                                                    </div>
                                                    <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                        {pyq.solved
                                                            ? 'Solved'
                                                            : 'Unsolved'}{' '}
                                                    </div>
                                                </td>

                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {pyq.createdAt
                                                            ? new Date(
                                                                  pyq.createdAt,
                                                              ).toLocaleString()
                                                            : 'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                        By-
                                                        {pyq.owner?.username ||
                                                            'N/A'}
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                    <div className='flex items-center justify-end space-x-2'>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(pyq);
                                                            }}
                                                            className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                            title='Edit PYQ'
                                                        >
                                                            <Edit2 className='w-4 h-4' />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(
                                                                    pyq,
                                                                );
                                                            }}
                                                            className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                            title='Delete PYQ'
                                                        >
                                                            <Trash2 className='w-4 h-4' />
                                                        </button>
                                                    </div>
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
                                    totalItems={sorted.length}
                                    onPageChange={setPage}
                                    onPageSizeChange={(s) => {
                                        setPageSize(s);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* PYQs Grid View */}
                    {viewMode === 'grid' && (
                        <div className='space-y-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {current.map((pyq) => (
                                    <div
                                        key={pyq._id}
                                        className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer'
                                        onClick={() => handleView(pyq)}
                                    >
                                        {/* Status Badge */}
                                        <div className='flex justify-between items-start mb-3'>
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    pyq.submissionStatus ===
                                                    'approved'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : pyq.submissionStatus ===
                                                            'pending'
                                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                }`}
                                            >
                                                {pyq.submissionStatus}
                                            </span>
                                            <div className='flex items-center gap-2'>
                                                {pyq.solved && (
                                                    <CheckCircle className='w-5 h-5 text-green-500' />
                                                )}
                                                {pyq.isPaid && (
                                                    <DollarSign className='w-5 h-5 text-blue-500' />
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject Info */}
                                        <div className='mb-3'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <div className='h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0'>
                                                    <BookOpen className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                                                        {pyq.subject
                                                            ?.subjectName ||
                                                            'N/A'}
                                                    </h3>
                                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                        {
                                                            pyq.subject
                                                                ?.subjectCode
                                                        }{' '}
                                                        • Sem{' '}
                                                        {pyq.subject?.semester}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                                                <Building className='w-3 h-3 mr-1' />
                                                {
                                                    pyq.subject?.branch
                                                        ?.branchCode
                                                }{' '}
                                                •{' '}
                                                {
                                                    pyq.subject?.course
                                                        ?.courseName
                                                }
                                            </div>
                                        </div>

                                        {/* Year & Exam Type */}
                                        <div className='flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700'>
                                            <div>
                                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                    Year & Exam
                                                </p>
                                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                    {pyq.year || 'N/A'} •{' '}
                                                    {pyq.examType}
                                                </p>
                                            </div>
                                            {pyq.clickCounts > 0 && (
                                                <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400'>
                                                    <Eye className='w-4 h-4' />
                                                    <span className='text-xs'>
                                                        {pyq.clickCounts}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price & Date */}
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                                                {pyq.isPaid
                                                    ? `₹${pyq.price || 0}`
                                                    : 'Free'}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                {new Date(
                                                    pyq.createdAt,
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Owner */}
                                        <div className='text-xs text-gray-400 dark:text-gray-500 mb-4'>
                                            By {pyq.owner?.username || 'N/A'}
                                        </div>

                                        {/* Actions */}
                                        <div className='flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(pyq);
                                                }}
                                                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors'
                                            >
                                                <Edit2 className='w-3.5 h-3.5' />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(pyq);
                                                }}
                                                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
                                            >
                                                <Trash2 className='w-3.5 h-3.5' />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination for Grid */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3'>
                                <Pagination
                                    currentPage={page}
                                    pageSize={pageSize}
                                    totalItems={sorted.length}
                                    onPageChange={setPage}
                                    onPageSizeChange={(s) => {
                                        setPageSize(s);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <PyqEditModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingPyq(null);
                }}
                pyq={editingPyq}
                onSuccess={(updatedPyq) => {
                    setPyqs(
                        pyqs.map((p) =>
                            p._id === updatedPyq._id ? updatedPyq : p,
                        ),
                    );
                    setShowModal(false);
                    setEditingPyq(null);
                }}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default PyqList;
