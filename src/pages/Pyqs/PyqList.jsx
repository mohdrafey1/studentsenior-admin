import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    Download,
    FileText,
    Pencil,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDateTime,
    formatNumber,
    formatPoints,
    formatShortDateTime,
} from '../../utils/format';
import { EXAM_TYPES, examTypeLabel } from '../../utils/labels';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import PyqEditModal from '../../components/PyqEditModal';
import {
    Alert,
    BulkBar,
    BulkButton,
    Button,
    EmptyState,
    PageHeader,
    SelectCell,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';

const STATUS_TABS = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
];

const EMPTY_FILTERS = {
    year: '',
    examType: '',
    submissionStatus: '',
    solved: '',
    isPaid: '',
    deleted: '',
};

const subjectLine = (pyq) =>
    [
        pyq.subject?.subjectCode,
        pyq.subject?.semester && `Sem ${pyq.subject.semester}`,
        pyq.subject?.branch?.branchCode,
    ]
        .filter(Boolean)
        .join(' · ');

const PyqList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [pyqs, setPyqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(20);
    const [timeFilter, setTimeFilter] = useState(params.get('time') || 'all');
    const [filters, setFilters] = useState(() =>
        Object.fromEntries(
            Object.keys(EMPTY_FILTERS).map((key) => [
                key,
                params.get(key) || '',
            ]),
        ),
    );
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );

    const [editingPyq, setEditingPyq] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchPyqs = async () => {
        try {
            setError(null);
            const response = await api.get(`/pyq/all/${collegeslug}`);
            setPyqs(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load PYQs. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPyqs();
    }, [collegeslug]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const next = new URLSearchParams();
        if (search) next.set('search', search);
        if (timeFilter && timeFilter !== 'all') next.set('time', timeFilter);
        Object.entries(filters).forEach(
            ([key, value]) => value && next.set(key, value),
        );
        if (page > 1) next.set('page', String(page));
        navigate({ search: next.toString() }, { replace: true });
    }, [search, timeFilter, filters, page, navigate]);

    const setFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const uniqueYears = useMemo(
        () =>
            [...new Set(pyqs.map((p) => p.year))]
                .filter(Boolean)
                .sort((a, b) => b.localeCompare(a)),
        [pyqs],
    );

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (p) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            p.subject?.subjectName?.toLowerCase().includes(q) ||
            p.subject?.subjectCode?.toLowerCase().includes(q) ||
            p.subject?.branch?.branchName?.toLowerCase().includes(q) ||
            p.subject?.branch?.course?.courseName?.toLowerCase().includes(q) ||
            p.year?.toString().includes(q) ||
            p.examType?.toLowerCase().includes(q);
        const bool = (filter, value) =>
            filter === '' || (filter === 'true' ? value : !value);
        return (
            matchesSearch &&
            (!filters.year || p.year === filters.year) &&
            (!filters.examType || p.examType === filters.examType) &&
            filterByTime(p, timeFilter) &&
            bool(filters.solved, p.solved) &&
            bool(filters.isPaid, p.isPaid) &&
            bool(filters.deleted, p.deleted)
        );
    };

    const base = pyqs.filter(matchesFilters);
    const counts = base.reduce(
        (acc, p) => {
            const status = p.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (p) =>
            !filters.submissionStatus ||
            (p.submissionStatus || 'pending') === filters.submissionStatus,
    );
    const sorted = [...filtered].sort((a, b) => {
        const diff =
            sortBy === 'clickCounts'
                ? (a.clickCounts || 0) - (b.clickCounts || 0)
                : new Date(a.createdAt) - new Date(b.createdAt);
        return sortOrder === 'desc' ? -diff : diff;
    });
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const selection = useSelection(
        useMemo(() => current.map((p) => p._id), [current]),
    );

    const activeFilters = Object.entries(filters).filter(
        ([key, value]) => key !== 'submissionStatus' && value,
    ).length;
    const clearAll = () => {
        setSearch('');
        setTimeFilter('all');
        setFilters((prev) => ({
            ...EMPTY_FILTERS,
            submissionStatus: prev.submissionStatus,
        }));
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const updateLocal = (ids, patch) =>
        setPyqs((prev) =>
            prev.map((p) => (ids.includes(p._id) ? { ...p, ...patch } : p)),
        );

    // Runs one request per PYQ and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} PYQ${done.length === 1 ? '' : 's'} ${verb}`,
            );
        if (failed)
            toast.error(
                `${formatNumber(failed)} couldn’t be ${verb}. Try those again.`,
            );
        return done;
    };

    const approve = async (ids) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/pyq/edit/${id}`, {
                    submissionStatus: 'approved',
                    rejectionReason: '',
                }),
            'approved',
        );
        updateLocal(done, {
            submissionStatus: 'approved',
            rejectionReason: '',
        });
        selection.clear();
    };

    const reject = async (ids, reason) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/pyq/edit/${id}`, {
                    submissionStatus: 'rejected',
                    rejectionReason: reason,
                }),
            'rejected',
        );
        updateLocal(done, {
            submissionStatus: 'rejected',
            rejectionReason: reason,
        });
        selection.clear();
        setRejecting(null);
    };

    const remove = (ids) =>
        setConfirm({
            title:
                ids.length === 1
                    ? 'Delete this PYQ?'
                    : `Delete ${formatNumber(ids.length)} PYQs?`,
            message:
                'Students lose access straight away, including anyone who paid for them. This can’t be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/pyq/delete/${id}`),
                    'deleted',
                );
                setPyqs((prev) => prev.filter((p) => !done.includes(p._id)));
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `pyqs-${collegeslug}`,
            [
                { label: 'Subject', value: (p) => p.subject?.subjectName },
                { label: 'Code', value: (p) => p.subject?.subjectCode },
                { label: 'Semester', value: (p) => p.subject?.semester },
                {
                    label: 'Branch',
                    value: (p) => p.subject?.branch?.branchName,
                },
                { label: 'Year', value: (p) => p.year },
                { label: 'Exam', value: (p) => examTypeLabel(p.examType) },
                {
                    label: 'Status',
                    value: (p) => p.submissionStatus || 'pending',
                },
                {
                    label: 'Price (points)',
                    value: (p) => (p.isPaid ? p.price : 0),
                },
                { label: 'Solved', value: (p) => (p.solved ? 'yes' : 'no') },
                { label: 'Views', value: (p) => p.clickCounts || 0 },
                { label: 'Uploaded by', value: (p) => p.owner?.username },
                {
                    label: 'Submitted',
                    value: (p) => formatDateTime(p.createdAt),
                },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const openPyq = (pyq) => navigate(`/${collegeslug}/pyqs/${pyq._id}`);

    const rowActions = (pyq) => {
        const pending = (pyq.submissionStatus || 'pending') === 'pending';
        const stop = (fn) => (event) => {
            event.stopPropagation();
            fn();
        };
        return pending ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${pyq.subject?.subjectName || 'PYQ'}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => setRejecting([pyq._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${pyq.subject?.subjectName || 'PYQ'}`}
                    className='text-ok-ink hover:text-ok-ink'
                    onClick={stop(() => approve([pyq._id]))}
                />
            </>
        ) : (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${pyq.subject?.subjectName || 'PYQ'}`}
                    onClick={stop(() => setEditingPyq(pyq))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${pyq.subject?.subjectName || 'PYQ'}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([pyq._id]))}
                />
            </>
        );
    };

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const empty = (
        <EmptyState
            icon={FileText}
            tone={
                filters.submissionStatus === 'pending' &&
                !activeFilters &&
                !search
                    ? 'done'
                    : 'neutral'
            }
            title={
                pyqs.length === 0
                    ? 'No PYQs yet'
                    : filters.submissionStatus === 'pending' &&
                        !activeFilters &&
                        !search
                      ? 'Nothing waiting for review'
                      : 'No PYQs match'
            }
            description={
                pyqs.length === 0
                    ? 'Papers students upload for this college appear here.'
                    : 'Try another search or clear the filters.'
            }
            action={
                activeFilters || search ? (
                    <Button onClick={clearAll}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='PYQs'
                description={`Previous-year question papers uploaded by students of ${currentCollege?.name || collegeslug}.`}
                actions={
                    <>
                        <Button
                            icon={Download}
                            onClick={exportCsv}
                            disabled={!sorted.length}
                        >
                            Export CSV
                        </Button>
                        <Button
                            variant='primary'
                            icon={Upload}
                            to={`/${collegeslug}/pyqs-bulk-import`}
                        >
                            Bulk import
                        </Button>
                    </>
                }
            />

            <Tabs
                label='Review status'
                className='mb-4'
                value={filters.submissionStatus}
                onChange={(value) => {
                    setFilter('submissionStatus', value);
                    selection.clear();
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                    count: counts[value] || 0,
                    attention: value === 'pending' && counts.pending > 0,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by subject, code, branch, year or exam type'
                filters={[
                    {
                        label: 'Year',
                        value: filters.year,
                        onChange: (v) => setFilter('year', v),
                        options: [
                            { value: '', label: 'Any year' },
                            ...uniqueYears.map((y) => ({ value: y, label: y })),
                        ],
                    },
                    {
                        label: 'Exam type',
                        value: filters.examType,
                        onChange: (v) => setFilter('examType', v),
                        options: [
                            { value: '', label: 'Any exam' },
                            ...EXAM_TYPES,
                        ],
                    },
                    {
                        label: 'Solved',
                        value: filters.solved,
                        onChange: (v) => setFilter('solved', v),
                        options: [
                            { value: '', label: 'Solved or not' },
                            { value: 'true', label: 'Solved' },
                            { value: 'false', label: 'Unsolved' },
                        ],
                    },
                    {
                        label: 'Price',
                        value: filters.isPaid,
                        onChange: (v) => setFilter('isPaid', v),
                        options: [
                            { value: '', label: 'Paid or free' },
                            { value: 'true', label: 'Paid' },
                            { value: 'false', label: 'Free' },
                        ],
                    },
                    {
                        label: 'Deleted',
                        value: filters.deleted,
                        onChange: (v) => setFilter('deleted', v),
                        options: [
                            { value: '', label: 'Include deleted' },
                            { value: 'false', label: 'Hide deleted' },
                            { value: 'true', label: 'Only deleted' },
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
                        { value: 'createdAt', label: 'Newest first' },
                        { value: 'clickCounts', label: 'Most viewed' },
                    ],
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                viewMode={{ value: viewMode, onChange: setViewMode }}
                onClear={clearAll}
                showClear={Boolean(
                    search || timeFilter !== 'all' || activeFilters,
                )}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchPyqs}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    <BulkBar count={selection.count} onClear={selection.clear}>
                        <BulkButton
                            primary
                            icon={Check}
                            disabled={bulkBusy}
                            onClick={() => approve(selectedIds)}
                        >
                            Approve
                        </BulkButton>
                        <BulkButton
                            icon={X}
                            disabled={bulkBusy}
                            onClick={() => setRejecting(selectedIds)}
                        >
                            Reject…
                        </BulkButton>
                        <BulkButton
                            icon={Trash2}
                            disabled={bulkBusy}
                            onClick={() => remove(selectedIds)}
                        >
                            Delete
                        </BulkButton>
                    </BulkBar>
                    {current.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={1000}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all PYQs on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Subject</Th>
                                    <Th>Year · Exam</Th>
                                    <Th>Status</Th>
                                    <Th>Price</Th>
                                    <Th>Submitted</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((pyq) => (
                                    <Tr
                                        key={pyq._id}
                                        selected={selection.isSelected(pyq._id)}
                                        onClick={() => openPyq(pyq)}
                                    >
                                        <SelectCell
                                            label={`Select ${pyq.subject?.subjectName || 'PYQ'} ${pyq.year || ''}`}
                                            checked={selection.isSelected(
                                                pyq._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(pyq._id, on)
                                            }
                                        />
                                        <Td className='max-w-[320px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <Link
                                                    to={`/${collegeslug}/pyqs/${pyq._id}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className='font-medium text-ink hover:underline truncate'
                                                >
                                                    {pyq.subject?.subjectName ||
                                                        'Untitled subject'}
                                                </Link>
                                                <span className='text-[12.5px] text-muted truncate'>
                                                    {subjectLine(pyq)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span>{pyq.year || '—'}</span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {examTypeLabel(
                                                        pyq.examType,
                                                    )}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                <div className='flex flex-wrap gap-1'>
                                                    <StatusBadge
                                                        status={
                                                            pyq.submissionStatus
                                                        }
                                                    />
                                                    {pyq.deleted && (
                                                        <StatusBadge tone='outline'>
                                                            Deleted
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                                {pyq.clickCounts > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            pyq.clickCounts,
                                                        )}{' '}
                                                        views
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='font-mono text-[13px]'>
                                                    {formatPoints(
                                                        pyq.isPaid
                                                            ? pyq.price
                                                            : 0,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {pyq.solved
                                                        ? 'Solved'
                                                        : 'Unsolved'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDateTime(
                                                        pyq.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {pyq.owner?.username
                                                        ? `@${pyq.owner.username}`
                                                        : 'Unknown uploader'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(pyq)}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {sorted.length > 0 && (
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
                        {current.map((pyq) => (
                            <article
                                key={pyq._id}
                                onClick={() => openPyq(pyq)}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <Link
                                            to={`/${collegeslug}/pyqs/${pyq._id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className='font-medium text-ink hover:underline truncate'
                                        >
                                            {pyq.subject?.subjectName ||
                                                'Untitled subject'}
                                        </Link>
                                        <span className='text-[12.5px] text-muted truncate'>
                                            {subjectLine(pyq)}
                                        </span>
                                    </div>
                                    <StatusBadge
                                        status={pyq.submissionStatus}
                                    />
                                </div>
                                <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                    <span>
                                        {pyq.year || '—'} ·{' '}
                                        {examTypeLabel(pyq.examType)}
                                    </span>
                                    <span className='font-mono text-[12.5px]'>
                                        {formatPoints(
                                            pyq.isPaid ? pyq.price : 0,
                                        )}
                                    </span>
                                    <span>
                                        {pyq.solved ? 'Solved' : 'Unsolved'}
                                    </span>
                                </div>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        {formatShortDateTime(pyq.createdAt)}
                                        {pyq.owner?.username &&
                                            ` · @${pyq.owner.username}`}
                                    </span>
                                    {rowActions(pyq)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <PyqEditModal
                isOpen={Boolean(editingPyq)}
                onClose={() => setEditingPyq(null)}
                pyq={editingPyq}
                onUpdate={fetchPyqs}
            />

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant='danger'
            />

            <RejectDialog
                open={Boolean(rejecting)}
                onClose={() => setRejecting(null)}
                title={
                    rejecting?.length > 1
                        ? `Reject ${formatNumber(rejecting.length)} PYQs?`
                        : 'Reject this PYQ?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Every uploader gets the same reason, so keep it general.'
                        : undefined
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default PyqList;
