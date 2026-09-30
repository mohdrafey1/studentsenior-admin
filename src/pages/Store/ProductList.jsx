import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Download, Pencil, ShoppingBag, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { useColleges } from '../../context/CollegeContext';
import { useSelection } from '../../hooks/useSelection';
import { downloadCsv } from '../../utils/csv';
import {
    formatDateTime,
    formatINR,
    formatNumber,
    formatShortDate,
    formatShortDateTime,
} from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import RejectDialog from '../../components/RejectDialog';
import ProductEditModal from '../../components/ProductEditModal';
import Price from './Price';
import ProductImage from './ProductImage';
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
    available: '',
    deleted: '',
};

const PAGE_SIZES = [12, 24, 48, 96];

// The model field is `clickCount`; older records may carry `clickCounts`.
const viewsOf = (product) => product.clickCount ?? product.clickCounts ?? 0;

// "6 h ago" for the last two days, then "21 Sep".
const listedAgo = (date) =>
    Date.now() - new Date(date) < 2 * 864e5
        ? relativeTime(date)
        : formatShortDate(date);

const UnavailableBadge = () => (
    <span className='inline-flex items-center h-[22px] px-2 rounded-full bg-inverse text-on-inverse text-xs font-medium whitespace-nowrap'>
        Unavailable
    </span>
);

const ProductList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collegeslug } = useParams();
    const { currentCollege } = useColleges();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [products, setProducts] = useState([]);
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
    // Photos read best as cards, so the store opens in the grid.
    const [viewMode, setViewMode] = useState('grid');

    const [editingProduct, setEditingProduct] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [rejecting, setRejecting] = useState(null); // array of ids
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchProducts = async () => {
        try {
            setError(null);
            const response = await api.get(`/store/all/${collegeslug}`);
            setProducts(response.data.data || []);
        } catch {
            setError(
                'Couldn’t load the store. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
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
    const matchesFilters = (p) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q);
        const bool = (filter, value) =>
            filter === '' || (filter === 'true' ? value : !value);
        return (
            matchesSearch &&
            filterByTime(p, timeFilter) &&
            bool(filters.available, p.available) &&
            bool(filters.deleted, p.deleted)
        );
    };

    const base = products.filter(matchesFilters);
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
                ? viewsOf(a) - viewsOf(b)
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
        setProducts((prev) =>
            prev.map((p) => (ids.includes(p._id) ? { ...p, ...patch } : p)),
        );

    // Runs one request per product and reports how many went through.
    const runBulk = async (ids, request, verb) => {
        setBulkBusy(true);
        const results = await Promise.allSettled(ids.map(request));
        setBulkBusy(false);
        const done = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failed = ids.length - done.length;
        if (done.length)
            toast.success(
                `${formatNumber(done.length)} listing${done.length === 1 ? '' : 's'} ${verb}`,
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
                api.put(`/store/edit/${id}`, {
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
                api.put(`/store/edit/${id}`, {
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
                    ? 'Delete this listing?'
                    : `Delete ${formatNumber(ids.length)} listings?`,
            message:
                'The listing disappears from the store and buyers can no longer contact the seller through it. This can’t be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const done = await runBulk(
                    ids,
                    (id) => api.delete(`/store/delete/${id}`),
                    'deleted',
                );
                setProducts((prev) =>
                    prev.filter((p) => !done.includes(p._id)),
                );
                selection.clear();
            },
        });

    const exportCsv = () =>
        downloadCsv(
            `store-${collegeslug}`,
            [
                { label: 'Name', value: (p) => p.name },
                { label: 'Price (₹)', value: (p) => p.price || 0 },
                {
                    label: 'Status',
                    value: (p) => p.submissionStatus || 'pending',
                },
                {
                    label: 'Available',
                    value: (p) => (p.available ? 'yes' : 'no'),
                },
                { label: 'Deleted', value: (p) => (p.deleted ? 'yes' : 'no') },
                { label: 'Views', value: (p) => viewsOf(p) },
                { label: 'Seller', value: (p) => p.owner?.username },
                { label: 'Rejection reason', value: (p) => p.rejectionReason },
                { label: 'Listed', value: (p) => formatDateTime(p.createdAt) },
            ],
            sorted,
        );

    if (loading) return <Loader />;

    const selectedIds = [...selection.selected];
    const productPath = (product) => `/${collegeslug}/products/${product._id}`;
    const openProduct = (product) => navigate(productPath(product));
    const stop = (fn) => (event) => {
        event.stopPropagation();
        fn();
    };

    const rowActions = (product) => {
        const pending = (product.submissionStatus || 'pending') === 'pending';
        const name = product.name || 'listing';
        return pending ? (
            <>
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={X}
                    aria-label={`Reject ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => setRejecting([product._id]))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Check}
                    aria-label={`Approve ${name}`}
                    className='text-ok-ink hover:text-ok-ink'
                    onClick={stop(() => approve([product._id]))}
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
                    onClick={stop(() => setEditingProduct(product))}
                />
                <Button
                    variant='ghost'
                    size='sm'
                    iconOnly
                    icon={Trash2}
                    aria-label={`Delete ${name}`}
                    className='text-bad-ink hover:text-bad-ink'
                    onClick={stop(() => remove([product._id]))}
                />
            </>
        );
    };

    const views = (product) => {
        const count = viewsOf(product);
        if (count > 0) return `${formatNumber(count)} views`;
        return (product.submissionStatus || 'pending') === 'approved'
            ? 'No views yet'
            : 'Not live yet';
    };

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
            icon={ShoppingBag}
            tone={queueCleared ? 'done' : 'neutral'}
            title={
                products.length === 0
                    ? 'No listings yet'
                    : queueCleared
                      ? 'Nothing waiting for review'
                      : 'No listings match'
            }
            description={
                products.length === 0
                    ? 'Items students put up for sale at this college appear here.'
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
                title='Store'
                description={`Second-hand books, calculators and kits that ${currentCollege?.name || collegeslug} students are selling to each other.`}
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
                searchPlaceholder='Search by name or description'
                filters={[
                    {
                        label: 'Availability',
                        value: filters.available,
                        onChange: (v) => setFilter('available', v),
                        options: [
                            { value: '', label: 'Any availability' },
                            { value: 'true', label: 'Available' },
                            { value: 'false', label: 'Unavailable' },
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
                        <Button size='sm' onClick={fetchProducts}>
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
                        <Table minWidth={960}>
                            <thead>
                                <tr>
                                    <SelectCell
                                        header
                                        label='Select all listings on this page'
                                        checked={selection.allVisible}
                                        indeterminate={selection.someVisible}
                                        onChange={selection.toggleAllVisible}
                                    />
                                    <Th>Listing</Th>
                                    <Th>Price</Th>
                                    <Th>Status</Th>
                                    <Th>Listed</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((product) => (
                                    <Tr
                                        key={product._id}
                                        selected={selection.isSelected(
                                            product._id,
                                        )}
                                        onClick={() => openProduct(product)}
                                    >
                                        <SelectCell
                                            label={`Select ${product.name || 'listing'}`}
                                            checked={selection.isSelected(
                                                product._id,
                                            )}
                                            onChange={(on) =>
                                                selection.toggle(
                                                    product._id,
                                                    on,
                                                )
                                            }
                                        />
                                        <Td className='max-w-[380px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <ProductImage
                                                    src={product.image}
                                                    className='w-11 h-11 rounded-lg shrink-0'
                                                    iconClassName='w-4 h-4'
                                                />
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <Link
                                                        to={productPath(
                                                            product,
                                                        )}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className='font-medium text-ink hover:underline truncate'
                                                    >
                                                        {product.name ||
                                                            'Untitled listing'}
                                                    </Link>
                                                    <span className='text-[12.5px] text-muted truncate'>
                                                        {product.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='font-mono text-[13px]'>
                                                    {formatINR(product.price)}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {product.available
                                                        ? 'Available'
                                                        : 'Unavailable'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className='flex flex-col items-start gap-1'>
                                                <div className='flex flex-wrap gap-1'>
                                                    <StatusBadge
                                                        status={
                                                            product.submissionStatus
                                                        }
                                                    />
                                                    {product.deleted && (
                                                        <StatusBadge tone='outline'>
                                                            Deleted
                                                        </StatusBadge>
                                                    )}
                                                </div>
                                                {viewsOf(product) > 0 && (
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            viewsOf(product),
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
                                                        product.createdAt,
                                                    )}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {product.owner?.username
                                                        ? `@${product.owner.username}`
                                                        : 'Unknown seller'}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right'>
                                            <div className='flex justify-end gap-1'>
                                                {rowActions(product)}
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
                    <div className='grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {current.map((product) => {
                            const pending =
                                (product.submissionStatus || 'pending') ===
                                'pending';
                            const selected = selection.isSelected(product._id);
                            const name = product.name || 'Untitled listing';
                            return (
                                <article
                                    key={product._id}
                                    onClick={() => openProduct(product)}
                                    className={`flex flex-col bg-sheet border rounded-xl overflow-hidden cursor-pointer transition-colors ${
                                        selected
                                            ? 'border-brand ring-1 ring-brand'
                                            : 'border-line hover:border-line-strong'
                                    }`}
                                >
                                    <div className='relative'>
                                        <ProductImage
                                            src={product.image}
                                            className='w-full aspect-[4/3]'
                                        />
                                        <div className='absolute top-2.5 left-2.5 right-12 flex flex-wrap gap-1.5'>
                                            <StatusBadge
                                                status={
                                                    product.submissionStatus
                                                }
                                            />
                                            {!product.available && (
                                                <UnavailableBadge />
                                            )}
                                            {product.deleted && (
                                                <StatusBadge tone='outline'>
                                                    Deleted
                                                </StatusBadge>
                                            )}
                                        </div>
                                        <label
                                            onClick={(e) => e.stopPropagation()}
                                            className='absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-sheet/90 border border-line cursor-pointer'
                                        >
                                            <input
                                                type='checkbox'
                                                aria-label={`Select ${name}`}
                                                checked={selected}
                                                onChange={(e) =>
                                                    selection.toggle(
                                                        product._id,
                                                        e.target.checked,
                                                    )
                                                }
                                                className='w-4 h-4 accent-brand cursor-pointer'
                                            />
                                        </label>
                                    </div>
                                    <div className='flex-1 flex flex-col gap-1.5 px-3.5 pt-3 pb-1.5'>
                                        <div className='flex items-baseline gap-2'>
                                            <Link
                                                to={productPath(product)}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className='flex-1 min-w-0 text-sm font-medium leading-snug text-ink hover:underline line-clamp-2'
                                            >
                                                {name}
                                            </Link>
                                            <Price
                                                value={product.price}
                                                className='text-[17px] whitespace-nowrap'
                                            />
                                        </div>
                                        <span className='text-xs text-muted'>
                                            {[
                                                product.owner?.username &&
                                                    `@${product.owner.username}`,
                                                listedAgo(product.createdAt),
                                                views(product),
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </div>
                                    {pending ? (
                                        <div className='flex gap-1.5 px-3 pt-1.5 pb-3'>
                                            <Button
                                                size='sm'
                                                icon={X}
                                                className='flex-1 text-bad-ink'
                                                aria-label={`Reject ${name}`}
                                                onClick={stop(() =>
                                                    setRejecting([product._id]),
                                                )}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='primary'
                                                icon={Check}
                                                className='flex-1'
                                                aria-label={`Approve ${name}`}
                                                onClick={stop(() =>
                                                    approve([product._id]),
                                                )}
                                            >
                                                Approve
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className='flex items-center gap-0.5 px-2 pt-1 pb-2'>
                                            <span
                                                className={`flex-1 min-w-0 pl-1.5 text-[12.5px] truncate ${
                                                    product.submissionStatus ===
                                                    'rejected'
                                                        ? 'text-bad-ink'
                                                        : 'text-ink-2'
                                                }`}
                                            >
                                                {product.submissionStatus ===
                                                'rejected'
                                                    ? product.rejectionReason
                                                        ? `Rejected: ${product.rejectionReason}`
                                                        : 'Rejected'
                                                    : product.available
                                                      ? 'Available'
                                                      : 'Unavailable'}
                                            </span>
                                            {rowActions(product)}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <ProductEditModal
                isOpen={Boolean(editingProduct)}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                onSuccess={fetchProducts}
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
                        ? `Reject ${formatNumber(rejecting.length)} listings?`
                        : 'Reject this listing?'
                }
                description={
                    rejecting?.length > 1
                        ? 'Every seller gets the same reason, so keep it general.'
                        : 'The seller sees your reason, so say what to fix.'
                }
                onSubmit={(reason) => reject(rejecting, reason)}
            />
        </div>
    );
};

export default ProductList;
