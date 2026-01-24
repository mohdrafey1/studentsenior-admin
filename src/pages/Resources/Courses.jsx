import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    GraduationCap,
    ArrowLeft,
    Loader,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    Calendar,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { Link } from 'react-router-dom';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'name'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        courseName: '',
        courseCode: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const { mainContentMargin } = useSidebarLayout();
    const navigate = useNavigate();
    const location = useLocation();

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

    const fetchCourses = async () => {
        try {
            setError(null);
            const res = await api.get('/resource/courses');
            setCourses(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load courses');
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setSortBy(sb === 'name' ? 'name' : 'createdAt');
        setSortOrder(so === 'asc' ? 'asc' : 'desc');
        setViewMode(vm === 'grid' ? 'grid' : 'table');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist params on changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        params.set('search', search || '');
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('view', viewMode);
        const newSearch = params.toString();
        if (newSearch !== location.search.replace(/^\?/, '')) {
            navigate({ search: newSearch }, { replace: true });
        }
    }, [
        search,
        page,
        pageSize,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Responsive view auto-switch
    useEffect(() => {
        const handleResize = () =>
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.courseName.trim() || !formData.courseCode.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingCourse) {
                await api.put(
                    `/resource/courses/${editingCourse._id}`,
                    formData,
                );
                toast.success('Course updated successfully');
                setCourses(
                    courses.map((c) =>
                        c._id === editingCourse._id ? { ...c, ...formData } : c,
                    ),
                );
            } else {
                await api.post('/resource/courses', formData);
                toast.success('Course created successfully');
                fetchCourses(); // Refresh to get updated data
            }
            handleCloseModal();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            courseName: course.courseName,
            courseCode: course.courseCode,
        });
        setShowModal(true);
    };

    const handleDelete = async (course) => {
        const ok = await showConfirm({
            title: 'Delete Course',
            message: `Are you sure you want to delete "${course.courseName}"? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/courses/${course._id}`);
            setCourses(courses.filter((c) => c._id !== course._id));
            toast.success('Course deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete course');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCourse(null);
        setFormData({ courseName: '', courseCode: '' });
    };

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = courses
            .filter((c) => {
                return (
                    !q ||
                    c.courseName?.toLowerCase().includes(q) ||
                    c.courseCode?.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => {
                let aVal = 0;
                let bVal = 0;
                if (sortBy === 'createdAt') {
                    aVal = new Date(a.createdAt || 0).getTime();
                    bVal = new Date(b.createdAt || 0).getTime();
                } else {
                    aVal = (a.courseName || '').toLowerCase();
                    bVal = (b.courseName || '').toLowerCase();
                    const cmp = aVal.localeCompare(bVal);
                    return sortOrder === 'asc' ? cmp : -cmp;
                }
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
        return list;
    }, [courses, search, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

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
                            Loading courses...
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
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate('/reports')}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-emerald-600 text-white p-3 rounded-lg mr-4'>
                                    <GraduationCap className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Courses
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage course offerings
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className='inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            Add Course
                        </button>
                    </div>

                    {/* Search, View & Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        <div className='relative mb-4 max-w-xl'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by course name or code...'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            />
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                            {/* View toggle */}
                            <div className='flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Grid view'
                                >
                                    <Grid3x3 className='w-4 h-4' />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Table view'
                                >
                                    <List className='w-4 h-4' />
                                </button>
                            </div>

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value='createdAt'>Sort by Date</option>
                                <option value='name'>Sort by Name</option>
                            </select>

                            {/* Sort Order */}
                            <button
                                onClick={() =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    )
                                }
                                className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                title={
                                    sortOrder === 'asc'
                                        ? 'Ascending'
                                        : 'Descending'
                                }
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className='w-4 h-4' />
                                ) : (
                                    <SortDesc className='w-4 h-4' />
                                )}
                            </button>

                            {/* Clear Filters (shows when search active) */}
                            {search.trim().length > 0 && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setPage(1);
                                    }}
                                    className='inline-flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    title='Clear filters'
                                >
                                    <X className='w-4 h-4' />
                                    Clear
                                </button>
                            )}
                        </div>
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
                                    {current.map((course) => (
                                        <div
                                            key={course._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                        >
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                                                {course.courseName}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                Code: {course.courseCode}
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300 mb-3'>
                                                Total Branches:{' '}
                                                <Link
                                                    to={`/reports/branches?search=&page=1&pageSize=12&course=${course._id}`}
                                                >
                                                    {course.totalBranch || 0}
                                                </Link>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4'>
                                                <Calendar className='w-4 h-4' />
                                                {course.createdAt
                                                    ? new Date(
                                                          course.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                            <div className='flex gap-2 justify-end'>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(course)
                                                    }
                                                    className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(course)
                                                    }
                                                    className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700'
                                                >
                                                    Delete
                                                </button>
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
                                                        Course Name
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Course Code
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Total Branches
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-6 py-3'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((course) => (
                                                    <tr
                                                        key={course._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {course.courseName}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {course.courseCode}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            <Link
                                                                to={`/reports/branches?search=&page=1&pageSize=12&course=${course._id}`}
                                                                className='text-blue-500'
                                                            >
                                                                {course.totalBranch ||
                                                                    0}
                                                            </Link>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            <div className='flex flex-col'>
                                                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                                    {course.createdAt
                                                                        ? new Date(
                                                                              course.createdAt,
                                                                          ).toLocaleDateString()
                                                                        : 'N/A'}
                                                                </span>
                                                                <span className='font-medium'>
                                                                    {course.clickCounts ||
                                                                        0}{' '}
                                                                    views
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right'>
                                                            <div className='inline-flex gap-2'>
                                                                <button
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            course,
                                                                        )
                                                                    }
                                                                    className='px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            course,
                                                                        )
                                                                    }
                                                                    className='px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700'
                                                                >
                                                                    Delete
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
                            <GraduationCap className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Courses Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No courses match your current search.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Course Modal */}
            {showModal && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                        <div
                            className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
                            onClick={handleCloseModal}
                        ></div>
                        <span
                            className='hidden sm:inline-block sm:align-middle sm:h-screen'
                            aria-hidden='true'
                        >
                            &#8203;
                        </span>
                        <div className='inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10'>
                            <form onSubmit={handleSubmit}>
                                <div className='bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                            {editingCourse
                                                ? 'Edit Course'
                                                : 'Add New Course'}
                                        </h3>
                                        <button
                                            type='button'
                                            onClick={handleCloseModal}
                                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        >
                                            <X className='w-5 h-5' />
                                        </button>
                                    </div>
                                    <div className='space-y-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Course Name
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.courseName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        courseName:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter course name'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Course Code
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.courseCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        courseCode:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter course code'
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : editingCourse
                                              ? 'Update'
                                              : 'Create'}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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

export default Courses;
