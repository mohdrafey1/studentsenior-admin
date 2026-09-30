import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Briefcase,
    Check,
    Download,
    ExternalLink,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDateTime,
    formatNumber,
    formatShortDateTime,
} from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import OpportunityEditModal from '../../components/OpportunityEditModal';
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
    via: '',
    deleted: '',
};

// The model stores `clickCount`; older records may still use `clickCounts`.
const viewsOf = (o) => o.clickCount ?? o.clickCounts ?? 0;

// Ways a student can apply, in the order they show in the table.
const channelsOf = (o) =>
    [
        o.link && { key: 'link', label: 'Form' },
        o.email && { key: 'email', label: 'Email' },
        o.whatsapp && { key: 'whatsapp', label: 'WhatsApp' },
    ].filter(Boolean);

const OpportunityList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(12);
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

    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchOpportunities = async () => {
        try {
            setError(null);
            const response = await api.get(`/opportunity/all/${collegeslug}`);
            setOpportunities(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load opportunities. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
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

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (o) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            o.name?.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q) ||
            o.email?.toLowerCase().includes(q) ||
            o.owner?.username?.toLowerCase().includes(q);
        return (
            matchesSearch &&
            (!filters.via || Boolean(o[filters.via])) &&
            (filters.deleted === '' ||
                (filters.deleted === 'true' ? o.deleted : !o.deleted)) &&
            filterByTime(o, timeFilter)
        );
    };

    const base = opportunities.filter(matchesFilters);
    const counts = base.reduce(
        (acc, o) => {
            const status = o.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (o) =>
            !filters.submissionStatus ||
            (o.submissionStatus || 'pending') === filters.submissionStatus,
    );
    const sorted = [...filtered].sort((a, b) => {
        const diff =
            sortBy === 'clickCounts'
                ? viewsOf(a) - viewsOf(b)
                : new Date(a.createdAt) - new Date(b.createdAt);
        return sortOrder === 'desc' ? -diff : diff;
    });
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const selection = useSelection(
        useMemo(() => current.map((o) => o._id), [current]),
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
        setOpportunities((prev) =>
            prev.map((o) => (ids.includes(o._id) ? { ...o, ...patch } : o)),
        );

    // Runs one request per opportunity and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} ${done.length === 1 ? 'opportunity' : 'opportunities'} ${verb}`,
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
                api.put(`/opportunity/edit/${id}`, {
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
                api.put(`/opportunity/edit/${id}`, {
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
                    ? 'Delete this opportunity?'
                    : `Delete ${formatNumber(ids.length)} opportunities?`,
            message:
                'Students stop seeing it straight away and the poster can’t get it back. This can’t be undone.',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/opportunity/delete/${id}`),
                    'deleted',
                );
                setOpportunities((prev) =>
                    prev.filter((o) => !done.includes(o._id)),
                );
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `opportunities-${collegeslug}`,
            [
                { label: 'Title', value: (o) => o.name },
                { label: 'Description', value: (o) => o.description },
                {
                    label: 'Apply by',
                    value: (o) =>
                        channelsOf(o)
                            .map((c) => c.label)
                            .join(' / '),
                },
                { label: 'Email', value: (o) => o.email },
                { label: 'Link', value: (o) => o.link },
                {
                    label: 'Status',
                    value: (o) => o.submissionStatus || 'pending',
                },
                { label: 'Rejection reason', value: (o) => o.rejectionReason },
                { label: 'Views', value: viewsOf },
                { label: 'Posted by', value: (o) => o.owner?.username },
                { label: 'Posted', value: (o) => formatDateTime(o.createdAt) },
                { label: 'Deleted', value: (o) => (o.deleted ? 'yes' : 'no') },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const detailPath = (o) => `/${collegeslug}/opportunities/${o._id}`;
    const stop = (fn) => (event) => {
        event.stopPropagation();
        fn();
    };

    const rowActions = (o) =>
        (o.submissionStatus || 'pending') === 'pending' ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${o.name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => setRejecting([o._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${o.name}`}
                    className='text-ok-ink hover:text-ok-ink'
                    onClick={stop(() => approve([o._id]))}
                />
            </>
        ) : (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${o.name}`}
                    onClick={stop(() => setEditing(o))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${o.name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([o._id]))}
                />
            </>
        );

    // Chips for each way to apply; the form chip opens the link.
    const channels = (o) => {
        const list = channelsOf(o);
        if (!list.length)
            return <span className='text-[12.5px] text-muted'>Not given</span>;
        return (
            <div className='flex flex-wrap gap-1'>
                {list.map((c) =>
                    c.key === 'link' ? (
                        <a
                            key={c.key}
                            href={o.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open the application form for ${o.name} in a new tab`}
                            className='inline-flex items-center gap-1 px-[7px] py-0.5 rounded-[5px] bg-ground text-xs text-ink-2 hover:text-link'
                        >
                            {c.label}
                            <ExternalLink
                                className='w-3 h-3'
                                aria-hidden='true'
                            />
                        </a>
                    ) : (
                        <span
                            key={c.key}
                            className='px-[7px] py-0.5 rounded-[5px] bg-ground text-xs text-ink-2'
                        >
                            {c.label}
                        </span>
                    ),
                )}
            </div>
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

    const reviewQueue =
        filters.submissionStatus === 'pending' && !activeFilters && !search;
    const empty = (
        <EmptyState
            icon={Briefcase}
            tone={reviewQueue ? 'done' : 'neutral'}
            title={
                opportunities.length === 0
                    ? 'No opportunities yet'
                    : reviewQueue
                      ? 'Nothing waiting for review'
                      : 'No opportunities match'
            }
            description={
                opportunities.length === 0 || reviewQueue
                    ? 'New opportunities posted by students will appear here.'
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
                title='Opportunities'
                description={`Internships, part-time work and team calls posted for ${currentCollege?.name || collegeslug} students.`}
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
                searchPlaceholder='Search by title, description, email or who posted it'
                filters={[
                    {
                        label: 'Apply by',
                        value: filters.via,
                        onChange: (v) => setFilter('via', v),
                        options: [
                            { value: '', label: 'Any way to apply' },
                            { value: 'link', label: 'Online form' },
                            { value: 'email', label: 'Email' },
                            { value: 'whatsapp', label: 'WhatsApp' },
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
                        <Button size='sm' onClick={fetchOpportunities}>
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
                        <Table minWidth={960}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all opportunities on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Opportunity</Th>
                                    <Th>Students apply by</Th>
                                    <Th>Status</Th>
                                    <Th>Posted</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((o) => (
                                    <Tr
                                        key={o._id}
                                        selected={selection.isSelected(o._id)}
                                        onClick={() => navigate(detailPath(o))}
                                    >
                                        <SelectCell
                                            label={`Select ${o.name}`}
                                            checked={selection.isSelected(
                                                o._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(o._id, on)
                                            }
                                        />
                                        <Td className='max-w-[380px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <Link
                                                    to={detailPath(o)}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className='font-medium text-ink hover:underline truncate'
                                                >
                                                    {o.name || 'Untitled'}
                                                </Link>
                                                <span className='text-[12.5px] text-muted truncate'>
                                                    {o.description ||
                                                        'No description'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>{channels(o)}</Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                <div className='flex flex-wrap gap-1'>
                                                    <StatusBadge
                                                        status={
                                                            o.submissionStatus
                                                        }
                                                    />
                                                    {o.deleted && (
                                                        <StatusBadge tone='outline'>
                                                            Deleted
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                                {viewsOf(o) > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            viewsOf(o),
                                                        )}{' '}
                                                        views
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDateTime(
                                                        o.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {o.owner?.username
                                                        ? `@${o.owner.username}`
                                                        : 'Unknown poster'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(o)}
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
                        {current.map((o) => (
                            <article
                                key={o._id}
                                onClick={() => navigate(detailPath(o))}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <Link
                                        to={detailPath(o)}
                                        onClick={(e) => e.stopPropagation()}
                                        className='flex-1 min-w-0 font-medium text-ink hover:underline line-clamp-2'
                                    >
                                        {o.name || 'Untitled'}
                                    </Link>
                                    <StatusBadge status={o.submissionStatus} />
                                </div>
                                {o.description && (
                                    <p className='text-[13px] text-ink-2 line-clamp-2'>
                                        {o.description}
                                    </p>
                                )}
                                <div className='flex flex-wrap items-center gap-2'>
                                    {channels(o)}
                                    {o.deleted && (
                                        <StatusBadge tone='outline'>
                                            Deleted
                                        </StatusBadge>
                                    )}
                                </div>
                                <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        {formatShortDateTime(o.createdAt)}
                                        {o.owner?.username &&
                                            ` · @${o.owner.username}`}
                                        {viewsOf(o) > 0 &&
                                            ` · ${formatNumber(viewsOf(o))} views`}
                                    </span>
                                    {rowActions(o)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <OpportunityEditModal
                isOpen={Boolean(editing)}
                onClose={() => setEditing(null)}
                opportunity={editing}
                onSuccess={() => {
                    fetchOpportunities();
                    setEditing(null);
                }}
            />

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText='Delete'
                variant='danger'
            />

            <RejectDialog
                open={Boolean(rejecting)}
                onClose={() => setRejecting(null)}
                title={
                    rejecting?.length > 1
                        ? `Reject ${formatNumber(rejecting.length)} opportunities?`
                        : 'Reject this opportunity?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Every poster gets the same reason, so keep it general.'
                        : 'The poster sees your reason, so say what to fix.'
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default OpportunityList;
