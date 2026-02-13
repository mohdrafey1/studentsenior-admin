import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BookOpen, Calendar, BookMarked, Sparkles, Plus } from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusModal from '../../components/SyllabusModal';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import AddSubjectModal from '../../components/AddSubjectModal';

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
    const [timeFilter, setTimeFilter] = useState('');
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
        const tf = params.get('timeFilter') || '';
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
        setTimeFilter(tf);
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
        params.set('timeFilter', timeFilter || '');
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
        timeFilter,
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

    const handleEdit = (subject) => {
        setEditingSubject(subject);
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

    // Handler for batch updating multiple form fields at once (used by AI auto-fill)
    const handleSyllabusBatchUpdate = (updates) => {
        setSyllabusFormData((prev) => ({ ...prev, ...updates }));
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
            // Apply time filter
            .filter((s) => filterByTime(s, timeFilter))
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
        timeFilter,
        sortBy,
        sortOrder,
    ]);

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
                className={`py-4 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6'>
                    {/* Header */}
                    <div className='flex items-center justify-between'>
                        <BackButton title='Subjects' TitleIcon={BookOpen} />

                        <button
                            onClick={() => setShowModal(true)}
                            className='inline-flex mb-3 items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            <Plus className='w-4 h-4 mr-2' />
                            Add Subject
                        </button>
                    </div>

                    {/* Compact Filters */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            searchPlaceholder='Search by subject name, code, course, branch, or semester...'
                            filters={[
                                {
                                    label: 'College',
                                    value: filterCollege,
                                    onChange: setFilterCollege,
                                    options: [
                                        { value: '', label: 'All Colleges' },
                                        ...colleges.map((c) => ({
                                            value: c._id,
                                            label: c.slug,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Course',
                                    value: filterCourse,
                                    onChange: (v) => {
                                        setFilterCourse(v);
                                        setFilterBranch('');
                                    },
                                    options: [
                                        { value: '', label: 'All Courses' },
                                        ...courses.map((c) => ({
                                            value: c._id,
                                            label: c.courseCode,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Branch',
                                    value: filterBranch,
                                    onChange: setFilterBranch,
                                    options: [
                                        { value: '', label: 'All Branches' },
                                        ...(filterCourse
                                            ? branches.filter(
                                                  (b) =>
                                                      (b.course?._id || '') ===
                                                      filterCourse,
                                              )
                                            : branches
                                        ).map((b) => ({
                                            value: b._id,
                                            label: b.branchCode,
                                        })),
                                    ],
                                },
                                {
                                    label: 'Semester',
                                    value: filterSemester,
                                    onChange: setFilterSemester,
                                    options: [
                                        { value: '', label: 'All Semesters' },
                                        ...[1, 2, 3, 4, 5, 6, 7, 8].map(
                                            (sem) => ({
                                                value: String(sem),
                                                label: `Semester ${sem}`,
                                            }),
                                        ),
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
                                        value: 'name',
                                        label: 'Sort by Name',
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
                            onClear={() => {
                                setSearch('');
                                setFilterCollege('');
                                setFilterCourse('');
                                setFilterBranch('');
                                setFilterSemester('');
                                setTimeFilter('');
                                setPage(1);
                            }}
                            showClear={
                                !!(
                                    search ||
                                    filterCollege ||
                                    filterCourse ||
                                    filterBranch ||
                                    filterSemester ||
                                    timeFilter
                                )
                            }
                        />
                    </div>

                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-3 py-2 rounded mb-3'>
                            {error}
                        </div>
                    )}

                    {/* Grid/Table Views */}
                    {current.length > 0 ? (
                        <>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3'>
                                    {current.map((subject) => (
                                        <div
                                            key={subject._id}
                                            className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'
                                        >
                                            <div className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
                                                {subject.subjectName}
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                                Code: {subject.subjectCode}
                                            </div>
                                            <div className='text-xs text-gray-700 dark:text-gray-300'>
                                                College:{' '}
                                                <span className='font-semibold'>
                                                    {subject.college?.slug ||
                                                        'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-xs text-gray-700 dark:text-gray-300'>
                                                Course:{' '}
                                                <span className='font-semibold'>
                                                    {subject.course
                                                        ?.courseCode || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-xs text-gray-700 dark:text-gray-300'>
                                                Branch:{' '}
                                                <span className='font-semibold'>
                                                    {subject.branch
                                                        ?.branchCode || 'N/A'}
                                                </span>
                                            </div>
                                            <div className='text-xs text-gray-700 dark:text-gray-300 mb-3'>
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
                                                {subject.syllabi &&
                                                    subject.syllabi.length >
                                                        0 && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/reports/subjects/${subject._id}/quick-notes`,
                                                                )
                                                            }
                                                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700'
                                                            title='Quick Notes'
                                                        >
                                                            <Sparkles className='w-3 h-3' />
                                                            Q Notes
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
                                <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-900'>
                                                <tr>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Subject Name
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Subject Code
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        College
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Course
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Branch
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Semester
                                                    </th>
                                                    <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Created
                                                    </th>
                                                    <th className='px-3 py-2'></th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {current.map((subject) => (
                                                    <tr
                                                        key={subject._id}
                                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    >
                                                        <td className='px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                                            {
                                                                subject.subjectName
                                                            }
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white'>
                                                            {
                                                                subject.subjectCode
                                                            }
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white'>
                                                            {subject.college
                                                                ?.slug || 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white'>
                                                            {subject.course
                                                                ?.courseCode ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white'>
                                                            {subject.branch
                                                                ?.branchCode ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white'>
                                                            Sem{' '}
                                                            {subject.semester ||
                                                                'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400'>
                                                            {subject.createdAt
                                                                ? new Date(
                                                                      subject.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td className='px-3 py-2 whitespace-nowrap text-sm text-right'>
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
                                                                {subject.syllabi &&
                                                                    subject
                                                                        .syllabi
                                                                        .length >
                                                                        0 && (
                                                                        <button
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/reports/subjects/${subject._id}/quick-notes`,
                                                                                )
                                                                            }
                                                                            className='px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 inline-flex items-center gap-1'
                                                                            title='Quick Notes'
                                                                        >
                                                                            <Sparkles className='w-3 h-3' />
                                                                            Q
                                                                            Notes
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
            <AddSubjectModal
                showModal={showModal}
                editingSubject={editingSubject}
                colleges={colleges}
                courses={courses}
                branches={branches}
                onClose={handleCloseModal}
                onSuccess={fetchData}
            />

            {/* Syllabus Modal */}
            <SyllabusModal
                showModal={showSyllabusModal}
                selectedSubject={selectedSubjectForSyllabus}
                formData={syllabusFormData}
                submitting={submittingSyllabus}
                onClose={handleCloseSyllabusModal}
                onSubmit={handleSubmitSyllabus}
                onFormChange={handleSyllabusFormChange}
                onBatchUpdate={handleSyllabusBatchUpdate}
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
