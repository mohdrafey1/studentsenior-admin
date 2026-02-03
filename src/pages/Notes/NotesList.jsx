import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
    Edit2,
    Trash2,
    BookOpen,
    Building,
    Eye,
    DollarSign,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import NotesEditModal from '../../components/NotesEditModal';
import { getStatusBadge } from '../../utils/getStatusColor';
import FilterBar from '../../components/Common/FilterBar';
import BackButton from '../../components/Common/BackButton';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';

const NotesList = () => {
    const location = useLocation();
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialSubmissionStatus = params.get('submissionStatus') || '';
    const initialIsPaid = params.get('isPaid') || '';
    const initialDeleted = params.get('deleted') || '';

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const { mainContentMargin } = useSidebarLayout();

    // View mode - responsive default (small screens = grid, large screens = table)
    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    // Filters state
    const [filters, setFilters] = useState({
        submissionStatus: initialSubmissionStatus,
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

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (timeFilter) params.set('time', timeFilter);
        if (filters.submissionStatus)
            params.set('submissionStatus', filters.submissionStatus);
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

        // Time filter using the utility
        const matchesTime = filterByTime(note, timeFilter);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesIsPaid &&
            matchesDeleted &&
            matchesTime
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

    const totalNotes = sorted.length;

    const resetFilters = () => {
        setFilters({
            submissionStatus: '',
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
            <main className='pt-6 pb-12 mx-auto max-w-[90%]'>
                <div
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    {/* Header */}
                    <BackButton
                        title={`Notes for ${collegeslug}`}
                        TitleIcon={FileText}
                    />

                    {/* Total Notes Banner */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalNotes}
                            </span>
                        </div>

                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            searchPlaceholder='Search by title, description, subject, or owner...'
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
                                            label: s,
                                        })),
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
                                                            <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
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
