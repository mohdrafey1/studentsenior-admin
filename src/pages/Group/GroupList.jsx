import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    Download,
    ExternalLink,
    MessageSquare,
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
    formatShortDate,
} from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import GroupEditModal from '../../components/GroupEditModal';
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
    domain: '',
    deleted: '',
};

const PAGE_SIZES = [12, 24, 48, 96];

// The model field is `clickCount`; older records may carry `clickCounts`.
const clicksOf = (group) => group.clickCount ?? group.clickCounts ?? 0;

const DomainChip = ({ children }) => (
    <span className='inline-block max-w-full px-2 py-0.5 rounded-md bg-ground text-[12.5px] text-ink-2 truncate'>
        {children}
    </span>
);

const GroupIcon = () => (
    <span className='w-9 h-9 rounded-[10px] bg-ground text-ink-2 flex items-center justify-center shrink-0'>
        <MessageSquare className='w-4 h-4' aria-hidden='true' />
    </span>
);

const GroupList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
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

    const [editingGroup, setEditingGroup] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchGroups = async () => {
        try {
            setError(null);
            const response = await api.get(`/group/all/${collegeslug}`);
            setGroups(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load WhatsApp groups. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
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

    const domains = useMemo(
        () =>
            [...new Set(groups.map((g) => g.domain).filter(Boolean))].sort(
                (a, b) => a.localeCompare(b),
            ),
        [groups],
    );

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (g) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            g.title?.toLowerCase().includes(q) ||
            g.info?.toLowerCase().includes(q) ||
            g.domain?.toLowerCase().includes(q);
        const bool = (filter, value) =>
            filter === '' || (filter === 'true' ? value : !value);
        return (
            matchesSearch &&
            (!filters.domain || g.domain === filters.domain) &&
            filterByTime(g, timeFilter) &&
            bool(filters.deleted, g.deleted)
        );
    };

    const base = groups.filter(matchesFilters);
    const counts = base.reduce(
        (acc, g) => {
            const status = g.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (g) =>
            !filters.submissionStatus ||
            (g.submissionStatus || 'pending') === filters.submissionStatus,
    );
    const sorted = [...filtered].sort((a, b) => {
        const diff =
            sortBy === 'clickCounts'
                ? clicksOf(a) - clicksOf(b)
                : new Date(a.createdAt) - new Date(b.createdAt);
        return sortOrder === 'desc' ? -diff : diff;
    });
    const current = sorted.slice((page - 1) * pageSize, page * pageSize);

    const selection = useSelection(
        useMemo(() => current.map((g) => g._id), [current]),
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
        setGroups((prev) =>
            prev.map((g) => (ids.includes(g._id) ? { ...g, ...patch } : g)),
        );

    // Runs one request per group and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} group${done.length === 1 ? '' : 's'} ${verb}`,
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
                api.put(`/group/edit/${id}`, {
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
                api.put(`/group/edit/${id}`, {
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
                    ? 'Delete this group?'
                    : `Delete ${formatNumber(ids.length)} groups?`,
            message:
                'The invite link disappears from the college page straight away. The WhatsApp group itself isn’t affected. This can’t be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/group/delete/${id}`),
                    'deleted',
                );
                setGroups((prev) => prev.filter((g) => !done.includes(g._id)));
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `whatsapp-groups-${collegeslug}`,
            [
                { label: 'Title', value: (g) => g.title },
                { label: 'Domain', value: (g) => g.domain },
                { label: 'Invite link', value: (g) => g.link },
                {
                    label: 'Status',
                    value: (g) => g.submissionStatus || 'pending',
                },
                { label: 'Rejection reason', value: (g) => g.rejectionReason },
                { label: 'Link clicks', value: (g) => clicksOf(g) },
                { label: 'Deleted', value: (g) => (g.deleted ? 'yes' : 'no') },
                { label: 'Added', value: (g) => formatDateTime(g.createdAt) },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const groupPath = (group) => `/${collegeslug}/groups/${group._id}`;
    const openGroup = (group) => navigate(groupPath(group));
    const stop = (fn) => (event) => {
        event.stopPropagation();
        fn();
    };

    const rowActions = (group) => {
        const pending = (group.submissionStatus || 'pending') === 'pending';
        const title = group.title || 'group';
        return (
            <>
                {group.link && (
                    <Button
                        variant='ghost'
                        size='sm'
                        iconOnly
                        icon={ExternalLink}
                        href={group.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Open ${title} in WhatsApp`}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                {pending ? (
                    <>
                        <Button
                            variant='ghost'
                            size='sm'
                            iconOnly
                            icon={X}
                            aria-label={`Reject ${title}`}
                            className='text-bad-ink hover:text-bad-ink'
                            onClick={stop(() => setRejecting([group._id]))}
                        />
                        <Button
                            variant='ghost'
                            size='sm'
                            iconOnly
                            icon={Check}
                            aria-label={`Approve ${title}`}
                            className='text-ok-ink hover:text-ok-ink'
                            onClick={stop(() => approve([group._id]))}
                        />
                    </>
                ) : (
                    <>
                        <Button
                            variant='ghost'
                            size='sm'
                            iconOnly
                            icon={Pencil}
                            aria-label={`Edit ${title}`}
                            onClick={stop(() => setEditingGroup(group))}
                        />
                        <Button
                            variant='ghost'
                            size='sm'
                            iconOnly
                            icon={Trash2}
                            aria-label={`Delete ${title}`}
                            className='text-bad-ink hover:text-bad-ink'
                            onClick={stop(() => remove([group._id]))}
                        />
                    </>
                )}
            </>
        );
    };

    const badges = (group) => (
        <div className='flex flex-wrap gap-1'>
            <StatusBadge status={group.submissionStatus} />
            {group.deleted && <StatusBadge tone='outline'>Deleted</StatusBadge>}
        </div>
    );

    const pagination = (
        <Pagination
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZES}
            totalItems={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
            }}
        />
    );

    const bulkBar = (
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
    );

    const queueCleared =
        filters.submissionStatus === 'pending' && !activeFilters && !search;
    const empty = (
        <EmptyState
            icon={MessageSquare}
            tone={queueCleared ? 'done' : 'neutral'}
            title={
                groups.length === 0
                    ? 'No groups yet'
                    : queueCleared
                      ? 'Nothing waiting for review'
                      : 'No groups match'
            }
            description={
                groups.length === 0 || queueCleared
                    ? 'New group links from students will appear here.'
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
                title='WhatsApp groups'
                description={`Group invite links students have shared for ${currentCollege?.name || collegeslug}.`}
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
                searchPlaceholder='Search by group name, description or domain'
                filters={[
                    {
                        label: 'Domain',
                        value: filters.domain,
                        onChange: (v) => setFilter('domain', v),
                        options: [
                            { value: '', label: 'Any domain' },
                            ...domains.map((d) => ({ value: d, label: d })),
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
                        { value: 'clickCounts', label: 'Most clicked' },
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
                        <Button size='sm' onClick={fetchGroups}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {viewMode === 'table' ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    {bulkBar}
                    {current.length === 0 ? (
                        empty
                    ) : (
                        <Table minWidth={940}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all groups on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Group</Th>
                                    <Th>Domain</Th>
                                    <Th>Status</Th>
                                    <Th>Added</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((group) => (
                                    <Tr
                                        key={group._id}
                                        selected={selection.isSelected(
                                            group._id,
                                        )}
                                        onClick={() => openGroup(group)}
                                    >
                                        <SelectCell
                                            label={`Select ${group.title || 'group'}`}
                                            checked={selection.isSelected(
                                                group._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(group._id, on)
                                            }
                                        />
                                        <Td className='max-w-[420px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <GroupIcon />
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={groupPath(group)}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {group.title ||
                                                            'Untitled group'}
                                                    </Link>
                                                    <span className='text-[12.5px] text-muted truncate'>
                                                        {group.info ||
                                                            'No description'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className='max-w-[200px]'>
                                            {group.domain ? (
                                                <DomainChip>
                                                    {group.domain}
                                                </DomainChip>
                                            ) : (
                                                <span className='text-muted'>
                                                    —
                                                </span>
                                            )}
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                {badges(group)}
                                                {clicksOf(group) > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            clicksOf(group),
                                                        )}{' '}
                                                        link clicks
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td className='whitespace-nowrap'>
                                            {formatShortDate(group.createdAt)}
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(group)}
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
                    {selection.count > 0 && (
                        <div className='rounded-xl overflow-hidden'>
                            {bulkBar}
                        </div>
                    )}
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
                        {current.map((group) => {
                            const selected = selection.isSelected(group._id);
                            const title = group.title || 'Untitled group';
                            return (
                                <article
                                    key={group._id}
                                    onClick={() => openGroup(group)}
                                    className={`flex flex-col gap-3 p-4 bg-sheet border rounded-xl cursor-pointer transition-colors ${
                                        selected
                                            ? 'border-brand ring-1 ring-brand'
                                            : 'border-line hover:border-line-strong'
                                    }`}
                                >
                                    <div className='flex items-start gap-3'>
                                        <GroupIcon />
                                        <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                            <Link
                                                to={groupPath(group)}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className='font-medium text-ink hover:underline truncate'
                                            >
                                                {title}
                                            </Link>
                                            <span className='text-[12.5px] text-muted line-clamp-2'>
                                                {group.info || 'No description'}
                                            </span>
                                        </div>
                                        <input
                                            type='checkbox'
                                            aria-label={`Select ${title}`}
                                            checked={selected}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) =>
                                                selection.toggle(
                                                    group._id,
                                                    e.target.checked,
                                                )
                                            }
                                            className='mt-1 w-4 h-4 accent-brand cursor-pointer shrink-0'
                                        />
                                    </div>
                                    <div className='flex flex-wrap items-center gap-1.5'>
                                        {badges(group)}
                                        {group.domain && (
                                            <DomainChip>
                                                {group.domain}
                                            </DomainChip>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                        <span className='flex-1 min-w-0 text-xs text-muted truncate'>
                                            {formatShortDate(group.createdAt)}
                                            {clicksOf(group) > 0 &&
                                                ` · ${formatNumber(clicksOf(group))} link clicks`}
                                        </span>
                                        {rowActions(group)}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <GroupEditModal
                isOpen={Boolean(editingGroup)}
                onClose={() => setEditingGroup(null)}
                group={editingGroup}
                onSuccess={fetchGroups}
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
                        ? `Reject ${formatNumber(rejecting.length)} groups?`
                        : 'Reject this group?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Every student who shared one gets the same reason, so keep it general.'
                        : 'The student who shared it sees your reason, so say what to fix.'
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default GroupList;
