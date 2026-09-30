import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Check, Download, Pencil, Trash2, X } from 'lucide-react';
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
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import NotesEditModal from '../../components/NotesEditModal';
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
    submissionStatus: '',
    subject: '',
    isPaid: '',
    deleted: '',
};

const NotesList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [notes, setNotes] = useState([]);
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

    const [editingNote, setEditingNote] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchNotes = async () => {
        try {
            setError(null);
            const response = await api.get(`/notes/all/${collegeslug}`);
            setNotes(response.data.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    'Couldn’t load notes. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
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

    const subjectNames = useMemo(
        () =>
            [
                ...new Set(
                    notes.map((n) => n.subject?.subjectName).filter(Boolean),
                ),
            ].sort((a, b) => a.localeCompare(b)),
        [notes],
    );

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (note) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            note.title?.toLowerCase().includes(q) ||
            note.description?.toLowerCase().includes(q) ||
            note.subject?.subjectName?.toLowerCase().includes(q) ||
            note.owner?.username?.toLowerCase().includes(q);
        const matchesPaid =
            !filters.isPaid ||
            (filters.isPaid === 'true' ? note.price > 0 : !(note.price > 0));
        const matchesDeleted =
            filters.deleted === '' ||
            (filters.deleted === 'true' ? note.deleted : !note.deleted);
        return (
            matchesSearch &&
            (!filters.subject ||
                note.subject?.subjectName === filters.subject) &&
            matchesPaid &&
            matchesDeleted &&
            filterByTime(note, timeFilter)
        );
    };

    const base = notes.filter(matchesFilters);
    const counts = base.reduce(
        (acc, n) => {
            const status = n.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (n) =>
            !filters.submissionStatus ||
            (n.submissionStatus || 'pending') === filters.submissionStatus,
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
        useMemo(() => current.map((n) => n._id), [current]),
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
        setNotes((prev) =>
            prev.map((n) => (ids.includes(n._id) ? { ...n, ...patch } : n)),
        );

    // Runs one request per note and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} note${done.length === 1 ? '' : 's'} ${verb}`,
            );
        if (failed) {
            const reason = results.find((r) => r.status === 'rejected')?.reason
                ?.response?.data?.message;
            toast.error(
                `${formatNumber(failed)} couldn’t be ${verb}.${reason ? ` ${reason}` : ' Try those again.'}`,
            );
        }
        return done;
    };

    const approve = async (ids) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/notes/edit/${id}`, {
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
                api.put(`/notes/edit/${id}`, {
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
                    ? 'Delete this note?'
                    : `Delete ${formatNumber(ids.length)} notes?`,
            message:
                'The file is removed and students lose access straight away, including anyone who paid for it. This can’t be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/notes/delete/${id}`),
                    'deleted',
                );
                setNotes((prev) => prev.filter((n) => !done.includes(n._id)));
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `notes-${collegeslug}`,
            [
                { label: 'Title', value: (n) => n.title },
                { label: 'Description', value: (n) => n.description },
                { label: 'Subject', value: (n) => n.subject?.subjectName },
                {
                    label: 'Status',
                    value: (n) => n.submissionStatus || 'pending',
                },
                { label: 'Price (points)', value: (n) => n.price || 0 },
                {
                    label: 'Downloadable',
                    value: (n) => (n.isDownloadable === false ? 'no' : 'yes'),
                },
                { label: 'Views', value: (n) => n.clickCounts || 0 },
                { label: 'Deleted', value: (n) => (n.deleted ? 'yes' : 'no') },
                { label: 'Uploaded by', value: (n) => n.owner?.username },
                {
                    label: 'Submitted',
                    value: (n) => formatDateTime(n.createdAt),
                },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const noteUrl = (note) => `/${collegeslug}/notes/${note._id}`;
    const accessLine = (note) =>
        note.isDownloadable === false ? 'View only' : 'Downloadable';

    const rowActions = (note) => {
        const pending = (note.submissionStatus || 'pending') === 'pending';
        const name = note.title || 'note';
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
                    aria-label={`Reject ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    disabled={bulkBusy}
                    onClick={stop(() => setRejecting([note._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${name}`}
                    className='text-ok-ink hover:text-ok-ink'
                    disabled={bulkBusy}
                    onClick={stop(() => approve([note._id]))}
                />
            </>
        ) : (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${name}`}
                    onClick={stop(() => setEditingNote(note))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([note._id]))}
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

    const reviewQueueEmpty =
        filters.submissionStatus === 'pending' && !activeFilters && !search;
    const empty = (
        <EmptyState
            icon={BookOpen}
            tone={reviewQueueEmpty && notes.length ? 'done' : 'neutral'}
            title={
                notes.length === 0
                    ? 'No notes yet'
                    : reviewQueueEmpty
                      ? 'Nothing waiting for review'
                      : 'No notes match'
            }
            description={
                notes.length === 0
                    ? 'Notes students upload for this college appear here.'
                    : reviewQueueEmpty
                      ? 'New uploads appear here until someone approves or rejects them.'
                      : 'Try another search or clear the filters.'
            }
            action={
                activeFilters || search || timeFilter !== 'all' ? (
                    <Button onClick={clearAll}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Notes'
                description={`Study notes uploaded by students of ${currentCollege?.name || collegeslug}.`}
                actions={
                    <Button
                        icon={Download}
                        onClick={exportCsv}
                        disabled={!sorted.length}
                    >
                        Export CSV
                    </Button>
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
                searchPlaceholder='Search by title, description, subject or uploader'
                filters={[
                    {
                        label: 'Subject',
                        value: filters.subject,
                        onChange: (v) => setFilter('subject', v),
                        options: [
                            { value: '', label: 'Any subject' },
                            ...subjectNames.map((s) => ({
                                value: s,
                                label: s,
                            })),
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
                        <Button size='sm' onClick={fetchNotes}>
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
                        <Table minWidth={1040}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all notes on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Note</Th>
                                    <Th>Subject</Th>
                                    <Th>Status</Th>
                                    <Th>Access</Th>
                                    <Th>Submitted</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((note) => (
                                    <Tr
                                        key={note._id}
                                        selected={selection.isSelected(
                                            note._id,
                                        )}
                                        onClick={() => navigate(noteUrl(note))}
                                    >
                                        <SelectCell
                                            label={`Select ${note.title || 'note'}`}
                                            checked={selection.isSelected(
                                                note._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(note._id, on)
                                            }
                                        />
                                        <Td className='max-w-[340px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <Link
                                                    to={noteUrl(note)}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className='font-medium text-ink hover:underline truncate'
                                                >
                                                    {note.title ||
                                                        'Untitled note'}
                                                </Link>
                                                <span className='text-[12.5px] text-muted truncate'>
                                                    {note.description ||
                                                        'No description'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td className='max-w-[220px]'>
                                            <span className='block truncate text-ink-2'>
                                                {note.subject?.subjectName ||
                                                    '—'}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                <div className='flex flex-wrap gap-1'>
                                                    <StatusBadge
                                                        status={
                                                            note.submissionStatus
                                                        }
                                                    />
                                                    {note.deleted && (
                                                        <StatusBadge tone='outline'>
                                                            Deleted
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                                {note.clickCounts > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            note.clickCounts,
                                                        )}{' '}
                                                        views
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='font-mono text-[13px] whitespace-nowrap'>
                                                    {formatPoints(note.price)}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {accessLine(note)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDateTime(
                                                        note.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {note.owner?.username
                                                        ? `@${note.owner.username}`
                                                        : 'Unknown uploader'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(note)}
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
                        {current.map((note) => (
                            <article
                                key={note._id}
                                onClick={() => navigate(noteUrl(note))}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <Link
                                            to={noteUrl(note)}
                                            onClick={(e) => e.stopPropagation()}
                                            className='font-medium text-ink hover:underline line-clamp-2'
                                        >
                                            {note.title || 'Untitled note'}
                                        </Link>
                                        <span className='text-[12.5px] text-muted truncate'>
                                            {note.subject?.subjectName ||
                                                'No subject'}
                                        </span>
                                    </div>
                                    <StatusBadge
                                        status={note.submissionStatus}
                                    />
                                </div>
                                {note.description && (
                                    <p className='text-[13px] text-ink-2 line-clamp-2'>
                                        {note.description}
                                    </p>
                                )}
                                <div className='flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2'>
                                    <span className='font-mono text-[12.5px]'>
                                        {formatPoints(note.price)}
                                    </span>
                                    <span>{accessLine(note)}</span>
                                    {note.clickCounts > 0 && (
                                        <span>
                                            {formatNumber(note.clickCounts)}{' '}
                                            views
                                        </span>
                                    )}
                                    {note.deleted && (
                                        <StatusBadge tone='outline'>
                                            Deleted
                                        </StatusBadge>
                                    )}
                                </div>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        {formatShortDateTime(note.createdAt)}
                                        {note.owner?.username &&
                                            ` · @${note.owner.username}`}
                                    </span>
                                    {rowActions(note)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <NotesEditModal
                isOpen={Boolean(editingNote)}
                onClose={() => setEditingNote(null)}
                note={editingNote}
                onSuccess={(updated) => {
                    // The API returns the note without subject and uploader
                    // filled in, so keep the ones already on screen.
                    if (updated?._id)
                        setNotes((prev) =>
                            prev.map((n) =>
                                n._id === updated._id
                                    ? {
                                          ...n,
                                          ...updated,
                                          subject: n.subject,
                                          owner: n.owner,
                                          college: n.college,
                                      }
                                    : n,
                            ),
                        );
                    setEditingNote(null);
                }}
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
                        ? `Reject ${formatNumber(rejecting.length)} notes?`
                        : 'Reject this note?'
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

export default NotesList;
