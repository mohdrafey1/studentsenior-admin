import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import { getStatusBadge } from '../../utils/getStatusColor';
import toast from 'react-hot-toast';
import {
    FileText,
    Edit2,
    Trash2,
    Calendar,
    BookOpen,
    Building,
    Eye,
    DollarSign,
    CheckCircle,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import PyqEditModal from '../../components/PyqEditModal';
import FilterBar from '../../components/Common/FilterBar';
import BackButton from '../../components/Common/BackButton';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';

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

        // Time filter using the utility
        const matchesTime = filterByTime(p, timeFilter);
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
        return <Loader />;
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
                        title={`PYQs for ${collegeslug}`}
                        TitleIcon={FileText}
                    />

                    {/* Total PYQs Banner */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalPyqs}
                            </span>
                        </div>

                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            searchPlaceholder='Search by subject, course, branch, year, or exam type...'
                            filters={[
                                {
                                    label: 'Year',
                                    value: filters.year,
                                    onChange: (v) =>
                                        setFilters({ ...filters, year: v }),
                                    options: [
                                        { value: '', label: 'All Years' },
                                        ...uniqueYears.map((y) => ({
                                            value: y,
                                            label: y,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Exam Type',
                                    value: filters.examType,
                                    onChange: (v) =>
                                        setFilters({ ...filters, examType: v }),
                                    options: [
                                        { value: '', label: 'All Exam Types' },
                                        ...uniqueExamTypes.map((t) => ({
                                            value: t,
                                            label: t,
                                        })),
                                    ],
                                },
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
                                            label: s,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Solved',
                                    value: filters.solved,
                                    onChange: (v) =>
                                        setFilters({ ...filters, solved: v }),
                                    options: [
                                        { value: '', label: 'All (Solved)' },
                                        { value: 'true', label: 'Solved' },
                                        { value: 'false', label: 'Unsolved' },
                                    ],
                                },
                                {
                                    label: 'Price',
                                    value: filters.isPaid,
                                    onChange: (v) =>
                                        setFilters({ ...filters, isPaid: v }),
                                    options: [
                                        { value: '', label: 'All (Price)' },
                                        { value: 'true', label: 'Paid' },
                                        { value: 'false', label: 'Free' },
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
