import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Download,
    ShieldBan,
    ShieldCheck,
    Users as UsersIcon,
} from 'lucide-react';
import api from '../../utils/api';
import { downloadCsv } from '../../utils/csv';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Loader from '../../components/Common/Loader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Alert,
    Avatar,
    Button,
    EmptyState,
    PageHeader,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';

// Tab value is the `blockedFilter` URL param: '' all, 'false' active, 'true' blocked.
const STATUS_TABS = [
    ['', 'All'],
    ['false', 'Active'],
    ['true', 'Blocked'],
];

const wallet = (u, key) => Number(u.wallet?.[key] || 0);
const displayName = (u) => u.username || u.name || 'Unnamed user';

const UsersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(() => {
        const p = parseInt(params.get('page') || '1', 10);
        return Number.isFinite(p) && p > 0 ? p : 1;
    });
    const [pageSize, setPageSize] = useState(() => {
        const ps = parseInt(params.get('pageSize') || '12', 10);
        return Number.isFinite(ps) && ps > 0 ? ps : 12;
    });
    const [blockedFilter, setBlockedFilter] = useState(
        params.get('blockedFilter') || '',
    );
    const [timeFilter, setTimeFilter] = useState(
        params.get('timeFilter') || 'all',
    );
    const [sortBy, setSortBy] = useState(
        params.get('sortBy') === 'points' ? 'points' : 'createdAt',
    );
    const [sortOrder, setSortOrder] = useState(
        params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
    );
    const [viewMode, setViewMode] = useState(() => {
        const view = params.get('view');
        if (view === 'grid' || view === 'table') return view;
        return window.innerWidth >= 1024 ? 'table' : 'grid';
    });
    const [confirm, setConfirm] = useState(null);

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/user/users');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError(
                'Couldn’t load users. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Persist filters in the URL.
    useEffect(() => {
        const next = new URLSearchParams(location.search);
        next.set('search', search || '');
        next.set('page', String(page));
        next.set('pageSize', String(pageSize));
        next.set('blockedFilter', blockedFilter || '');
        next.set('timeFilter', timeFilter || '');
        next.set('sortBy', sortBy);
        next.set('sortOrder', sortOrder);
        next.set('view', viewMode);
        const nextSearch = next.toString();
        if (nextSearch !== location.search.replace(/^\?/, '')) {
            navigate({ search: nextSearch }, { replace: true });
        }
    }, [
        search,
        page,
        pageSize,
        blockedFilter,
        timeFilter,
        sortBy,
        sortOrder,
        viewMode,
        location.search,
        navigate,
    ]);

    // Everything except the status tab, so tab counts reflect the other filters.
    const base = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((u) => {
            const email = (u.email || '').toLowerCase();
            const name = (u.username || u.name || '').toLowerCase();
            const matchesSearch = !q || email.includes(q) || name.includes(q);
            return matchesSearch && filterByTime(u, timeFilter || 'all');
        });
    }, [items, search, timeFilter]);

    const counts = useMemo(
        () => ({
            '': base.length,
            true: base.filter((u) => u.blocked).length,
            false: base.filter((u) => !u.blocked).length,
        }),
        [base],
    );

    const filteredAndSorted = useMemo(
        () =>
            base
                .filter(
                    (u) =>
                        blockedFilter === '' ||
                        String(!!u.blocked) === blockedFilter,
                )
                .sort((a, b) => {
                    const aVal =
                        sortBy === 'points'
                            ? wallet(a, 'currentBalance')
                            : new Date(a.createdAt || 0).getTime();
                    const bVal =
                        sortBy === 'points'
                            ? wallet(b, 'currentBalance')
                            : new Date(b.createdAt || 0).getTime();
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                }),
        [base, blockedFilter, sortBy, sortOrder],
    );

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    const updateItem = (id, partial) =>
        setItems((prev) =>
            prev.map((u) => (u._id === id ? { ...u, ...partial } : u)),
        );

    const askBlock = (u) =>
        setConfirm({
            title: `Block @${displayName(u)}?`,
            message:
                'They can’t use their StudentSenior account until you unblock them.',
            confirmText: 'Block user',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.patch(`/user/users/${u._id}/block`);
                    updateItem(u._id, { blocked: true });
                    toast.success('User blocked');
                } catch (e) {
                    console.error(e);
                    toast.error('Couldn’t block the user. Try again.');
                }
            },
        });

    const askUnblock = (u) =>
        setConfirm({
            title: `Unblock @${displayName(u)}?`,
            message: 'They can use their account again straight away.',
            confirmText: 'Unblock user',
            variant: 'info',
            onConfirm: async () => {
                try {
                    await api.patch(`/user/users/${u._id}/unblock`);
                    updateItem(u._id, { blocked: false });
                    toast.success('User unblocked');
                } catch (e) {
                    console.error(e);
                    toast.error('Couldn’t unblock the user. Try again.');
                }
            },
        });

    const exportCsv = () =>
        downloadCsv(
            'users',
            [
                { label: 'Username', value: (u) => u.username },
                { label: 'Email', value: (u) => u.email },
                { label: 'College', value: (u) => u.college },
                { label: 'Phone', value: (u) => u.phone },
                {
                    label: 'Status',
                    value: (u) => (u.blocked ? 'blocked' : 'active'),
                },
                {
                    label: 'Earned (points)',
                    value: (u) => wallet(u, 'totalEarning'),
                },
                {
                    label: 'Balance (points)',
                    value: (u) => wallet(u, 'currentBalance'),
                },
                {
                    label: 'Redeemed (points)',
                    value: (u) => wallet(u, 'totalWithdrawal'),
                },
                {
                    label: 'Premium until',
                    value: (u) =>
                        u.isPremium && u.premiumExpiryDate
                            ? formatDate(u.premiumExpiryDate)
                            : '',
                },
                { label: 'Joined', value: (u) => formatDateTime(u.createdAt) },
            ],
            filteredAndSorted,
        );

    if (loading) return <Loader />;

    const hasFilters = Boolean(search || (timeFilter && timeFilter !== 'all'));
    const clearFilters = () => {
        setSearch('');
        setTimeFilter('all');
        setPage(1);
    };

    const blockButton = (u) => (
        <Button
            variant='ghost'
            size='sm'
            iconOnly
            icon={u.blocked ? ShieldCheck : ShieldBan}
            aria-label={`${u.blocked ? 'Unblock' : 'Block'} ${displayName(u)}`}
            title={u.blocked ? 'Unblock' : 'Block'}
            className={
                u.blocked
                    ? 'text-ok-ink hover:text-ok-ink'
                    : 'text-bad-ink hover:text-bad-ink'
            }
            onClick={(event) => {
                event.stopPropagation();
                (u.blocked ? askUnblock : askBlock)(u);
            }}
        />
    );

    const statusBadge = (u) =>
        u.blocked ? (
            <StatusBadge tone='bad'>Blocked</StatusBadge>
        ) : (
            <StatusBadge tone='ok'>Active</StatusBadge>
        );

    const nameCell = (u) => (
        <div className='flex items-center gap-2.5 min-w-0'>
            <Avatar name={displayName(u)} src={u.profilePicture} size='sm' />
            <div className='min-w-0 flex flex-col gap-0.5'>
                <Link
                    to={`/users/${u._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className='font-medium text-ink hover:underline truncate'
                >
                    {displayName(u)}
                </Link>
                <span className='text-[12.5px] text-muted truncate'>
                    {u.college || 'No college given'}
                </span>
            </div>
        </div>
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

    const empty = (
        <EmptyState
            icon={UsersIcon}
            title={items.length === 0 ? 'No users yet' : 'No users match'}
            description={
                items.length === 0
                    ? 'Students who sign up on the website or app appear here.'
                    : 'Try another search or clear the filters.'
            }
            action={
                hasFilters ? (
                    <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
            }
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Users'
                description='Students with a StudentSenior account, their wallets and access.'
                actions={
                    <Button
                        icon={Download}
                        onClick={exportCsv}
                        disabled={!filteredAndSorted.length}
                    >
                        Export CSV
                    </Button>
                }
            />

            <Tabs
                label='Account status'
                className='mb-4'
                value={blockedFilter}
                onChange={(value) => {
                    setBlockedFilter(value);
                    setPage(1);
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                    count: counts[value] || 0,
                }))}
            />

            <FilterBar
                className='mb-4'
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                searchPlaceholder='Search by username or email'
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
                        { value: 'createdAt', label: 'Date joined' },
                        { value: 'points', label: 'Points balance' },
                    ],
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                viewMode={{ value: viewMode, onChange: setViewMode }}
                onClear={clearFilters}
                showClear={hasFilters}
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
                        <Table minWidth={960}>
                            <thead>
                                <tr>
                                    <Th>User</Th>
                                    <Th>Email</Th>
                                    <Th>Status</Th>
                                    <Th align='right'>Earned</Th>
                                    <Th align='right'>Balance</Th>
                                    <Th align='right'>Redeemed</Th>
                                    <Th>Joined</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((u) => (
                                    <Tr
                                        key={u._id}
                                        onClick={() =>
                                            navigate(`/users/${u._id}`)
                                        }
                                    >
                                        <Td className='max-w-[260px]'>
                                            {nameCell(u)}
                                        </Td>
                                        <Td className='max-w-[240px]'>
                                            <span className='block truncate text-[13px] text-ink-2'>
                                                {u.email || '—'}
                                            </span>
                                        </Td>
                                        <Td>{statusBadge(u)}</Td>
                                        <Td align='right' mono>
                                            {formatNumber(
                                                wallet(u, 'totalEarning'),
                                            )}
                                        </Td>
                                        <Td
                                            align='right'
                                            mono
                                            className='font-medium'
                                        >
                                            {formatNumber(
                                                wallet(u, 'currentBalance'),
                                            )}
                                        </Td>
                                        <Td align='right' mono>
                                            {formatNumber(
                                                wallet(u, 'totalWithdrawal'),
                                            )}
                                        </Td>
                                        <Td className='whitespace-nowrap text-[13px] text-ink-2'>
                                            {formatDate(u.createdAt)}
                                        </Td>
                                        <Td align='right'>{blockButton(u)}</Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    {totalItems > 0 && (
                        <div className='flex flex-col gap-2 px-4 py-3 border-t border-line-soft'>
                            {pagination}
                            <p className='text-xs text-muted'>
                                Wallet amounts are in points. 5 pts = ₹1.
                            </p>
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
                        {current.map((u) => (
                            <article
                                key={u._id}
                                onClick={() => navigate(`/users/${u._id}`)}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl hover:border-line-strong cursor-pointer transition-colors'
                            >
                                <div className='flex items-start gap-2'>
                                    <div className='flex-1 min-w-0'>
                                        {nameCell(u)}
                                    </div>
                                    {statusBadge(u)}
                                </div>
                                <span className='text-[13px] text-ink-2 truncate'>
                                    {u.email || '—'}
                                </span>
                                <dl className='grid grid-cols-3 gap-2 text-[12.5px]'>
                                    {[
                                        ['Earned', 'totalEarning'],
                                        ['Balance', 'currentBalance'],
                                        ['Redeemed', 'totalWithdrawal'],
                                    ].map(([label, key]) => (
                                        <div
                                            key={key}
                                            className='flex flex-col gap-0.5'
                                        >
                                            <dt className='text-muted'>
                                                {label}
                                            </dt>
                                            <dd className='font-mono text-[13px] text-ink'>
                                                {formatNumber(wallet(u, key))}{' '}
                                                <span className='text-muted'>
                                                    pts
                                                </span>
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft'>
                                    <span className='flex-1 text-xs text-muted'>
                                        Joined {formatDate(u.createdAt)}
                                    </span>
                                    {blockButton(u)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant={confirm?.variant}
            />
        </div>
    );
};

export default UsersPage;
