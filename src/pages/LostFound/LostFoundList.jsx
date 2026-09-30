import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Check,
    CheckCheck,
    Download,
    ImageIcon,
    Package,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDate,
    formatDateTime,
    formatNumber,
    formatShortDate,
    formatShortDateTime,
} from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import LostFoundEditModal from '../../components/LostFoundEditModal';
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
    type: '',
    currentStatus: '',
    deleted: '',
};

// The model stores `clickCount`; older records may still use `clickCounts`.
const viewsOf = (item) => item.clickCount ?? item.clickCounts ?? 0;

const typeLabel = (type) => (type === 'found' ? 'Found' : 'Lost');

/** "Lost" has an outline, "Found" a filled chip; the word carries the meaning. */
const TypeChip = ({ type }) => (
    <span
        className={`inline-flex items-center h-6 px-2 rounded-md border text-[12.5px] font-medium text-ink whitespace-nowrap ${
            type === 'found'
                ? 'bg-ground border-transparent'
                : 'bg-sheet border-line-strong'
        }`}
    >
        {typeLabel(type)}
    </span>
);

const Thumb = ({ src, size = 'w-11 h-11' }) =>
    src ? (
        <img
            src={src}
            alt=''
            className={`${size} rounded-lg object-cover bg-sunken shrink-0`}
        />
    ) : (
        <span
            aria-hidden='true'
            className={`${size} rounded-lg bg-ground text-muted flex items-center justify-center shrink-0`}
        >
            <ImageIcon className='w-[18px] h-[18px]' />
        </span>
    );

const LostFoundList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [items, setItems] = useState([]);
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

    const fetchItems = async () => {
        try {
            setError(null);
            const response = await api.get(`/lostandfound/all/${collegeslug}`);
            setItems(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load lost and found items. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
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
    const matchesFilters = (item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.location?.toLowerCase().includes(q) ||
            item.owner?.username?.toLowerCase().includes(q);
        return (
            matchesSearch &&
            (!filters.type || item.type === filters.type) &&
            (!filters.currentStatus ||
                item.currentStatus === filters.currentStatus) &&
            (!filters.deleted ||
                String(Boolean(item.deleted)) === filters.deleted) &&
            filterByTime(item, timeFilter)
        );
    };

    const base = items.filter(matchesFilters);
    const counts = base.reduce(
        (acc, item) => {
            const status = item.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );
    const filtered = base.filter(
        (item) =>
            !filters.submissionStatus ||
            (item.submissionStatus || 'pending') === filters.submissionStatus,
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
        useMemo(() => current.map((item) => item._id), [current]),
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
        setItems((prev) =>
            prev.map((item) =>
                ids.includes(item._id) ? { ...item, ...patch } : item,
            ),
        );

    // Runs one request per item and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} item${done.length === 1 ? '' : 's'} ${verb}`,
            );
        if (failed)
            toast.error(
                `${formatNumber(failed)} couldn’t be ${verb}. Try those again.`,
            );
        return done;
    };

    const edit = (id, body) => api.put(`/lostandfound/edit/${id}`, body);

    const approve = async (ids) => {
        const patch = { submissionStatus: 'approved', rejectionReason: '' };
        const done = await runBulk(ids, (id) => edit(id, patch), 'approved');
        updateLocal(done, patch);
        selection.clear();
    };

    const reject = async (ids, reason) => {
        const patch = { submissionStatus: 'rejected', rejectionReason: reason };
        const done = await runBulk(ids, (id) => edit(id, patch), 'rejected');
        updateLocal(done, patch);
        selection.clear();
        setRejecting(null);
    };

    const close = async (ids) => {
        const patch = { currentStatus: 'closed' };
        const done = await runBulk(ids, (id) => edit(id, patch), 'closed');
        updateLocal(done, patch);
        selection.clear();
    };

    const remove = (ids) =>
        setConfirm({
            title:
                ids.length === 1
                    ? 'Delete this item?'
                    : `Delete ${formatNumber(ids.length)} items?`,
            message:
                'The post disappears for students straight away, along with its photo and contact number. This can’t be undone.',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/lostandfound/delete/${id}`),
                    'deleted',
                );
                setItems((prev) =>
                    prev.filter((item) => !done.includes(item._id)),
                );
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `lost-and-found-${collegeslug}`,
            [
                { label: 'Title', value: (i) => i.title },
                { label: 'Description', value: (i) => i.description },
                { label: 'Type', value: (i) => typeLabel(i.type) },
                { label: 'State', value: (i) => i.currentStatus || 'open' },
                { label: 'Location', value: (i) => i.location },
                { label: 'Date', value: (i) => formatDate(i.date) },
                {
                    label: 'Status',
                    value: (i) => i.submissionStatus || 'pending',
                },
                { label: 'Rejection reason', value: (i) => i.rejectionReason },
                { label: 'Views', value: viewsOf },
                { label: 'Posted by', value: (i) => i.owner?.username },
                { label: 'Posted', value: (i) => formatDateTime(i.createdAt) },
                { label: 'Deleted', value: (i) => (i.deleted ? 'yes' : 'no') },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const detailPath = (item) => `/${collegeslug}/lost-found/${item._id}`;
    const stop = (fn) => (event) => {
        event.stopPropagation();
        fn();
    };
    const isClosed = (item) => item.currentStatus === 'closed';

    const rowActions = (item) =>
        (item.submissionStatus || 'pending') === 'pending' ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${item.title}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => setRejecting([item._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${item.title}`}
                    className='text-ok-ink hover:text-ok-ink'
                    onClick={stop(() => approve([item._id]))}
                />
            </>
        ) : (
            <>
                {!isClosed(item) && (
                    <Button
                        size='sm'
                        icon={Check}
                        disabled={bulkBusy}
                        aria-label={`Close ${item.title}`}
                        onClick={stop(() => close([item._id]))}
                    >
                        Close
                    </Button>
                )}
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Pencil}
                    aria-label={`Edit ${item.title}`}
                    onClick={stop(() => setEditing(item))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${item.title}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([item._id]))}
                />
            </>
        );

    const badges = (item) => (
        <div className='flex flex-wrap gap-1'>
            <StatusBadge status={item.submissionStatus} />
            {isClosed(item) && <StatusBadge status='closed' />}
            {item.deleted && <StatusBadge tone='outline'>Deleted</StatusBadge>}
        </div>
    );

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
            icon={Package}
            tone={reviewQueue ? 'done' : 'neutral'}
            title={
                items.length === 0
                    ? 'No lost or found items yet'
                    : reviewQueue
                      ? 'Nothing waiting for review'
                      : 'No items match'
            }
            description={
                items.length === 0 || reviewQueue
                    ? 'Items students report as lost or found on campus appear here.'
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
                title='Lost & found'
                description={`Items students have lost or found at ${currentCollege?.name || collegeslug}. Close them once they are back with their owner.`}
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
                searchPlaceholder='Search by item, description, place or who posted it'
                filters={[
                    {
                        label: 'Type',
                        value: filters.type,
                        onChange: (v) => setFilter('type', v),
                        options: [
                            { value: '', label: 'Lost and found' },
                            { value: 'lost', label: 'Lost' },
                            { value: 'found', label: 'Found' },
                        ],
                    },
                    {
                        label: 'Item state',
                        value: filters.currentStatus,
                        onChange: (v) => setFilter('currentStatus', v),
                        options: [
                            { value: '', label: 'Open or closed' },
                            { value: 'open', label: 'Open' },
                            { value: 'closed', label: 'Closed' },
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
                        <Button size='sm' onClick={fetchItems}>
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
                            icon={CheckCheck}
                            disabled={bulkBusy}
                            onClick={() => close(selectedIds)}
                        >
                            Close
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
                        <Table minWidth={1080}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all items on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Item</Th>
                                    <Th>Type</Th>
                                    <Th>Where · when</Th>
                                    <Th>Status</Th>
                                    <Th>Posted</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((item) => (
                                    <Tr
                                        key={item._id}
                                        selected={selection.isSelected(
                                            item._id,
                                        )}
                                        onClick={() =>
                                            navigate(detailPath(item))
                                        }
                                    >
                                        <SelectCell
                                            label={`Select ${item.title}`}
                                            checked={selection.isSelected(
                                                item._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(item._id, on)
                                            }
                                        />
                                        <Td className='max-w-[360px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <Thumb src={item.imageUrl} />
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={detailPath(item)}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className={`font-medium hover:underline truncate ${
                                                            isClosed(item)
                                                                ? 'text-ink-2'
                                                                : 'text-ink'
                                                        }`}
                                                    >
                                                        {item.title ||
                                                            'Untitled item'}
                                                    </Link>
                                                    <span className='text-[12.5px] text-muted truncate'>
                                                        {item.description ||
                                                            'No description'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <TypeChip type={item.type} />
                                        </Td>
                                        <Td className='max-w-[220px]'>
                                            <div className='flex flex-col gap-0.5 min-w-0'>
                                                <span className='truncate'>
                                                    {item.location ||
                                                        'Place not given'}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {item.date
                                                        ? `${typeLabel(item.type)} on ${formatShortDate(item.date)}`
                                                        : 'Date not given'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>{badges(item)}</Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='whitespace-nowrap'>
                                                    {formatShortDateTime(
                                                        item.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted whitespace-nowrap'>
                                                    {item.owner?.username
                                                        ? `@${item.owner.username}`
                                                        : 'Unknown poster'}
                                                    {` · ${formatNumber(viewsOf(item))} views`}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end items-center gap-1'>
                                                {rowActions(item)}
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
                        {current.map((item) => (
                            <article
                                key={item._id}
                                onClick={() => navigate(detailPath(item))}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-3'>
                                    <Thumb src={item.imageUrl} />
                                    <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <Link
                                            to={detailPath(item)}
                                            onClick={(e) => e.stopPropagation()}
                                            className='font-medium text-ink hover:underline line-clamp-2'
                                        >
                                            {item.title || 'Untitled item'}
                                        </Link>
                                        <span className='text-[12.5px] text-muted truncate'>
                                            {[
                                                item.location,
                                                item.date &&
                                                    formatShortDate(item.date),
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </div>
                                    <TypeChip type={item.type} />
                                </div>
                                {item.description && (
                                    <p className='text-[13px] text-ink-2 line-clamp-2'>
                                        {item.description}
                                    </p>
                                )}
                                {badges(item)}
                                <div className='flex items-center gap-2 pt-3 mt-auto border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted truncate'>
                                        {formatShortDateTime(item.createdAt)}
                                        {item.owner?.username &&
                                            ` · @${item.owner.username}`}
                                    </span>
                                    {rowActions(item)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <LostFoundEditModal
                isOpen={Boolean(editing)}
                onClose={() => setEditing(null)}
                item={editing}
                onSuccess={() => {
                    fetchItems();
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
                        ? `Reject ${formatNumber(rejecting.length)} items?`
                        : 'Reject this item?'
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

export default LostFoundList;
