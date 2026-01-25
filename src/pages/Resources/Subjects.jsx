import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    BookOpen,
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
    BookMarked,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusModal from '../../components/SyllabusModal';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [filterCollege, setFilterCollege] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'name'
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [showSyllabusModal, setShowSyllabusModal] = useState(false);
    const [selectedSubjectForSyllabus, setSelectedSubjectForSyllabus] =
        useState(null);
    const [syllabusFormData, setSyllabusFormData] = useState({
        subjectCode: '',
        year: 1,
        semester: 1,
        units: [
            {
                unitNumber: 1,
                title: '',
                content: '',
            },
        ],
        referenceBooks: '',
        description: '',
    });
    const [submittingSyllabus, setSubmittingSyllabus] = useState(false);
    const [formData, setFormData] = useState({
        subjectName: '',
        subjectCode: '',
        course: '',
        branch: '',
        semester: '',
        college: '',
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
            const [subjectsRes, coursesRes, branchesRes, collegesRes] =
                await Promise.all([
                    api.get('/resource/subjects'),
                    api.get('/resource/courses'),
                    api.get('/resource/branches'),
                    api.get('/college'),
                ]);
            setSubjects(subjectsRes.data.data || []);
            setCourses(coursesRes.data.data || []);
            setBranches(branchesRes.data.data || []);
            setColleges(collegesRes.data.data || []);
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
        const fco = params.get('college') || '';
        const fc = params.get('course') || '';
        const fb = params.get('branch') || '';
        const fs = params.get('semester') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterCollege(fco);
        setFilterCourse(fc);
        setFilterBranch(fb);
        setFilterSemester(fs);
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
        params.set('college', filterCollege || '');
        params.set('course', filterCourse || '');
        params.set('branch', filterBranch || '');
        params.set('semester', filterSemester || '');
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
        filterCollege,
        filterCourse,
        filterBranch,
        filterSemester,
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

    // Filter branches based on selected course
    const filteredBranches = branches.filter(
        (branch) => !formData.course || branch.course?._id === formData.course,
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !formData.subjectName.trim() ||
            !formData.subjectCode.trim() ||
            !formData.course ||
            !formData.branch ||
            !formData.semester
        ) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingSubject) {
                await api.put(
                    `/resource/subjects/${editingSubject._id}`,
                    formData,
                );
                toast.success('Subject updated successfully');
                fetchData(); // Refresh to get updated data
            } else {
                await api.post('/resource/subjects', formData);
                toast.success('Subject created successfully');
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

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            course: subject.course?._id || '',
            branch: subject.branch?._id || '',
            semester: subject.semester || '',
            college: subject.college?._id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (subject) => {
        const ok = await showConfirm({
            title: 'Delete Subject',
            message: `Are you sure you want to delete "${subject.subjectName}"? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/subjects/${subject._id}`);
            setSubjects(subjects.filter((s) => s._id !== subject._id));
            toast.success('Subject deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete subject');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSubject(null);
        setFormData({
            subjectName: '',
            subjectCode: '',
            course: '',
            branch: '',
            semester: '',
            college: '',
        });
    };

    const handleCourseChange = (courseId) => {
        setFormData({ ...formData, course: courseId, branch: '' }); // Reset branch when course changes
    };

    // Syllabus handlers
    const handleAddSyllabus = (subject) => {
        setSelectedSubjectForSyllabus(subject);
        setSyllabusFormData({
            subjectCode: subject.subjectCode,
            year: Math.ceil(subject.semester / 2) || 1,
            semester: subject.semester,
            units: [
                {
                    unitNumber: 1,
                    title: '',
                    content: '',
                },
            ],
            referenceBooks: '',
            description: '',
        });
        setShowSyllabusModal(true);
    };

    const handleSyllabusFormChange = (field, value) => {
        setSyllabusFormData({ ...syllabusFormData, [field]: value });
    };

    const handleUnitChange = (index, field, value) => {
        const newUnits = [...syllabusFormData.units];
        newUnits[index][field] = value;
        setSyllabusFormData({ ...syllabusFormData, units: newUnits });
    };

    const addArrayItem = (arrayName) => {
        if (arrayName === 'units') {
            setSyllabusFormData({
                ...syllabusFormData,
                units: [
                    ...syllabusFormData.units,
                    {
                        unitNumber: syllabusFormData.units.length + 1,
                        title: '',
                        content: '',
                    },
                ],
            });
        } else {
            setSyllabusFormData({
                ...syllabusFormData,
                [arrayName]: [...syllabusFormData[arrayName], ''],
            });
        }
    };

    const removeArrayItem = (arrayName, index) => {
        const newArray = syllabusFormData[arrayName].filter(
            (_, i) => i !== index,
        );
        setSyllabusFormData({ ...syllabusFormData, [arrayName]: newArray });
    };

    const handleCloseSyllabusModal = () => {
        setShowSyllabusModal(false);
        setSelectedSubjectForSyllabus(null);
        setSyllabusFormData({
            subjectCode: '',
            year: 1,
            semester: 1,
            units: [
                {
                    unitNumber: 1,
                    title: '',
                    content: '',
                },
            ],
            referenceBooks: '',
            description: '',
        });
    };

    const handleSubmitSyllabus = async (e) => {
        e.preventDefault();

        setSubmittingSyllabus(true);
        try {
            // Always send the subject's college slug as collegeSlug
            const collegeSlug = selectedSubjectForSyllabus?.college?.slug;
            await api.post(`/syllabus/create`, {
                ...syllabusFormData,
                collegeSlug,
            });
            toast.success('Syllabus created successfully');
            handleCloseSyllabusModal();
            fetchData(); // Refresh to get updated data
        } catch (e) {
            console.error(e);
            toast.error(
                e.response?.data?.message || 'Failed to create syllabus',
            );
        } finally {
            setSubmittingSyllabus(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = subjects
            .filter((s) => {
                const matchesSearch =
                    !q ||
                    s.subjectName?.toLowerCase().includes(q) ||
                    s.subjectCode?.toLowerCase().includes(q) ||
                    s.course?.courseName?.toLowerCase().includes(q) ||
                    s.branch?.branchName?.toLowerCase().includes(q) ||
                    s.semester?.toString().includes(q);
                const matchesCollege =
                    !filterCollege || (s.college?._id || '') === filterCollege;
                const matchesCourse =
                    !filterCourse || (s.course?._id || '') === filterCourse;
                const matchesBranch =
                    !filterBranch || (s.branch?._id || '') === filterBranch;
                const matchesSemester =
                    !filterSemester ||
                    String(s.semester || '') === String(filterSemester);
                return (
                    matchesSearch &&
                    matchesCollege &&
                    matchesCourse &&
                    matchesBranch &&
                    matchesSemester
                );
            })
            .sort((a, b) => {
                if (sortBy === 'createdAt') {
                    const aVal = new Date(a.createdAt || 0).getTime();
                    const bVal = new Date(b.createdAt || 0).getTime();
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                } else {
                    const aVal = (a.subjectName || '').toLowerCase();
                    const bVal = (b.subjectName || '').toLowerCase();
                    const cmp = aVal.localeCompare(bVal);
                    return sortOrder === 'asc' ? cmp : -cmp;
                }
            });
        return list;
    }, [
        subjects,
        search,
        filterCollege,
        filterCourse,
        filterBranch,
        filterSemester,
        sortBy,
        sortOrder,
    ]);

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
                            Loading subjects...
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
                                <div className='bg-blue-600 text-white p-3 rounded-lg mr-4'>
                                    <BookOpen className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Subjects
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage course subjects
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            Add Subject
                        </button>
                    </div>

                    {/* Search, Filters, View & Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        <div className='relative mb-4 max-w-xl'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by subject name, code, course, branch, or semester...'
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

                            {/* College Filter */}
                            <select
                                value={filterCollege}
                                onChange={(e) => {
                                    setFilterCollege(e.target.value);
                                }}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Colleges</option>
                                <option value='dr-apj-abdul-kalam-technical-university-aktu'>
                                    Dr. APJ Abdul Kalam Technical University
                                </option>
                                <option value='integral-university'>
                                    Integral University
                                </option>
                                {colleges.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.slug}
                                    </option>
                                ))}
                            </select>

                            {/* Course Filter */}
                            <select
                                value={filterCourse}
                                onChange={(e) => {
                                    setFilterCourse(e.target.value);
                                    setFilterBranch('');
                                }}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Courses</option>
                                {courses.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.courseCode}
                                    </option>
                                ))}
                            </select>

                            {/* Branch Filter (depends on course, but allow all when no course) */}
                            <select
                                value={filterBranch}
                                onChange={(e) =>
                                    setFilterBranch(e.target.value)
                                }
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Branches</option>
                                {(filterCourse
                                    ? branches.filter(
                                          (b) =>
                                              (b.course?._id || '') ===
                                              filterCourse,
                                      )
                                    : branches
                                ).map((b) => (
                                    <option key={b._id} value={b._id}>
                                        {b.branchCode}
                                    </option>
                                ))}
                            </select>

                            {/* Semester Filter */}
                            <select
                                value={filterSemester}
                                onChange={(e) =>
                                    setFilterSemester(e.target.value)
                                }
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value=''>All Semesters</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                    <option key={sem} value={String(sem)}>
                                        Semester {sem}
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

                            {/* Clear Filters (shows when any filter active) */}
                            {(search.trim().length > 0 ||
                                filterCollege ||
                                filterCourse ||
                                filterBranch ||
                                filterSemester) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterCollege('');
                                        setFilterCourse('');
                                        setFilterBranch('');
                                        setFilterSemester('');
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
                                    {current.map((subject) => (
                                        <div
                                            key={subject._id}
                                            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'
                                        >
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                                                {subject.subjectName}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                Code: {subject.subjectCode}
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                College:{' '}
                                                <span className='font-semibold'>
                                                    {subject.college?.slug ||
                                                        'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                Course:{' '}
                                                <span className='font-semibold'>
                                                    {subject.course
                                                        ?.courseName || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300'>
                                                Branch:{' '}
                                                <span className='font-semibold'>
                                                    {subject.branch
                                                        ?.branchName || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-sm text-gray-700 dark:text-gray-300 mb-3'>
                                                Semester:{' '}
                                                <span className='font-semibold'>
                                                    {subject.semester || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4'>
                                                <Calendar className='w-4 h-4' />
                                                {subject.createdAt
                                                    ? new Date(
                                                          subject.createdAt,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </div>
                                            <div className='flex gap-2 justify-end'>
                                                {/* Only show Add Syllabus button if subject doesn't have syllabus */}
                                                {(!subject.syllabi ||
                                                    subject.syllabi.length ===
                                                        0) && (
                                                    <button
                                                        onClick={() =>
                                                            handleAddSyllabus(
                                                                subject,
                                                            )
                                                        }
                                                        className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700'
                                                        title='Add Syllabus'
                                                    >
                                                        <BookMarked className='w-3 h-3' />
                                                        Syllabus
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleEdit(subject)
                                                    }
                                                    className='inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(subject)
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
                                                        Subject Name
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Subject Code
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        College
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Course
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Branch
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Semester
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-6 py-3'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((subject) => (
                                                    <tr
                                                        key={subject._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {
                                                                subject.subjectName
                                                            }
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {
                                                                subject.subjectCode
                                                            }
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {subject.college
                                                                ?.slug || 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {subject.course
                                                                ?.courseName ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {subject.branch
                                                                ?.branchName ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            Semester{' '}
                                                            {subject.semester ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                            {subject.createdAt
                                                                ? new Date(
                                                                      subject.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right'>
                                                            <div className='inline-flex gap-2'>
                                                                {/* Only show Add Syllabus button if subject doesn't have syllabus */}
                                                                {(!subject.syllabi ||
                                                                    subject
                                                                        .syllabi
                                                                        .length ===
                                                                        0) && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleAddSyllabus(
                                                                                subject,
                                                                            )
                                                                        }
                                                                        className='px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1'
                                                                        title='Add Syllabus'
                                                                    >
                                                                        <BookMarked className='w-3 h-3' />
                                                                        Syllabus
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            subject,
                                                                        )
                                                                    }
                                                                    className='px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700'
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            subject,
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
                            <BookOpen className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Subjects Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No subjects match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Subject Modal */}
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
                                            {editingSubject
                                                ? 'Edit Subject'
                                                : 'Add New Subject'}
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
                                                Subject Name
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.subjectName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        subjectName:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter subject name'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Subject Code
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.subjectCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        subjectCode:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                placeholder='Enter subject code'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                College
                                            </label>
                                            <select
                                                value={formData.college}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        college: e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                required
                                            >
                                                <option value=''>
                                                    Select a college
                                                </option>
                                                <option value='dr-apj-abdul-kalam-technical-university-aktu'>
                                                    Dr. APJ Abdul Kalam
                                                    Technical University
                                                </option>
                                                <option value='integral-university'>
                                                    Integral University
                                                </option>
                                                {colleges.map((college) => (
                                                    <option
                                                        key={college._id}
                                                        value={college._id}
                                                    >
                                                        {college.name} (
                                                        {college.slug})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Course
                                            </label>
                                            <select
                                                value={formData.course}
                                                onChange={(e) =>
                                                    handleCourseChange(
                                                        e.target.value,
                                                    )
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
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Branch
                                            </label>
                                            <select
                                                value={formData.branch}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        branch: e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                required
                                                disabled={!formData.course}
                                            >
                                                <option value=''>
                                                    Select a branch
                                                </option>
                                                {filteredBranches.map(
                                                    (branch) => (
                                                        <option
                                                            key={branch._id}
                                                            value={branch._id}
                                                        >
                                                            {branch.branchName}{' '}
                                                            ({branch.branchCode}
                                                            )
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                                Semester
                                            </label>
                                            <select
                                                value={formData.semester}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        semester:
                                                            e.target.value,
                                                    })
                                                }
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                                required
                                            >
                                                <option value=''>
                                                    Select semester
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
                                        </div>
                                    </div>
                                </div>
                                <div className='bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : editingSubject
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

            {/* Syllabus Modal */}
            <SyllabusModal
                showModal={showSyllabusModal}
                selectedSubject={selectedSubjectForSyllabus}
                formData={syllabusFormData}
                submitting={submittingSyllabus}
                onClose={handleCloseSyllabusModal}
                onSubmit={handleSubmitSyllabus}
                onFormChange={handleSyllabusFormChange}
                onUnitChange={handleUnitChange}
                onAddArrayItem={addArrayItem}
                onRemoveArrayItem={removeArrayItem}
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

export default Subjects;
