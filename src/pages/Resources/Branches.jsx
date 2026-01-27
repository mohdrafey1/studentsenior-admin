import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    Building,
    ArrowLeft,
    Search,
    Plus,
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
import Loader from '../../components/Common/Loader';
import BackButton from '../../components/Common/BackButton';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [filterCourse, setFilterCourse] = useState('');
    const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'name'
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        branchName: '',
        branchCode: '',
        course: '',
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

    const fetchData = async () => {
        try {
            setError(null);
            const [branchesRes, coursesRes] = await Promise.all([
                api.get('/resource/branches'),
                api.get('/resource/courses'),
            ]);
            setBranches(branchesRes.data.data || []);
            setCourses(coursesRes.data.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load data');
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('search') || '';
        const p = parseInt(params.get('page') || '1', 10);
        const ps = parseInt(params.get('pageSize') || '12', 10);
        const fc = params.get('course') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterCourse(fc);
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
        params.set('course', filterCourse || '');
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
        filterCourse,
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
        if (
            !formData.branchName.trim() ||
            !formData.branchCode.trim() ||
            !formData.course
        ) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingBranch) {
                await api.put(
                    `/resource/branches/${editingBranch._id}`,
                    formData,
                );
                toast.success('Branch updated successfully');
                fetchData(); // Refresh to get updated data
            } else {
                await api.post('/resource/branches', formData);
                toast.success('Branch created successfully');
                fetchData(); // Refresh to get updated data
            }
            handleCloseModal();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            branchName: branch.branchName,
            branchCode: branch.branchCode,
            course: branch.course?._id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (branch) => {
        const ok = await showConfirm({
            title: 'Delete Branch',
            message: `Are you sure you want to delete "${branch.branchName}"? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/branches/${branch._id}`);
            setBranches(branches.filter((b) => b._id !== branch._id));
            toast.success('Branch deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete branch');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBranch(null);
        setFormData({ branchName: '', branchCode: '', course: '' });
    };

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = branches
            .filter((b) => {
                const matchesSearch =
                    !q ||
                    b.branchName?.toLowerCase().includes(q) ||
                    b.branchCode?.toLowerCase().includes(q) ||
                    b.course?.courseName?.toLowerCase().includes(q);
                const matchesCourse =
                    !filterCourse || (b.course?._id || '') === filterCourse;
                return matchesSearch && matchesCourse;
            })
            .sort((a, b) => {
                if (sortBy === 'createdAt') {
                    const aVal = new Date(a.createdAt || 0).getTime();
                    const bVal = new Date(b.createdAt || 0).getTime();
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                } else {
                    const aVal = (a.branchName || '').toLowerCase();
                    const bVal = (b.branchName || '').toLowerCase();
                    const cmp = aVal.localeCompare(bVal);
                    return sortOrder === 'asc' ? cmp : -cmp;
                }
            });
        return list;
    }, [branches, search, filterCourse, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

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
                    {/* Header */}
                    <BackButton title='Branches' TitleIcon={Building} />

                    {/* Search, Filters, View & Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        <div className='relative mb-4 max-w-xl'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by branch name, code, or course...'
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

                            {/* Course Filter */}
                            <select
                                value={filterCourse}
                                onChange={(e) =>
                                    setFilterCourse(e.target.value)
                                }
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Courses</option>
                                {courses.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.courseCode}
                                    </option>
                                ))}
                            </select>

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

                            {/* Clear Filters (shows when search or course filter active) */}
                            {(search.trim().length > 0 || filterCourse) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterCourse('');
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
                                    {current.map((branch) => (
                                        <div
                                            key={branch._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                        >
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                                                {branch.branchName}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                Code: {branch.branchCode}
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                Course:{' '}
                                                <span className='font-semibold'>
                                                    {branch.course
                                                        ?.courseName || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300 mb-3'>
                                                Total Subjects:{' '}
                                                <Link
                                                    to={`/reports/subjects?search=&page=1&pageSize=12&course=&branch=${branch._id}`}
                                                >
                                                    {branch.totalSubject || 0}
                                                </Link>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4'>
                                                <Calendar className='w-4 h-4' />
                                                {branch.createdAt
                                                    ? new Date(
                                                          branch.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                            <div className='flex gap-2 justify-end'>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(branch)
                                                    }
                                                    className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(branch)
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
                                                        Branch Name
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Branch Code
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Course
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Total Subjects
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-6 py-3'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((branch) => (
                                                    <tr
                                                        key={branch._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {branch.branchName}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {branch.branchCode}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {branch.course
                                                                ?.courseName ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            <Link
                                                                to={`/reports/subjects?search=&page=1&pageSize=12&course=&branch=${branch._id}`}
                                                                className='text-blue-600 hover:underline'
                                                            >
                                                                {branch.totalSubject ||
                                                                    0}
                                                            </Link>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            <div className='flex flex-col'>
                                                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                                    {branch.createdAt
                                                                        ? new Date(
                                                                              branch.createdAt,
                                                                          ).toLocaleDateString()
                                                                        : 'N/A'}
                                                                </span>
                                                                <span className='font-medium'>
                                                                    {branch.clickCounts ||
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
                                                                            branch,
                                                                        )
                                                                    }
                                                                    className='px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            branch,
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
                            <Building className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Branches Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No branches match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Branch Modal */}
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
                                            {editingBranch
                                                ? 'Edit Branch'
                                                : 'Add New Branch'}
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
                                                Branch Name
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.branchName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        branchName:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter branch name'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Branch Code
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.branchCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        branchCode:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter branch code'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Course
                                            </label>
                                            <select
                                                value={formData.course}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        course: e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                required
                                            >
                                                <option value=''>
                                                    Select a course
                                                </option>
                                                {courses.map((course) => (
                                                    <option
                                                        key={course._id}
                                                        value={course._id}
                                                    >
                                                        {course.courseName} (
                                                        {course.courseCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : editingBranch
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

export default Branches;
