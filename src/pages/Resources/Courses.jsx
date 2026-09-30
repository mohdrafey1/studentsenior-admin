import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    GitBranch,
    GraduationCap,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate, formatNumber } from '../../utils/format';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Common/Loader';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import {
    Alert,
    Button,
    Dialog,
    EmptyState,
    Field,
    Input,
    PageHeader,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import { SORT_OPTIONS, hasTimeFilter, sortCatalog } from './catalogUtils';

const branchesPath = (course) =>
    `/reports/branches?search=&page=1&pageSize=12&course=${course._id}`;

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'name'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
    const [timeFilter, setTimeFilter] = useState('');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        courseName: '',
        courseCode: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
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

    const fetchCourses = async () => {
        try {
            setError(null);
            const res = await api.get('/resource/courses');
            setCourses(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError(
                'Couldn’t load courses. Check your connection and try again.',
            );
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
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
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
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!formData.courseName.trim()) errors.courseName = 'Enter a name';
        if (!formData.courseCode.trim()) errors.courseCode = 'Enter a code';
        setFormErrors(errors);
        if (Object.keys(errors).length) return;

        setSubmitting(true);
        try {
            if (editingCourse) {
                await api.put(
                    `/resource/courses/${editingCourse._id}`,
                    formData,
                );
                toast.success('Course saved');
                setCourses(
                    courses.map((c) =>
                        c._id === editingCourse._id ? { ...c, ...formData } : c,
                    ),
                );
            } else {
                await api.post('/resource/courses', formData);
                toast.success('Course added');
                fetchCourses(); // Refresh to get updated data
            }
            handleCloseModal();
        } catch (e) {
            console.error(e);
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t save the course. Try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdd = () => {
        setEditingCourse(null);
        setFormData({ courseName: '', courseCode: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            courseName: course.courseName,
            courseCode: course.courseCode,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (course) => {
        const branchCount = course.totalBranch || 0;
        const ok = await showConfirm({
            title: `Delete ${course.courseName}?`,
            message: branchCount
                ? `Its ${formatNumber(branchCount)} branch${branchCount === 1 ? '' : 'es'} and every subject in them are deleted too. Students lose access straight away. This can’t be undone.`
                : 'Students lose access straight away. This can’t be undone.',
            confirmText: 'Delete course',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/courses/${course._id}`);
            setCourses(courses.filter((c) => c._id !== course._id));
            toast.success('Course deleted');
        } catch (e) {
            console.error(e);
            toast.error('Couldn’t delete the course. Try again.');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCourse(null);
        setFormData({ courseName: '', courseCode: '' });
        setFormErrors({});
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
            // Apply time filter
            .filter((c) => filterByTime(c, timeFilter));
        return sortCatalog(list, sortBy, sortOrder, 'courseName');
    }, [courses, search, timeFilter, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);
    const filtersActive = Boolean(search || hasTimeFilter(timeFilter));

    const clearFilters = () => {
        setSearch('');
        setTimeFilter('');
        setPage(1);
    };

    if (loading) {
        return <Loader />;
    }

    const rowActions = (course) => (
        <>
            <Button size='sm' icon={GitBranch} to={branchesPath(course)}>
                Branches
            </Button>
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Pencil}
                aria-label={`Edit ${course.courseName}`}
                onClick={() => handleEdit(course)}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Trash2}
                aria-label={`Delete ${course.courseName}`}
                className='text-bad-ink hover:text-bad-ink'
                onClick={() => handleDelete(course)}
            />
        </>
    );

    const empty = (
        <EmptyState
            icon={GraduationCap}
            title={courses.length === 0 ? 'No courses yet' : 'No courses match'}
            description={
                courses.length === 0
                    ? 'Courses you add appear here, with their branches.'
                    : 'Try another search or clear the filters.'
            }
            action={
                filtersActive ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : courses.length === 0 ? (
                    <Button variant='primary' icon={Plus} onClick={handleAdd}>
                        Add course
                    </Button>
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
                title='Courses'
                description='The courses that every branch, subject, PYQ and note belongs to.'
                actions={
                    <Button variant='primary' icon={Plus} onClick={handleAdd}>
                        Add course
                    </Button>
                }
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                searchPlaceholder='Search by course name or code'
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
                        <Button size='sm' onClick={fetchCourses}>
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
                        <Table minWidth={820}>
                            <thead>
                                <tr>
                                    <Th>Course</Th>
                                    <Th>Code</Th>
                                    <Th align='right'>Branches</Th>
                                    <Th align='right'>Views</Th>
                                    <Th>Added</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((course) => (
                                    <Tr key={course._id}>
                                        <Td className='font-medium max-w-[320px] truncate'>
                                            {course.courseName}
                                        </Td>
                                        <Td
                                            mono
                                            className='text-ink-2 whitespace-nowrap'
                                        >
                                            {course.courseCode}
                                        </Td>
                                        <Td align='right' mono>
                                            <Link
                                                to={branchesPath(course)}
                                                className='text-link hover:underline'
                                                aria-label={`${formatNumber(course.totalBranch)} branches in ${course.courseName}`}
                                            >
                                                {formatNumber(
                                                    course.totalBranch,
                                                )}
                                            </Link>
                                        </Td>
                                        <Td
                                            align='right'
                                            mono
                                            className='text-ink-2'
                                        >
                                            {formatNumber(course.clickCounts)}
                                        </Td>
                                        <Td className='text-ink-2 whitespace-nowrap'>
                                            {formatDate(course.createdAt)}
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end items-center gap-1'>
                                                {rowActions(course)}
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
                        {current.map((course) => (
                            <article
                                key={course._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0 flex flex-col gap-1'>
                                        <span className='font-medium text-ink truncate'>
                                            {course.courseName}
                                        </span>
                                        <code className='self-start font-mono text-[12px] px-1.5 py-px rounded bg-ground text-ink-2'>
                                            {course.courseCode}
                                        </code>
                                    </div>
                                </div>
                                <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                    <Link
                                        to={branchesPath(course)}
                                        className='text-link hover:underline'
                                    >
                                        {formatNumber(course.totalBranch)}{' '}
                                        {course.totalBranch === 1
                                            ? 'branch'
                                            : 'branches'}
                                    </Link>
                                    <span>
                                        {formatNumber(course.clickCounts)} views
                                    </span>
                                    <span>
                                        Added {formatDate(course.createdAt)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-end gap-1 pt-3 border-t border-line-soft'>
                                    {rowActions(course)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            {/* Course dialog */}
            <Dialog
                open={showModal}
                onClose={handleCloseModal}
                busy={submitting}
                size='sm'
                title={editingCourse ? 'Edit course' : 'Add course'}
                description={
                    editingCourse
                        ? undefined
                        : 'Branches and subjects are added to a course afterwards.'
                }
                footer={
                    <>
                        <Button
                            onClick={handleCloseModal}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            form='course-form'
                            variant='primary'
                            disabled={submitting}
                            icon={submitting ? Loader2 : undefined}
                            className={submitting ? '[&>svg]:animate-spin' : ''}
                        >
                            {submitting
                                ? 'Saving…'
                                : editingCourse
                                  ? 'Save changes'
                                  : 'Add course'}
                        </Button>
                    </>
                }
            >
                <form
                    id='course-form'
                    onSubmit={handleSubmit}
                    noValidate
                    className='flex flex-col gap-4'
                >
                    <Field
                        label='Course name'
                        required
                        error={formErrors.courseName}
                    >
                        <Input
                            value={formData.courseName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    courseName: e.target.value,
                                })
                            }
                            placeholder='B.Tech'
                            autoFocus
                        />
                    </Field>
                    <Field
                        label='Course code'
                        required
                        error={formErrors.courseCode}
                        hint='Short and unique, like BTECH or MCA.'
                    >
                        <Input
                            value={formData.courseCode}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    courseCode: e.target.value,
                                })
                            }
                            placeholder='BTECH'
                            className='font-mono text-[13px]'
                        />
                    </Field>
                </form>
            </Dialog>

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

export default Courses;
