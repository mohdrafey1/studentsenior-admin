import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BookMarked,
    BookOpen,
    CheckCircle2,
    CircleDashed,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatNumber } from '../../utils/format';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SyllabusModal from '../../components/SyllabusModal';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import AddSubjectModal from '../../components/AddSubjectModal';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import {
    SEMESTERS,
    SORT_OPTIONS,
    hasSyllabus,
    hasTimeFilter,
    quickNotesPath,
    sortCatalog,
    syllabusPath,
} from './catalogUtils';

// The three cards above the list; they filter by syllabus.
const VIEWS = [
    { value: '', label: 'All subjects', dot: 'bg-neutral' },
    {
        value: 'ready',
        label: 'Syllabus ready',
        dot: 'bg-ok',
        note: 'Quick notes can be generated',
    },
    {
        value: 'missing',
        label: 'No syllabus',
        dot: 'bg-warn',
        note: 'Add one to unlock quick notes',
    },
];

const matchesView = (subject, view) =>
    !view || (view === 'ready' ? hasSyllabus(subject) : !hasSyllabus(subject));

const branchLine = (subject) =>
    [subject.course?.courseCode, subject.branch?.branchCode]
        .filter(Boolean)
        .join(' · ') || 'No branch';

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
    const [filterSyllabus, setFilterSyllabus] = useState(''); // '' | 'ready' | 'missing'
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
    const navigate = useNavigate();
    const location = useLocation();

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        onConfirm: null,
        variant: 'danger',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title,
                message: config.message,
                confirmText: config.confirmText || 'Delete',
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
            setError(
                'Couldn’t load subjects. Check your connection and try again.',
            );
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
        const fsy = params.get('syllabus') || '';
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
        setFilterSyllabus(fsy === 'ready' || fsy === 'missing' ? fsy : '');
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
        if (filterSyllabus) params.set('syllabus', filterSyllabus);
        else params.delete('syllabus');
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
        filterSyllabus,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setShowModal(true);
    };

    const handleDelete = async (subject) => {
        const ok = await showConfirm({
            title: `Delete ${subject.subjectName}?`,
            message:
                'Students can no longer find it, and PYQs and notes linked to it lose their subject. This can’t be undone.',
            confirmText: 'Delete subject',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/subjects/${subject._id}`);
            setSubjects(subjects.filter((s) => s._id !== subject._id));
            toast.success('Subject deleted');
        } catch (e) {
            console.error(e);
            toast.error('Couldn’t delete the subject. Try again.');
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
            toast.success('Syllabus created');
            handleCloseSyllabusModal();
            fetchData(); // Refresh to get updated data
        } catch (e) {
            console.error(e);
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t create the syllabus. Try again.',
            );
        } finally {
            setSubmittingSyllabus(false);
        }
    };

    // Everything except the syllabus cards, so their counts follow the other filters.
    const base = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (
            subjects
                .filter((s) => {
                    const matchesSearch =
                        !q ||
                        s.subjectName?.toLowerCase().includes(q) ||
                        s.subjectCode?.toLowerCase().includes(q) ||
                        s.course?.courseName?.toLowerCase().includes(q) ||
                        s.branch?.branchName?.toLowerCase().includes(q) ||
                        s.semester?.toString().includes(q);
                    const matchesCollege =
                        !filterCollege ||
                        (s.college?._id || '') === filterCollege;
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
        );
    }, [
        subjects,
        search,
        filterCollege,
        filterCourse,
        filterBranch,
        filterSemester,
        timeFilter,
    ]);

    const filteredAndSorted = useMemo(
        () =>
            sortCatalog(
                base.filter((s) => matchesView(s, filterSyllabus)),
                sortBy,
                sortOrder,
                'subjectName',
            ),
        [base, filterSyllabus, sortBy, sortOrder],
    );

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    if (loading) {
        return <Loader />;
    }

    const viewCounts = {
        '': base.length,
        ready: base.filter(hasSyllabus).length,
        missing: base.filter((s) => !hasSyllabus(s)).length,
    };
    const collegeCount = new Set(
        base.map((s) => s.college?._id).filter(Boolean),
    ).size;

    const filtersActive = Boolean(
        search ||
            filterCollege ||
            filterCourse ||
            filterBranch ||
            filterSemester ||
            hasTimeFilter(timeFilter),
    );
    const clearFilters = () => {
        setSearch('');
        setFilterCollege('');
        setFilterCourse('');
        setFilterBranch('');
        setFilterSemester('');
        setTimeFilter('');
        setPage(1);
    };
    const setFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const syllabusStatus = (subject) => {
        if (!hasSyllabus(subject)) {
            return (
                <span className='inline-flex items-center gap-1.5 text-[13px] text-warn-ink whitespace-nowrap'>
                    <CircleDashed
                        className='w-3.5 h-3.5 shrink-0'
                        aria-hidden='true'
                    />
                    Missing
                </span>
            );
        }
        const path = syllabusPath(subject);
        const body = (
            <>
                <CheckCircle2
                    className='w-3.5 h-3.5 shrink-0'
                    aria-hidden='true'
                />
                Ready
            </>
        );
        return path ? (
            <Link
                to={path}
                className='inline-flex items-center gap-1.5 text-[13px] text-ok-ink hover:underline whitespace-nowrap'
                aria-label={`Syllabus ready for ${subject.subjectName}, open it`}
            >
                {body}
            </Link>
        ) : (
            <span className='inline-flex items-center gap-1.5 text-[13px] text-ok-ink whitespace-nowrap'>
                {body}
            </span>
        );
    };

    const rowActions = (subject) => (
        <>
            {hasSyllabus(subject) ? (
                <Button
                    size='sm'
                    icon={Sparkles}
                    to={quickNotesPath(subject)}
                    aria-label={`Quick notes for ${subject.subjectName}`}
                >
                    Quick notes
                </Button>
            ) : (
                <Button
                    size='sm'
                    icon={BookMarked}
                    onClick={() => handleAddSyllabus(subject)}
                    aria-label={`Add syllabus for ${subject.subjectName}`}
                >
                    Add syllabus
                </Button>
            )}
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Pencil}
                aria-label={`Edit ${subject.subjectName}`}
                onClick={() => handleEdit(subject)}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Trash2}
                aria-label={`Delete ${subject.subjectName}`}
                className='text-bad-ink hover:text-bad-ink'
                onClick={() => handleDelete(subject)}
            />
        </>
    );

    const empty = (
        <EmptyState
            icon={BookOpen}
            tone={
                filterSyllabus === 'missing' && !filtersActive && base.length
                    ? 'done'
                    : 'neutral'
            }
            title={
                subjects.length === 0
                    ? 'No subjects yet'
                    : filterSyllabus === 'missing' &&
                        !filtersActive &&
                        base.length
                      ? 'Every subject has a syllabus'
                      : 'No subjects match'
            }
            description={
                subjects.length === 0
                    ? 'Subjects you add, or import from a branch, appear here.'
                    : filterSyllabus === 'missing' && !filtersActive
                      ? undefined
                      : 'Try another search or clear the filters.'
            }
            action={
                filtersActive ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const pagination = (
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
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Subjects'
                description='Every subject across colleges, and whether it has a syllabus yet.'
                actions={
                    <Button
                        variant='primary'
                        icon={Plus}
                        onClick={() => {
                            setEditingSubject(null);
                            setShowModal(true);
                        }}
                    >
                        Add subject
                    </Button>
                }
            />

            <div
                role='group'
                aria-label='Show'
                className='grid grid-cols-3 gap-2 sm:gap-3 mb-5'
            >
                {VIEWS.map((view) => {
                    const pressed = filterSyllabus === view.value;
                    return (
                        <button
                            key={view.value || 'all'}
                            type='button'
                            aria-pressed={pressed}
                            onClick={() => {
                                setFilterSyllabus(view.value);
                                setPage(1);
                            }}
                            className={`flex flex-col gap-1.5 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border bg-sheet text-left cursor-pointer transition-colors ${
                                pressed
                                    ? 'border-brand ring-1 ring-brand'
                                    : 'border-line hover:border-line-strong'
                            }`}
                        >
                            <span className='flex items-center gap-2 text-[12.5px] sm:text-[13px] text-ink-2 leading-tight'>
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${view.dot}`}
                                    aria-hidden='true'
                                />
                                {view.label}
                            </span>
                            <span className='font-serif font-bold text-[22px] sm:text-[26px] leading-none text-ink'>
                                {formatNumber(viewCounts[view.value])}
                            </span>
                            <span className='hidden sm:block text-[12.5px] text-muted'>
                                {view.note ||
                                    `Across ${collegeCount} college${collegeCount === 1 ? '' : 's'}`}
                            </span>
                        </button>
                    );
                })}
            </div>

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={setFilter(setSearch)}
                searchPlaceholder='Search by subject, code, course, branch or semester'
                filters={[
                    {
                        label: 'College',
                        value: filterCollege,
                        onChange: setFilter(setFilterCollege),
                        options: [
                            { value: '', label: 'Any college' },
                            ...colleges.map((c) => ({
                                value: c._id,
                                label: c.name || c.slug,
                            })),
                        ],
                    },
                    {
                        label: 'Course',
                        value: filterCourse,
                        onChange: (v) => {
                            setFilterCourse(v);
                            setFilterBranch('');
                            setPage(1);
                        },
                        options: [
                            { value: '', label: 'Any course' },
                            ...courses.map((c) => ({
                                value: c._id,
                                label: c.courseCode,
                            })),
                        ],
                    },
                    {
                        label: 'Branch',
                        value: filterBranch,
                        onChange: setFilter(setFilterBranch),
                        options: [
                            { value: '', label: 'Any branch' },
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
                        onChange: setFilter(setFilterSemester),
                        options: [
                            { value: '', label: 'Any semester' },
                            ...SEMESTERS.map((sem) => ({
                                value: String(sem),
                                label: `Semester ${sem}`,
                            })),
                        ],
                    },
                ]}
                timeFilter={{
                    value: timeFilter,
                    onChange: setFilter(setTimeFilter),
                }}
                sortBy={{
                    value: sortBy,
                    onChange: setSortBy,
                    options: SORT_OPTIONS,
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                viewMode={{
                    value: viewMode,
                    onChange: setViewMode,
                }}
                onClear={clearFilters}
                showClear={filtersActive}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchData}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {current.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={1040}>
                            <thead>
                                <tr>
                                    <Th>Subject</Th>
                                    <Th>College · branch</Th>
                                    <Th>Sem</Th>
                                    <Th>Syllabus</Th>
                                    <Th>Added</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((subject) => (
                                    <Tr key={subject._id}>
                                        <Td className='max-w-[300px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <span className='font-medium text-ink truncate'>
                                                    {subject.subjectName}
                                                </span>
                                                <code className='font-mono text-[12px] text-muted'>
                                                    {subject.subjectCode}
                                                </code>
                                            </div>
                                        </Td>
                                        <Td className='max-w-[240px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <span className='truncate'>
                                                    {subject.college?.name ||
                                                        subject.college?.slug ||
                                                        'No college'}
                                                </span>
                                                <span className='text-[12.5px] text-muted truncate'>
                                                    {branchLine(subject)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td mono>{subject.semester || '—'}</Td>
                                        <Td>{syllabusStatus(subject)}</Td>
                                        <Td className='text-ink-2 whitespace-nowrap'>
                                            {formatDate(subject.createdAt)}
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end items-center gap-1'>
                                                {rowActions(subject)}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='px-4 py-3 border-t border-line-soft'>
                            {pagination}
                        </div>
                    )}
                </div>
            ) : current.length === 0 ? (
                <div className='bg-sheet border border-line rounded-xl'>
                    {empty}
                </div>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {current.map((subject) => (
                            <article
                                key={subject._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <span className='font-medium text-ink'>
                                            {subject.subjectName}
                                        </span>
                                        <span className='text-[12.5px] text-muted truncate'>
                                            <code className='font-mono'>
                                                {subject.subjectCode}
                                            </code>
                                            {subject.semester &&
                                                ` · Sem ${subject.semester}`}
                                        </span>
                                    </div>
                                    {syllabusStatus(subject)}
                                </div>
                                <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                    <span>
                                        {subject.college?.name ||
                                            subject.college?.slug ||
                                            'No college'}
                                    </span>
                                    <span>{branchLine(subject)}</span>
                                    <span>
                                        Added {formatDate(subject.createdAt)}
                                    </span>
                                </div>
                                <div className='flex flex-wrap items-center justify-end gap-1 pt-3 border-t border-line-soft'>
                                    {rowActions(subject)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

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
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default Subjects;
