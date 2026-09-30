import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Avatar,
    Button,
    EmptyState,
    PageHeader,
    Segmented,
    StatusBadge,
    Table,
    Td,
    Th,
    Tr,
} from '../../components/ui';

// What each role can do, from the API's role checks.
const ROLES = [
    {
        role: 'Admin',
        plural: 'Admins',
        can: 'Everything, including blocking students, giving points, granting premium and seeing this team.',
    },
    {
        role: 'Moderator',
        plural: 'Moderators',
        can: 'Review, edit and delete content, and handle reports, contact requests and payouts. Can’t block students or give points.',
    },
    {
        role: 'Visitor',
        plural: 'Visitors',
        can: 'Can’t sign in to the console. New sign-ups start with this role.',
    },
];

const memberName = (u) => u.name || u.username || 'Unnamed member';

const DashboardUsersPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Filters live in the URL so a filtered list can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(params.get('search') || '');
    const [page, setPage] = useState(parseInt(params.get('page')) || 1);
    const [pageSize, setPageSize] = useState(12);
    // Stored lower-case in the URL: '', 'admin', 'moderator' or 'visitor'.
    const [roleFilter, setRoleFilter] = useState(
        (params.get('role') || '').toLowerCase(),
    );
    const [timeFilter, setTimeFilter] = useState(params.get('time') || 'all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );

    const fetchData = async () => {
        try {
            setError(null);
            const res = await api.get('/user/dashboard-users');
            setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
            setError(
                'Couldn’t load the admin team. Check your connection and try again.',
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
        const next = new URLSearchParams();
        if (search) next.set('search', search);
        if (roleFilter) next.set('role', roleFilter);
        if (timeFilter) next.set('time', timeFilter);
        if (page > 1) next.set('page', page.toString());
        navigate({ search: next.toString() }, { replace: true });
    }, [search, roleFilter, timeFilter, page, navigate]);

    const roleCounts = useMemo(
        () =>
            items.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {}),
        [items],
    );

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items
            .filter((u) => {
                const email = (u.email || '').toLowerCase();
                const name = (u.username || u.name || '').toLowerCase();
                const role = (u.role || '').toLowerCase();
                const matchesSearch =
                    !q ||
                    email.includes(q) ||
                    name.includes(q) ||
                    role.includes(q);
                const matchesRole = !roleFilter || role === roleFilter;
                return (
                    matchesSearch &&
                    matchesRole &&
                    filterByTime(u, timeFilter || 'all')
                );
            })
            .sort((a, b) => {
                const diff =
                    new Date(a.createdAt || 0).getTime() -
                    new Date(b.createdAt || 0).getTime();
                return sortOrder === 'asc' ? diff : -diff;
            });
    }, [items, search, roleFilter, timeFilter, sortOrder]);

    const totalItems = filteredAndSorted.length;
    const start = (page - 1) * pageSize;
    const current = filteredAndSorted.slice(start, start + pageSize);

    const hasFilters = Boolean(
        search || roleFilter || (timeFilter && timeFilter !== 'all'),
    );
    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setTimeFilter('all');
        setPage(1);
    };

    if (loading) return <Loader />;

    const isMe = (u) => currentUser?.id && u._id === currentUser.id;

    const nameCell = (u) => (
        <div className='flex items-center gap-3 min-w-0'>
            <Avatar name={memberName(u)} />
            <div className='min-w-0 flex flex-col gap-0.5'>
                <span
                    className={`flex items-center gap-2 font-medium ${
                        u.active === false ? 'text-muted' : 'text-ink'
                    }`}
                >
                    <span className='truncate'>{memberName(u)}</span>
                    {isMe(u) && (
                        <span className='shrink-0 px-1.5 py-px rounded-full bg-ground text-[11.5px] font-medium text-ink-2'>
                            You
                        </span>
                    )}
                </span>
                <span className='text-[12.5px] text-muted truncate'>
                    {u.email || '—'}
                </span>
            </div>
        </div>
    );

    const accessBadge = (u) =>
        u.active === false ? (
            <StatusBadge tone='outline'>Deactivated</StatusBadge>
        ) : (
            <StatusBadge tone='ok'>Active</StatusBadge>
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
            icon={ShieldCheck}
            title={
                items.length === 0 ? 'No team members yet' : 'No one matches'
            }
            description={
                items.length === 0
                    ? 'People who sign up for this console appear here.'
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
                title='Admin team'
                description='People who can sign in to this console, and what they can do.'
            />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6'>
                {ROLES.map(({ role, can }) => (
                    <div
                        key={role}
                        className='flex flex-col gap-2.5 px-[18px] py-4 bg-sheet border border-line rounded-xl'
                    >
                        <div className='flex items-center gap-2'>
                            <span className='flex-1 text-[14.5px] font-semibold text-ink'>
                                {role}
                            </span>
                            <span className='font-mono text-xs text-muted'>
                                {roleCounts[role] || 0}{' '}
                                {roleCounts[role] === 1 ? 'person' : 'people'}
                            </span>
                        </div>
                        <span className='text-[13px] leading-normal text-ink-2'>
                            {can}
                        </span>
                    </div>
                ))}
            </div>

            <div className='flex flex-wrap items-start gap-2 mb-4'>
                <FilterBar
                    className='flex-1 min-w-[280px]'
                    search={search}
                    onSearch={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    searchPlaceholder='Search by name, email or role'
                    timeFilter={{
                        value: timeFilter,
                        onChange: (v) => {
                            setTimeFilter(v);
                            setPage(1);
                        },
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
                <Segmented
                    label='Role'
                    value={roleFilter}
                    onChange={(value) => {
                        setRoleFilter(value);
                        setPage(1);
                    }}
                    options={[
                        { value: '', label: 'All' },
                        ...ROLES.map(({ role, plural }) => ({
                            value: role.toLowerCase(),
                            label: plural,
                        })),
                    ]}
                />
            </div>

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
                        <Table minWidth={760}>
                            <thead>
                                <tr>
                                    <Th>Member</Th>
                                    <Th>Role</Th>
                                    <Th>College</Th>
                                    <Th>Access</Th>
                                    <Th>Added</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map((u) => (
                                    <Tr
                                        key={u._id}
                                        className={
                                            u.active === false
                                                ? 'bg-sunken/60'
                                                : ''
                                        }
                                    >
                                        <Td className='max-w-[340px]'>
                                            {nameCell(u)}
                                        </Td>
                                        <Td>{u.role || '—'}</Td>
                                        <Td className='max-w-[220px] text-ink-2'>
                                            <span className='block truncate'>
                                                {u.college || '—'}
                                            </span>
                                        </Td>
                                        <Td>{accessBadge(u)}</Td>
                                        <Td className='whitespace-nowrap text-[13px] text-ink-2'>
                                            {formatDate(u.createdAt)}
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
                        {current.map((u) => (
                            <article
                                key={u._id}
                                className='flex flex-col gap-3 p-4 bg-sheet border border-line rounded-xl'
                            >
                                {nameCell(u)}
                                <div className='flex flex-wrap items-center gap-2'>
                                    <span className='text-[13px] font-medium text-ink-2'>
                                        {u.role || 'No role'}
                                    </span>
                                    {accessBadge(u)}
                                </div>
                                <div className='flex items-center gap-2 pt-3 border-t border-line-soft text-xs text-muted'>
                                    <span className='flex-1 truncate'>
                                        {u.college || 'No college'}
                                    </span>
                                    <span>Added {formatDate(u.createdAt)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                        {pagination}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardUsersPage;
