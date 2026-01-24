import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    BookOpenCheck,
    ArrowLeft,
    Loader,
    Search,
    Edit2,
    Trash2,
    Eye,
    Grid3x3,
    List,
    Filter,
    X,
    SortAsc,
    Plus,
    Download,
    GraduationCap,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusEditModal from '../../components/SyllabusEditModal';

const SyllabusList = () => {
    const { collegeslug } = useParams();
    const navigate = useNavigate();

    const [syllabus, setSyllabus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const { mainContentMargin } = useSidebarLayout();

    const [viewMode, setViewMode] = useState(() => {
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });

    const [filters, setFilters] = useState({
        year: '',
        semester: '',
        isActive: '',
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        subjectCode: '',
        subjectName: '',
        year: 1,
        semester: 1,
        units: [],
        referenceBooks: '',
        description: '',
        isActive: true,
    });
    const [submittingEdit, setSubmittingEdit] = useState(false);

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

    const fetchSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/syllabus/all/${collegeslug}`);
            setSyllabus(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch syllabus');
            toast.error('Failed to fetch syllabus');
        } finally {
            setLoading(false);
        }
    }, [collegeslug]);

    useEffect(() => {
        fetchSyllabus();
    }, [collegeslug, fetchSyllabus]);

    useEffect(() => {
        const handleResize = () => {
            const newMode = window.innerWidth >= 1024 ? 'table' : 'grid';
            setViewMode(newMode);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleEdit = (item) => {
        setEditFormData({
            id: item._id,
            subjectCode: item.subject?.subjectCode || '',
            subjectName: item.subject?.subjectName || '',
            year: item.year || 1,
            semester: item.semester || 1,
            units: item.units || [
                {
                    unitNumber: 1,
                    title: '',
                    content: '',
                },
            ],
            referenceBooks: item.referenceBooks || '',
            description: item.description || '',
            isActive: item.isActive !== undefined ? item.isActive : true,
        });
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditFormData({
            id: '',
            subjectCode: '',
            subjectName: '',
            year: 1,
            semester: 1,
            units: [],
            referenceBooks: '',
            description: '',
            isActive: true,
        });
    };

    const handleEditFormChange = (field, value) => {
        setEditFormData({ ...editFormData, [field]: value });
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();

        try {
            setSubmittingEdit(true);

            // Parse units if it's a string (JSON format)
            let parsedUnits = editFormData.units;
            if (typeof editFormData.units === 'string') {
                try {
                    parsedUnits = JSON.parse(editFormData.units);
                    // Validate that it's an array
                    if (!Array.isArray(parsedUnits)) {
                        throw new Error('Units must be an array');
                    }
                    // Validate each unit has required fields
                    parsedUnits.forEach((unit, idx) => {
                        if (!unit.unitNumber || !unit.title || !unit.content) {
                            throw new Error(
                                `Unit ${idx + 1} is missing required fields (unitNumber, title, content)`,
                            );
                        }
                    });
                } catch (err) {
                    toast.error(
                        `Invalid JSON format for units: ${err.message}`,
                    );
                    setSubmittingEdit(false);
                    return;
                }
            }

            const updateData = {
                year: editFormData.year,
                semester: editFormData.semester,
                units: parsedUnits,
                referenceBooks: editFormData.referenceBooks,
                description: editFormData.description,
                isActive: editFormData.isActive,
            };

            await api.put(`/syllabus/edit/${editFormData.id}`, updateData);

            // Update the local state
            setSyllabus(
                syllabus.map((item) =>
                    item._id === editFormData.id
                        ? { ...item, ...updateData }
                        : item,
                ),
            );

            toast.success('Syllabus updated successfully');
            handleCloseEditModal();
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to update syllabus',
            );
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleDelete = async (item) => {
        const confirmed = await showConfirm({
            title: 'Delete Syllabus',
            message: `Are you sure you want to delete "${item.subject?.subjectCode || 'N/A'} - ${item.subject?.subjectName || 'Untitled'}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/syllabus/delete/${item._id}`);
                setSyllabus(syllabus.filter((s) => s._id !== item._id));
                toast.success('Syllabus deleted successfully');
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete syllabus',
                );
            }
        }
        closeConfirm();
    };

    const handleView = (item) => {
        navigate(`/${collegeslug}/syllabus/${item._id}`);
    };

    const handleCreate = () => {
        navigate(`/${collegeslug}/syllabus/create`);
    };

    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // Apply filters and sorting
    const filtered = syllabus.filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            item.subject?.subjectName?.toLowerCase().includes(q) ||
            item.subject?.subjectCode?.toLowerCase().includes(q);

        const matchesYear =
            !filters.year || item.year === parseInt(filters.year);

        const matchesSemester =
            !filters.semester || item.semester === parseInt(filters.semester);

        const matchesActive =
            filters.isActive === '' ||
            (filters.isActive === 'true' ? item.isActive : !item.isActive);

        return matchesSearch && matchesYear && matchesSemester && matchesActive;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'createdAt') {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortBy === 'viewCount') {
            const countA = a.viewCount || 0;
            const countB = b.viewCount || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        }
        return 0;
    });

    const start = (page - 1) * pageSize;
    const current = sorted.slice(start, start + pageSize);

    const resetFilters = () => {
        setFilters({
            year: '',
            semester: '',
            isActive: '',
        });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const clearAllFilters = () => {
        setSearch('');
        resetFilters();
        setPage(1);
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
                                Loading syllabus...
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
                                <div className='bg-blue-600 text-white p-3 rounded-lg mr-4'>
                                    <BookOpenCheck className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Syllabus
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage syllabus for {collegeslug}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            <Plus className='w-5 h-5' />
                            Add Syllabus
                        </button>
                    </div>

                    {/* Search and Controls */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='flex flex-col gap-4'>
                            {/* Search Bar */}
                            <div className='relative flex-1'>
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                                <input
                                    type='text'
                                    placeholder='Search by subject name, code, or session...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>

                            {/* Controls */}
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
                                    >
                                        <List className='w-5 h-5' />
                                    </button>
                                </div>

                                {/* Filter Toggle */}
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
                                    <option value='viewCount'>
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
                                {(activeFiltersCount > 0 || search) && (
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
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
                                            <option value='1'>Year 1</option>
                                            <option value='2'>Year 2</option>
                                            <option value='3'>Year 3</option>
                                            <option value='4'>Year 4</option>
                                            <option value='5'>Year 5</option>
                                            <option value='6'>Year 6</option>
                                        </select>

                                        <select
                                            value={filters.semester}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    semester: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>
                                                All Semesters
                                            </option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                (sem) => (
                                                    <option
                                                        key={sem}
                                                        value={sem}
                                                    >
                                                        Semester {sem}
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <select
                                            value={filters.isActive}
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    isActive: e.target.value,
                                                })
                                            }
                                            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                        >
                                            <option value=''>All Status</option>
                                            <option value='true'>Active</option>
                                            <option value='false'>
                                                Inactive
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

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                    <thead className='bg-gray-50 dark:bg-gray-900'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Course Details
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Academic Info
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Status
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                        {current.map((item) => (
                                            <tr
                                                key={item._id}
                                                className='hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                                onClick={() => handleView(item)}
                                            >
                                                <td className='px-6 py-4'>
                                                    <div className='flex items-center'>
                                                        <div className='flex-shrink-0 h-10 w-10'>
                                                            <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                                                                <GraduationCap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                                                            </div>
                                                        </div>
                                                        <div className='ml-4'>
                                                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                {item.subject
                                                                    ?.subjectCode ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                {item.subject
                                                                    ?.subjectName ||
                                                                    'Subject name not available'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4'>
                                                    <div className='text-sm text-gray-900 dark:text-white'>
                                                        Year {item.year} • Sem{' '}
                                                        {item.semester}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                        {item.units?.length ||
                                                            0}{' '}
                                                        Units
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4'>
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            item.isActive
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {item.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                    <div className='flex items-center justify-end space-x-2'>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(
                                                                    item,
                                                                );
                                                            }}
                                                            className='text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded'
                                                        >
                                                            <Edit2 className='w-4 h-4' />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(
                                                                    item,
                                                                );
                                                            }}
                                                            className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
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

                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className='space-y-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                {current.map((item) => (
                                    <div
                                        key={item._id}
                                        className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer'
                                        onClick={() => handleView(item)}
                                    >
                                        <div className='flex justify-between items-start mb-3'>
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    item.isActive
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {item.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className='mb-3'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                                                    <GraduationCap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <h3 className='text-sm font-bold text-gray-900 dark:text-white'>
                                                        {item.subject
                                                            ?.subjectCode ||
                                                            'N/A'}
                                                    </h3>
                                                    <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                        {item.subject
                                                            ?.subjectName ||
                                                            'Subject name not available'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                {item.effectiveSession}
                                            </div>
                                        </div>

                                        <div className='space-y-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700'>
                                            <div className='flex items-center justify-between text-xs'>
                                                <span className='text-gray-500 dark:text-gray-400'>
                                                    Year {item.year} • Semester{' '}
                                                    {item.semester}
                                                </span>
                                            </div>
                                            <div className='flex items-center justify-between text-xs'>
                                                <span className='text-gray-500 dark:text-gray-400'>
                                                    Units
                                                </span>
                                                <span className='font-semibold text-gray-900 dark:text-white'>
                                                    {item.units?.length || 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                                                <div className='flex items-center gap-1'>
                                                    <Eye className='w-3 h-3' />
                                                    {item.viewCount || 0}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(item);
                                                }}
                                                className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors'
                                            >
                                                <Edit2 className='w-3.5 h-3.5' />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item);
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <SyllabusEditModal
                showModal={showEditModal}
                formData={editFormData}
                submitting={submittingEdit}
                onClose={handleCloseEditModal}
                onSubmit={handleSubmitEdit}
                onFormChange={handleEditFormChange}
            />
        </div>
    );
};

export default SyllabusList;
