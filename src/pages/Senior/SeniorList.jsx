import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Download, Pencil, Trash2, Users, X } from 'lucide-react';
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
import SeniorEditModal from '../../components/SeniorEditModal';
import SeniorAvatar from './SeniorAvatar';
import {
    branchLabel,
    linksLabel,
    platformOf,
    seniorLinks,
    viewsOf,
} from './seniorLinks';
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
    branch: '',
    year: '',
    deleted: '',
};

const PAGE_SIZES = [12, 24, 48, 96];

const uniqueSorted = (values) =>
    [...new Set(values.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), 'en', { numeric: true }),
    );

const SeniorList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [seniors, setSeniors] = useState([]);
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

    const [editingSenior, setEditingSenior] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchSeniors = async () => {
        try {
            setError(null);
            const response = await api.get(`/senior/all/${collegeslug}`);
            setSeniors(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load seniors. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeniors();
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

    const branches = useMemo(
        () => uniqueSorted(seniors.map(branchLabel)),
        [seniors],
    );
    const years = useMemo(
        () => uniqueSorted(seniors.map((s) => s.year)),
        [seniors],
    );

    // Everything except the status tab, so tab counts reflect the other filters.
    const matchesFilters = (s) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            s.name?.toLowerCase().includes(q) ||
            s.domain?.toLowerCase().includes(q) ||
            s.branch?.branchCode?.toLowerCase().includes(q) ||
            s.branch?.branchName?.toLowerCase().includes(q);
        const bool = (filter, value) =>
            filter === '' || (filter === 'true' ? value : !value);
        return (
            matchesSearch &&
            (!filters.branch || branchLabel(s) === filters.branch) &&
            (!filters.year || s.year === filters.year) &&
            filterByTime(s, timeFilter) &&
            bool(filters.deleted, s.deleted)
        );
    };

    const base = seniors.filter(matchesFilters);
    const counts = base.reduce(
        (acc, s) => {
            const status = s.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (s) =>
            !filters.submissionStatus ||
            (s.submissionStatus || 'pending') === filters.submissionStatus,
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
        useMemo(() => current.map((s) => s._id), [current]),
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
        setSeniors((prev) =>
            prev.map((s) => (ids.includes(s._id) ? { ...s, ...patch } : s)),
        );

    // Runs one request per senior and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} senior${done.length === 1 ? '' : 's'} ${verb}`,
            );
        if (failed) {
            const reason = results.find((r) => r.status === 'rejected')?.reason
                ?.response?.data?.message;
            toast.error(
                `${formatNumber(failed)} couldn’t be ${verb}.${reason ? ` ${reason}.` : ' Try those again.'}`,
            );
        }
        return done;
    };

    const approve = async (ids) => {
        const done = await runBulk(
            ids,
            (id) =>
                api.put(`/senior/edit/${id}`, {
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
                api.put(`/senior/edit/${id}`, {
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
                    ? 'Delete this senior?'
                    : `Delete ${formatNumber(ids.length)} seniors?`,
            message:
                'Their profile leaves the seniors directory straight away and juniors can no longer reach them through it. This can’t be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/senior/delete/${id}`),
                    'deleted',
                );
                setSeniors((prev) => prev.filter((s) => !done.includes(s._id)));
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `seniors-${collegeslug}`,
            [
                { label: 'Name', value: (s) => s.name },
                { label: 'Domain', value: (s) => s.domain },
                { label: 'Branch', value: (s) => s.branch?.branchName },
                { label: 'Course', value: (s) => s.branch?.course?.courseName },
                { label: 'Year', value: (s) => s.year },
                {
                    label: 'Status',
                    value: (s) => s.submissionStatus || 'pending',
                },
                {
                    label: 'Links',
                    value: (s) =>
                        seniorLinks(s)
                            .map(
                                (l) =>
                                    `${platformOf(l.platform).label}: ${l.url}`,
                            )
                            .join(' | '),
                },
                { label: 'Views', value: (s) => viewsOf(s) },
                { label: 'Added by', value: (s) => s.owner?.username },
                { label: 'Added', value: (s) => formatDateTime(s.createdAt) },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const seniorPath = (senior) => `/${collegeslug}/seniors/${senior._id}`;
    const openSenior = (senior) => navigate(seniorPath(senior));
    const stop = (fn) => (event) => {
        event.stopPropagation();
        fn();
    };

    const rowActions = (senior) => {
        const pending = (senior.submissionStatus || 'pending') === 'pending';
        const name = senior.name || 'senior';
        return pending ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => setRejecting([senior._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${name}`}
                    className='text-ok-ink hover:text-ok-ink'
                    onClick={stop(() => approve([senior._id]))}
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
                    onClick={stop(() => setEditingSenior(senior))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([senior._id]))}
                />
            </>
        );
    };

    const badges = (senior) => (
        <div className='flex flex-wrap gap-1'>
            <StatusBadge status={senior.submissionStatus} />
            {senior.deleted && (
                <StatusBadge tone='outline'>Deleted</StatusBadge>
            )}
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
            icon={Users}
            tone={queueCleared ? 'done' : 'neutral'}
            title={
                seniors.length === 0
                    ? 'No seniors yet'
                    : queueCleared
                      ? 'Nothing waiting for review'
                      : 'No seniors match'
            }
            description={
                seniors.length === 0
                    ? 'Profiles that seniors and alumni submit for this college appear here.'
                    : 'Try another search or clear the filters.'
            }
            action={
                activeFilters || search ? (
                    <Button onClick={clearAll}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    const branchYear = (senior) =>
        [branchLabel(senior), senior.year].filter(Boolean).join(' · ');

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Seniors'
                description={`Senior students and alumni who have offered to guide juniors at ${currentCollege?.name || collegeslug}.`}
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
                searchPlaceholder='Search by name, domain or branch'
                filters={[
                    {
                        label: 'Branch',
                        value: filters.branch,
                        onChange: (v) => setFilter('branch', v),
                        options: [
                            { value: '', label: 'Any branch' },
                            ...branches.map((b) => ({ value: b, label: b })),
                        ],
                    },
                    {
                        label: 'Year',
                        value: filters.year,
                        onChange: (v) => setFilter('year', v),
                        options: [
                            { value: '', label: 'Any year' },
                            ...years.map((y) => ({ value: y, label: y })),
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
                        <Button size='sm' onClick={fetchSeniors}>
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
                        <Table minWidth={1000}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all seniors on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Senior</Th>
                                    <Th>Branch · Year</Th>
                                    <Th>Profiles linked</Th>
                                    <Th>Status</Th>
                                    <Th>Added</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((senior) => (
                                    <Tr
                                        key={senior._id}
                                        selected={selection.isSelected(
                                            senior._id,
                                        )}
                                        onClick={() => openSenior(senior)}
                                    >
                                        <SelectCell
                                            label={`Select ${senior.name || 'senior'}`}
                                            checked={selection.isSelected(
                                                senior._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(senior._id, on)
                                            }
                                        />
                                        <Td className='max-w-[320px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <SeniorAvatar
                                                    name={senior.name}
                                                    src={senior.profilePicture}
                                                />
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={seniorPath(senior)}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {senior.name ||
                                                            'Unnamed senior'}
                                                    </Link>
                                                    <span className='text-[12.5px] text-muted truncate'>
                                                        {senior.domain ||
                                                            'No domain given'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span>
                                                    {branchLabel(senior) || '—'}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {senior.year || '—'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td className='text-[13px] text-ink-2'>
                                            {linksLabel(senior)}
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                {badges(senior)}
                                                {viewsOf(senior) > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            viewsOf(senior),
                                                        )}{' '}
                                                        profile views
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDate(
                                                        senior.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {senior.owner?.username
                                                        ? `@${senior.owner.username}`
                                                        : 'Unknown account'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(senior)}
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
                        {current.map((senior) => {
                            const selected = selection.isSelected(senior._id);
                            const name = senior.name || 'Unnamed senior';
                            return (
                                <article
                                    key={senior._id}
                                    onClick={() => openSenior(senior)}
                                    className={`flex flex-col gap-3 p-4 bg-sheet border rounded-xl cursor-pointer transition-colors ${
                                        selected
                                            ? 'border-brand ring-1 ring-brand'
                                            : 'border-line hover:border-line-strong'
                                    }`}
                                >
                                    <div className='flex items-start gap-3'>
                                        <SeniorAvatar
                                            size='lg'
                                            name={senior.name}
                                            src={senior.profilePicture}
                                        />
                                        <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                            <Link
                                                to={seniorPath(senior)}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className='font-medium text-ink hover:underline truncate'
                                            >
                                                {name}
                                            </Link>
                                            <span className='text-[12.5px] text-muted truncate'>
                                                {senior.domain ||
                                                    'No domain given'}
                                            </span>
                                            <div className='mt-1'>
                                                {badges(senior)}
                                            </div>
                                        </div>
                                        <input
                                            type='checkbox'
                                            aria-label={`Select ${name}`}
                                            checked={selected}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) =>
                                                selection.toggle(
                                                    senior._id,
                                                    e.target.checked,
                                                )
                                            }
                                            className='mt-1 w-4 h-4 accent-brand cursor-pointer shrink-0'
                                        />
                                    </div>
                                    <div className='flex flex-col gap-1 text-[13px] text-ink-2'>
                                        <span>
                                            {branchYear(senior) ||
                                                'Branch and year not given'}
                                        </span>
                                        <span className='text-muted'>
                                            {seniorLinks(senior).length
                                                ? linksLabel(senior)
                                                : 'No profiles linked'}
                                            {viewsOf(senior) > 0 &&
                                                ` · ${formatNumber(viewsOf(senior))} views`}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                        <span className='flex-1 min-w-0 text-xs text-muted truncate'>
                                            {formatShortDate(senior.createdAt)}
                                            {senior.owner?.username &&
                                                ` · @${senior.owner.username}`}
                                        </span>
                                        {rowActions(senior)}
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

            <SeniorEditModal
                isOpen={Boolean(editingSenior)}
                onClose={() => setEditingSenior(null)}
                senior={editingSenior}
                onSuccess={fetchSeniors}
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
                        ? `Reject ${formatNumber(rejecting.length)} seniors?`
                        : 'Reject this senior?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Every senior gets the same reason, so keep it general. Use at least 10 characters.'
                        : 'The senior sees your reason, so say what to fix. Use at least 10 characters.'
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default SeniorList;
