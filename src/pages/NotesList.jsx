import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    Edit2,
    Trash2,
    Calendar,
    BookOpen,
    Building,
    User,
    Grid3x3,
    List,
    Filter,
    X,
    SortAsc,
    Eye,
    DollarSign,
    CheckCircle,
    XCircle,
    Plus,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import NotesEditModal from '../components/NotesEditModal';
import { getStatusBadge } from '../utils/getStatusColor';

const NotesList = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const { collegeslug } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: '',
        isPaid: '',
        deleted: '',
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
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/notes/all/${collegeslug}`);
            setNotes(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch notes');
            toast.error('Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Responsive view mode - always auto-switch based on screen size
    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleEdit = (note) => {
        setEditingNote(note);
        setShowModal(true);
    };

    const handleDelete = async (note) => {
        const confirmed = await showConfirm({
            title: 'Delete Note',
            message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/notes/delete/${note._id}`);
                setNotes(notes.filter((n) => n._id !== note._id));
                toast.success('Note deleted successfully');
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete note',
                );
            }
        }
        closeConfirm();
    };

    const handleView = (note) => {
        navigate(`/${collegeslug}/notes/${note._id}`);
    };

    // Toggle view mode (user can still manually switch)
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // Get unique values for filters
    const uniqueStatuses = ['pending', 'approved', 'rejected'];

    // Apply filters and sorting
    const filtered = notes.filter((note) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            note.title?.toLowerCase().includes(q) ||
            note.description?.toLowerCase().includes(q) ||
            note.subject?.subjectName?.toLowerCase().includes(q) ||
            note.owner?.username?.toLowerCase().includes(q);

        const matchesStatus =
            !filters.submissionStatus ||
            note.submissionStatus === filters.submissionStatus;

        const matchesIsPaid =
            !filters.isPaid ||
            (filters.isPaid === 'true' ? note.price > 0 : note.price === 0);

        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? note.deleted : !note.deleted);

        return (
            matchesSearch && matchesStatus && matchesIsPaid && matchesDeleted
        );
    });

    // Sort
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

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
            isPaid: '',
            deleted: '',
        });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center justify-center h-96'>
                        <div className='text-center'>
                            <Loader className='w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400' />
                            <p className='mt-4 text-gray-600 dark:text-gray-400'>
                                Loading notes...
                            </p>
                        </div>
                    </div>
                </main>
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
                                        Notes
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage notes for {collegeslug}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Controls */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='flex flex-col gap-4'>
                            {/* Search Bar */}
                            <div className='relative flex-1'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by title, description, subject, or owner...'
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
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={resetFilters}
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
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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

                    {/* Notes Table View */}
                    {viewMode === 'table' && (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                    <thead className='bg-gray-50 dark:bg-gray-900'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Note Details
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Status
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
                                        {current.map((note) => (
                                            <tr
                                                key={note._id}
                                                className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                                onClick={() => handleView(note)}
                                            >
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className='flex items-center'>
                                                        <div className='flex-shrink-0 h-10 w-10'>
                                                            <div className='h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center'>
                                                                <BookOpen className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                                                            </div>
                                                        </div>
                                                        <div className='ml-4'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {note.title ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                {note.description ||
                                                                    'No description'}
                                                            </div>
                                                            <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                                <Building className='w-3 h-3 mr-1' />
                                                                {note.subject
                                                                    ?.subjectName ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                            note.submissionStatus,
                                                        )}`}
                                                    >
                                                        {note.submissionStatus}
                                                    </span>
                                                    {note.submissionStatus ===
                                                        'approved' && (
                                                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                            <Eye className='w-3 h-3 inline-block ml-1' />{' '}
                                                            {note.clickCounts}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {note.createdAt
                                                            ? new Date(
                                                                  note.createdAt,
                                                              ).toLocaleString()
                                                            : 'N/A'}
                                                    </div>
                                                    <div className='text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1'>
                                                        By-
                                                        {note.owner?.username ||
                                                            'N/A'}
                                                    </div>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {note.price > 0
                                                            ? `₹${note.price / 5} `
                                                            : 'Free'}
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                    <div className='flex items-center justify-end space-x-2'>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(
                                                                    note,
                                                                );
                                                            }}
                                                            className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                            title='Edit Note'
                                                        >
                                                            <Edit2 className='w-4 h-4' />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(
                                                                    note,
                                                                );
                                                            }}
                                                            className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                                            title='Delete Note'
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
                                    totalPages={Math.ceil(
                                        sorted.length / pageSize,
                                    )}
                                    onPageChange={setPage}
                                    pageSize={pageSize}
                                    onPageSizeChange={setPageSize}
                                    totalItems={sorted.length}
                                />
                            </div>
                        </div>
                    )}

                    {/* Notes Grid View */}
                    {viewMode === 'grid' && (
                        <div className='space-y-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {current.map((note) => (
                                    <div
                                        key={note._id}
                                        className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer'
                                        onClick={() => handleView(note)}
                                    >
                                        {/* Status Badge */}
                                        <div className='flex justify-between items-start mb-3'>
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    note.submissionStatus ===
                                                    'approved'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : note.submissionStatus ===
                                                            'pending'
                                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                }`}
                                            >
                                                {note.submissionStatus}
                                            </span>
                                            <div className='flex items-center gap-2'>
                                                {note.price > 0 && (
                                                    <DollarSign className='w-5 h-5 text-blue-500' />
                                                )}
                                            </div>
                                        </div>

                                        {/* Note Info */}
                                        <div className='mb-3'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <div className='h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0'>
                                                    <BookOpen className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                                                        {note.title || 'N/A'}
                                                    </h3>
                                                    <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {note.description ||
                                                            'No description'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                                                <Building className='w-3 h-3 mr-1' />
                                                {note.subject?.subjectName ||
                                                    'N/A'}
                                            </div>
                                        </div>

                                        {/* Views & Price */}
                                        <div className='flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700'>
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                                                {note.price > 0
                                                    ? `₹${note.price / 5}`
                                                    : 'Free'}
                                            </div>
                                            {note.clickCounts > 0 && (
                                                <div className='flex items-center gap-1 text-gray-500 dark:text-gray-400'>
                                                    <Eye className='w-4 h-4' />
                                                    <span className='text-xs'>
                                                        {note.clickCounts}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Date & Owner */}
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                {new Date(
                                                    note.createdAt,
                                                ).toLocaleDateString()}
                                            </div>
                                            <div className='text-xs text-gray-400 dark:text-gray-500'>
                                                By{' '}
                                                {note.owner?.username || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className='flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(note);
                                                }}
                                                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors'
                                            >
                                                <Edit2 className='w-3.5 h-3.5' />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(note);
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
                                    totalPages={Math.ceil(
                                        sorted.length / pageSize,
                                    )}
                                    onPageChange={setPage}
                                    pageSize={pageSize}
                                    onPageSizeChange={setPageSize}
                                    totalItems={sorted.length}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <NotesEditModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingNote(null);
                }}
                note={editingNote}
                onSuccess={(updatedNote) => {
                    setNotes(
                        notes.map((n) =>
                            n._id === updatedNote._id ? updatedNote : n,
                        ),
                    );
                    setShowModal(false);
                    setEditingNote(null);
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

export default NotesList;
