import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BookOpen,
    GitBranch,
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
    Select,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';
import { SORT_OPTIONS, hasTimeFilter, sortCatalog } from './catalogUtils';

const subjectsPath = (branch) => `/reports/branches/${branch._id}/subjects`;
const allSubjectsPath = (branch) =>
    `/reports/subjects?search=&page=1&pageSize=12&course=&branch=${branch._id}`;

const plural = (n, one, many) => `${formatNumber(n)} ${n === 1 ? one : many}`;

const isWide = () => window.innerWidth >= 1024;

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [filterCourse, setFilterCourse] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [timeFilter, setTimeFilter] = useState('');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    // The course list sits beside the table on wide screens; narrow screens
    // get a course dropdown in the filter bar instead.
    const [wide, setWide] = useState(isWide);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({
        branchName: '',
        branchCode: '',
        course: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Only the layout follows the window size; the table/grid choice stays
    // whatever the admin picked.
    useEffect(() => {
        const onResize = () => setWide(isWide());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
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
            const [branchesRes, coursesRes] = await Promise.all([
                api.get('/resource/branches'),
                api.get('/resource/courses'),
            ]);
            setBranches(branchesRes.data.data || []);
            setCourses(coursesRes.data.data || []);
        } catch (e) {
            console.error(e);
            setError(
                'Couldn’t load branches. Check your connection and try again.',
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
        const fc = params.get('course') || '';
        const tf = params.get('timeFilter') || '';
        const sb = params.get('sortBy') || 'createdAt';
        const so = params.get('sortOrder') || 'desc';
        const vm =
            params.get('view') ||
            (window.innerWidth >= 1024 ? 'table' : 'grid');
        setSearch(q);
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 12);
        setFilterCourse(fc);
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
        params.set('course', filterCourse || '');
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
        filterCourse,
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
        if (!formData.branchName.trim()) errors.branchName = 'Enter a name';
        if (!formData.branchCode.trim()) errors.branchCode = 'Enter a code';
        if (!formData.course) errors.course = 'Choose a course';
        setFormErrors(errors);
        if (Object.keys(errors).length) return;

        setSubmitting(true);
        try {
            if (editingBranch) {
                await api.put(
                    `/resource/branches/${editingBranch._id}`,
                    formData,
                );
                toast.success('Branch saved');
                fetchData(); // Refresh to get updated data
            } else {
                await api.post('/resource/branches', formData);
                toast.success('Branch added');
                fetchData(); // Refresh to get updated data
            }
            handleCloseModal();
        } catch (e) {
            console.error(e);
            toast.error(
                e.response?.data?.message ||
                    'Couldn’t save the branch. Try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdd = () => {
        setEditingBranch(null);
        setFormData({ branchName: '', branchCode: '', course: filterCourse });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            branchName: branch.branchName,
            branchCode: branch.branchCode,
            course: branch.course?._id || '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (branch) => {
        const subjectCount = branch.totalSubject || 0;
        const ok = await showConfirm({
            title: `Delete ${branch.branchName}?`,
            message: subjectCount
                ? `Its ${plural(subjectCount, 'subject', 'subjects')} are deleted too. Students lose access straight away. This can’t be undone.`
                : 'Students lose access straight away. This can’t be undone.',
            confirmText: 'Delete branch',
        });
        if (!ok) return;

        try {
            await api.delete(`/resource/branches/${branch._id}`);
            setBranches(branches.filter((b) => b._id !== branch._id));
            toast.success('Branch deleted');
        } catch (e) {
            console.error(e);
            toast.error('Couldn’t delete the branch. Try again.');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBranch(null);
        setFormData({ branchName: '', branchCode: '', course: '' });
        setFormErrors({});
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
            // Apply time filter
            .filter((b) => filterByTime(b, timeFilter));
        return sortCatalog(list, sortBy, sortOrder, 'branchName');
    }, [branches, search, filterCourse, timeFilter, sortBy, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    // Branch counts per course, from the branches we have.
    const branchCounts = useMemo(
        () =>
            branches.reduce((acc, b) => {
                const id = b.course?._id || '';
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {}),
        [branches],
    );

    if (loading) {
        return <Loader />;
    }

    const selectedCourse = courses.find((c) => c._id === filterCourse);
    const scope = filterCourse
        ? branches.filter((b) => (b.course?._id || '') === filterCourse)
        : branches;
    const scopeSubjects = scope.reduce((n, b) => n + (b.totalSubject || 0), 0);
    const filtersActive = Boolean(search || hasTimeFilter(timeFilter));

    const pickCourse = (id) => {
        setFilterCourse(id);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setFilterCourse('');
        setTimeFilter('');
        setPage(1);
    };

    const rowActions = (branch) => (
        <>
            <Button size='sm' icon={BookOpen} to={subjectsPath(branch)}>
                Subjects
            </Button>
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Pencil}
                aria-label={`Edit ${branch.branchName}`}
                onClick={() => handleEdit(branch)}
            />
            <Button
                variant='ghost'
                size='sm'
                iconOnly
                icon={Trash2}
                aria-label={`Delete ${branch.branchName}`}
                className='text-bad-ink hover:text-bad-ink'
                onClick={() => handleDelete(branch)}
            />
        </>
    );

    const empty = (
        <EmptyState
            icon={GitBranch}
            title={
                scope.length === 0
                    ? selectedCourse
                        ? `No branches in ${selectedCourse.courseName} yet`
                        : 'No branches yet'
                    : 'No branches match'
            }
            description={
                scope.length === 0
                    ? 'Branches you add appear here, with their subjects.'
                    : 'Try another search or clear the filters.'
            }
            action={
                scope.length > 0 && filtersActive ? (
                    <Button
                        onClick={() => {
                            setSearch('');
                            setTimeFilter('');
                            setPage(1);
                        }}
                    >
                        Clear filters
                    </Button>
                ) : scope.length === 0 ? (
                    <Button variant='primary' icon={Plus} onClick={handleAdd}>
                        Add branch
                    </Button>
                ) : undefined
            }
        />
    );

    const courseOption = (id, label, code, count) => {
        const selected = filterCourse === id;
        return (
            <li key={id || 'all'}>
                <button
                    type='button'
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => pickCourse(id)}
                    className={`w-full flex items-center gap-2.5 min-h-11 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                        selected
                            ? 'bg-sheet ring-1 ring-line-strong shadow-[0_1px_2px_rgba(28,27,24,0.06)]'
                            : 'hover:bg-sunken'
                    }`}
                >
                    <span className='flex-1 min-w-0 flex flex-col gap-px'>
                        <span
                            className={`text-[13.5px] text-ink truncate ${selected ? 'font-semibold' : ''}`}
                        >
                            {label}
                        </span>
                        {code && (
                            <code className='font-mono text-[11px] text-muted truncate'>
                                {code}
                            </code>
                        )}
                    </span>
                    <span className='font-mono text-[12px] text-ink-2'>
                        {formatNumber(count)}
                    </span>
                </button>
            </li>
        );
    };

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Branches'
                description='Branches within each course. Every subject, PYQ and note sits in one.'
                actions={
                    <Button variant='primary' icon={Plus} onClick={handleAdd}>
                        Add branch
                    </Button>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start'>
                {wide && (
                    <nav
                        aria-label='Courses'
                        className='bg-sunken border border-line rounded-xl overflow-hidden'
                    >
                        <div className='flex items-center gap-2 px-4 py-3 border-b border-line-soft bg-sheet'>
                            <span className='flex-1 text-sm font-semibold text-ink'>
                                Courses
                            </span>
                            <span className='font-mono text-[12px] text-muted'>
                                {formatNumber(courses.length)}
                            </span>
                        </div>
                        <ul className='p-1.5 flex flex-col gap-0.5'>
                            {courseOption(
                                '',
                                'All courses',
                                null,
                                branches.length,
                            )}
                            {courses.map((c) =>
                                courseOption(
                                    c._id,
                                    c.courseName,
                                    c.courseCode,
                                    branchCounts[c._id] ?? c.totalBranch ?? 0,
                                ),
                            )}
                        </ul>
                    </nav>
                )}

                <div className='min-w-0 flex flex-col gap-4'>
                    <FilterBar
                        search={search}
                        onSearch={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        searchPlaceholder='Search by branch name, code or course'
                        filters={
                            wide
                                ? []
                                : [
                                      {
                                          label: 'Course',
                                          value: filterCourse,
                                          onChange: pickCourse,
                                          options: [
                                              {
                                                  value: '',
                                                  label: 'All courses',
                                              },
                                              ...courses.map((c) => ({
                                                  value: c._id,
                                                  label: c.courseCode,
                                              })),
                                          ],
                                      },
                                  ]
                        }
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
                                setSortOrder(
                                    sortOrder === 'asc' ? 'desc' : 'asc',
                                ),
                        }}
                        viewMode={{
                            value: viewMode,
                            onChange: setViewMode,
                        }}
                        onClear={clearFilters}
                        showClear={Boolean(filtersActive || filterCourse)}
                    />

                    {error && (
                        <Alert
                            tone='bad'
                            action={
                                <Button size='sm' onClick={fetchData}>
                                    Try again
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    <section
                        aria-labelledby='branches-scope'
                        className='bg-sheet border border-line rounded-xl overflow-hidden'
                    >
                        <div className='flex flex-col gap-1.5 px-5 sm:px-6 py-4 border-b border-line-soft'>
                            <div className='flex flex-wrap items-baseline gap-x-2.5 gap-y-1'>
                                <h2
                                    id='branches-scope'
                                    className='font-serif font-bold text-[22px] sm:text-[26px] leading-tight text-ink'
                                >
                                    {selectedCourse
                                        ? selectedCourse.courseName
                                        : 'All branches'}
                                </h2>
                                {selectedCourse && (
                                    <code className='font-mono text-[12.5px] px-1.5 py-0.5 rounded-[5px] bg-ground text-ink-2'>
                                        {selectedCourse.courseCode}
                                    </code>
                                )}
                            </div>
                            <span className='text-[13px] text-muted'>
                                {[
                                    plural(scope.length, 'branch', 'branches'),
                                    plural(
                                        scopeSubjects,
                                        'subject',
                                        'subjects',
                                    ),
                                    selectedCourse
                                        ? `${formatNumber(selectedCourse.clickCounts)} page views`
                                        : plural(
                                              courses.length,
                                              'course',
                                              'courses',
                                          ),
                                ].join(' · ')}
                            </span>
                        </div>

                        {current.length === 0 ? (
                            empty
                        ) : viewMode === 'table' ? (
                            <Table minWidth={740}>
                                <thead>
                                    <tr>
                                        <Th>Branch</Th>
                                        <Th>Code</Th>
                                        <Th align='right'>Subjects</Th>
                                        <Th align='right'>Views</Th>
                                        <Th>Added</Th>
                                        <Th>
                                            <span className='sr-only'>
                                                Actions
                                            </span>
                                        </Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {current.map((branch) => (
                                        <Tr key={branch._id}>
                                            <Td className='max-w-[320px]'>
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={subjectsPath(
                                                            branch,
                                                        )}
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {branch.branchName}
                                                    </Link>
                                                    {!filterCourse && (
                                                        <span className='text-[12.5px] text-muted truncate'>
                                                            {branch.course
                                                                ?.courseName ||
                                                                'No course'}
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td
                                                mono
                                                className='text-ink-2 whitespace-nowrap'
                                            >
                                                {branch.branchCode}
                                            </Td>
                                            <Td align='right' mono>
                                                <Link
                                                    to={allSubjectsPath(branch)}
                                                    className='text-link hover:underline'
                                                    aria-label={`${plural(branch.totalSubject || 0, 'subject', 'subjects')} in ${branch.branchName}`}
                                                >
                                                    {formatNumber(
                                                        branch.totalSubject,
                                                    )}
                                                </Link>
                                            </Td>
                                            <Td
                                                align='right'
                                                mono
                                                className='text-ink-2'
                                            >
                                                {formatNumber(
                                                    branch.clickCounts,
                                                )}
                                            </Td>
                                            <Td className='text-ink-2 whitespace-nowrap'>
                                                {formatDate(branch.createdAt)}
                                            </Td>
                                            <Td align='right'>
                                                <div className='flex justify-end items-center gap-1'>
                                                    {rowActions(branch)}
                                                </div>
                                            </Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <ul>
                                {current.map((branch) => (
                                    <li
                                        key={branch._id}
                                        className='flex flex-col gap-2 px-5 sm:px-6 py-4 border-b border-line-soft last:border-b-0'
                                    >
                                        <div className='flex items-baseline gap-2 min-w-0'>
                                            <Link
                                                to={subjectsPath(branch)}
                                                className='flex-1 min-w-0 font-medium text-ink hover:underline'
                                            >
                                                {branch.branchName}
                                            </Link>
                                            <code className='font-mono text-[12px] text-ink-2'>
                                                {branch.branchCode}
                                            </code>
                                        </div>
                                        <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                            {!filterCourse && (
                                                <span>
                                                    {branch.course
                                                        ?.courseName || '—'}
                                                </span>
                                            )}
                                            <Link
                                                to={allSubjectsPath(branch)}
                                                className='text-link hover:underline'
                                            >
                                                {plural(
                                                    branch.totalSubject || 0,
                                                    'subject',
                                                    'subjects',
                                                )}
                                            </Link>
                                            <span>
                                                {formatNumber(
                                                    branch.clickCounts,
                                                )}{' '}
                                                views
                                            </span>
                                            <span>
                                                Added{' '}
                                                {formatDate(branch.createdAt)}
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-end gap-1'>
                                            {rowActions(branch)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {totalItems > 0 && (
                            <div className='px-4 py-3 border-t border-line-soft'>
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
                        )}
                    </section>
                </div>
            </div>

            {/* Branch dialog */}
            <Dialog
                open={showModal}
                onClose={handleCloseModal}
                busy={submitting}
                size='sm'
                title={editingBranch ? 'Edit branch' : 'Add branch'}
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
                            form='branch-form'
                            variant='primary'
                            disabled={submitting}
                            icon={submitting ? Loader2 : undefined}
                            className={submitting ? '[&>svg]:animate-spin' : ''}
                        >
                            {submitting
                                ? 'Saving…'
                                : editingBranch
                                  ? 'Save changes'
                                  : 'Add branch'}
                        </Button>
                    </>
                }
            >
                <form
                    id='branch-form'
                    onSubmit={handleSubmit}
                    noValidate
                    className='flex flex-col gap-4'
                >
                    <Field label='Course' required error={formErrors.course}>
                        <Select
                            value={formData.course}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    course: e.target.value,
                                })
                            }
                            placeholder='Choose a course'
                            options={courses.map((course) => ({
                                value: course._id,
                                label: `${course.courseName} (${course.courseCode})`,
                            }))}
                        />
                    </Field>
                    <Field
                        label='Branch name'
                        required
                        error={formErrors.branchName}
                    >
                        <Input
                            value={formData.branchName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    branchName: e.target.value,
                                })
                            }
                            placeholder='Computer Science & Engineering'
                        />
                    </Field>
                    <Field
                        label='Branch code'
                        required
                        error={formErrors.branchCode}
                        hint='Unique across all courses, like CSE or MCA-GEN.'
                    >
                        <Input
                            value={formData.branchCode}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    branchCode: e.target.value,
                                })
                            }
                            placeholder='CSE'
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

export default Branches;
