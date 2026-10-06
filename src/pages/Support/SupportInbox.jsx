import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Inbox, MessagesSquare } from 'lucide-react';
import api, { apiErrorMessage } from '../../utils/api';
import { formatShortDate } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import FilterBar from '../../components/Common/FilterBar';
import Pagination from '../../components/Pagination';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    SkeletonRows,
    StatusBadge,
    Tabs,
} from '../../components/ui';
import TicketPane, { TicketStatusBadge } from './TicketPane';
import {
    CATEGORY_LABELS,
    CATEGORY_OPTIONS,
    PRIORITY_OPTIONS,
    SOURCE_OPTIONS,
    STATUS_TABS,
    requesterName,
    ticketRef,
} from './supportMeta';

const LIMIT = 20;
const WEEK = 7 * 24 * 60 * 60 * 1000;
const age = (date) =>
    date && Date.now() - new Date(date) < WEEK
        ? relativeTime(date)
        : formatShortDate(date);

const EMPTY = {
    pending: [
        'Nothing needs a reply',
        'New tickets and students’ replies land here.',
    ],
    'awaiting-user': [
        'No one to wait on',
        'Tickets you’ve answered wait here until the student writes back.',
    ],
    'in-progress': [
        'Nothing in progress',
        'Set a ticket to In progress while you look into it.',
    ],
    resolved: ['No resolved tickets', 'Solved tickets are kept here.'],
    closed: [
        'No closed tickets',
        'Closed tickets are read-only for the student.',
    ],
    all: [
        'No tickets yet',
        'Requests from the app, the website and the old contact form appear here.',
    ],
};

/**
 * The support inbox: tickets on the left, the open one on the right. On
 * narrow screens the open ticket takes the whole page. Filters live in the
 * URL, so a filtered inbox can be shared or reloaded.
 */
export default function SupportInbox() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const status = params.get('status') || 'pending';
    const category = params.get('category') || '';
    const priority = params.get('priority') || '';
    const source = params.get('source') || '';
    const query = params.get('search') || '';
    const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);

    const [search, setSearch] = useState(query);
    const [list, setList] = useState({ tickets: [], counts: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const shownFilters = useRef('');

    const setFilters = useCallback(
        (changes) =>
            setParams(
                (current) => {
                    const next = new URLSearchParams(current);
                    Object.entries(changes).forEach(([key, value]) => {
                        if (value) next.set(key, String(value));
                        else next.delete(key);
                    });
                    // Any filter change starts again from the first page.
                    if (!('page' in changes)) next.delete('page');
                    return next;
                },
                { replace: true },
            ),
        [setParams],
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim() !== query) setFilters({ search: search.trim() });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, query, setFilters]);

    const filterKey = [status, category, priority, source, query, page].join(
        '|',
    );

    useEffect(() => {
        const controller = new AbortController();
        // A new filter shows placeholders; a refresh keeps the list on screen.
        if (shownFilters.current !== filterKey) setLoading(true);
        setError('');
        api.get('/support/tickets', {
            signal: controller.signal,
            params: {
                status,
                page,
                limit: LIMIT,
                ...(category && { category }),
                ...(priority && { priority }),
                ...(source && { source }),
                ...(query && { search: query }),
            },
        })
            .then(({ data }) => {
                setList(data.data);
                shownFilters.current = filterKey;
            })
            .catch((err) => {
                if (!controller.signal.aborted)
                    setError(
                        apiErrorMessage(
                            err,
                            'Couldn’t load tickets. Check your connection and try again.',
                        ),
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [filterKey, status, page, category, priority, source, query, revision]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible')
                setRevision((value) => value + 1);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () =>
            document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const refresh = useCallback(() => setRevision((value) => value + 1), []);
    const markRead = useCallback(
        (ticket) =>
            setList((current) => ({
                ...current,
                tickets: current.tickets.map((item) =>
                    item._id === ticket._id
                        ? { ...item, unreadForStaff: 0 }
                        : item,
                ),
            })),
        [],
    );
    const openTicket = (id) =>
        navigate({ pathname: `/support/${id}`, search: params.toString() });
    const closeTicket = () =>
        navigate({ pathname: '/support', search: params.toString() });

    const hasFilters = Boolean(category || priority || source || query);
    const clearFilters = () => {
        setSearch('');
        setFilters({ category: '', priority: '', source: '', search: '' });
    };

    const counts = list.counts || {};
    const [emptyTitle, emptyDescription] = hasFilters
        ? ['No tickets match', 'Try another search or clear the filters.']
        : EMPTY[status] || EMPTY.all;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <div className={ticketId ? 'hidden lg:block' : undefined}>
                <PageHeader
                    title='Support tickets'
                    description='Conversations with students from the app, the website and the old contact form.'
                />

                <Tabs
                    label='Ticket status'
                    className='mb-4'
                    value={status}
                    onChange={(value) => setFilters({ status: value })}
                    items={STATUS_TABS.map(([value, label]) => ({
                        value,
                        label,
                        count: counts[value],
                        attention: value === 'pending' && counts.pending > 0,
                    }))}
                />

                <FilterBar
                    className='mb-4'
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder='Search by #number, email, username or text'
                    filters={[
                        {
                            label: 'Category',
                            value: category,
                            onChange: (value) =>
                                setFilters({ category: value }),
                            options: [
                                { value: '', label: 'All categories' },
                                ...CATEGORY_OPTIONS,
                            ],
                        },
                        {
                            label: 'Priority',
                            value: priority,
                            onChange: (value) =>
                                setFilters({ priority: value }),
                            options: [
                                { value: '', label: 'Any priority' },
                                ...PRIORITY_OPTIONS,
                            ],
                        },
                        {
                            label: 'Sent from',
                            value: source,
                            onChange: (value) => setFilters({ source: value }),
                            options: [
                                { value: '', label: 'Anywhere' },
                                ...SOURCE_OPTIONS,
                            ],
                        },
                    ]}
                    onClear={clearFilters}
                    showClear={hasFilters}
                />

                {error && (
                    <Alert
                        tone='bad'
                        className='mb-4'
                        action={
                            <Button size='sm' onClick={refresh}>
                                Try again
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}
            </div>

            <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                <div className='grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:min-h-[600px]'>
                    <div
                        className={`flex-col min-w-0 lg:border-r border-line-soft ${
                            ticketId ? 'hidden lg:flex' : 'flex'
                        }`}
                    >
                        {loading ? (
                            <SkeletonRows rows={8} />
                        ) : list.tickets.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                tone={
                                    status === 'pending' && !hasFilters
                                        ? 'done'
                                        : 'neutral'
                                }
                                title={emptyTitle}
                                description={emptyDescription}
                                action={
                                    hasFilters ? (
                                        <Button onClick={clearFilters}>
                                            Clear filters
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <ul
                                aria-label='Tickets'
                                className='m-0 p-0 list-none'
                            >
                                {list.tickets.map((ticket) => {
                                    const selected = ticket._id === ticketId;
                                    const unread = ticket.unreadForStaff > 0;
                                    return (
                                        <li
                                            key={ticket._id}
                                            className='border-b border-line-soft'
                                        >
                                            <button
                                                type='button'
                                                aria-current={
                                                    selected
                                                        ? 'true'
                                                        : undefined
                                                }
                                                onClick={() =>
                                                    openTicket(ticket._id)
                                                }
                                                className={`w-full flex flex-col gap-1.5 px-4 py-3.5 text-left cursor-pointer transition-colors ${
                                                    selected
                                                        ? 'lg:bg-brand-soft/60 lg:shadow-[inset_3px_0_0_var(--color-brand)] hover:bg-sunken'
                                                        : 'hover:bg-sunken'
                                                }`}
                                            >
                                                <span className='flex items-center gap-2 w-full min-w-0'>
                                                    {unread && (
                                                        <span className='w-2 h-2 rounded-full bg-brand shrink-0'>
                                                            <span className='sr-only'>
                                                                New message.
                                                            </span>
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`flex-1 min-w-0 text-[13px] truncate ${
                                                            unread
                                                                ? 'font-semibold text-ink'
                                                                : 'text-ink-2'
                                                        }`}
                                                    >
                                                        {requesterName(ticket)}
                                                    </span>
                                                    <span className='text-xs text-muted whitespace-nowrap'>
                                                        {age(
                                                            ticket.lastMessageAt,
                                                        )}
                                                    </span>
                                                </span>
                                                <span className='flex items-start gap-2'>
                                                    <span className='flex-1 min-w-0 text-sm font-semibold text-ink break-words'>
                                                        {ticket.subject}
                                                    </span>
                                                    <TicketStatusBadge
                                                        status={ticket.status}
                                                    />
                                                </span>
                                                <span className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted'>
                                                    <span className='font-mono'>
                                                        {ticketRef(ticket)}
                                                    </span>
                                                    <span aria-hidden='true'>
                                                        ·
                                                    </span>
                                                    <span>
                                                        {CATEGORY_LABELS[
                                                            ticket.category
                                                        ] || 'Other'}
                                                    </span>
                                                    {ticket.guest && (
                                                        <>
                                                            <span aria-hidden='true'>
                                                                ·
                                                            </span>
                                                            <span>Guest</span>
                                                        </>
                                                    )}
                                                    {ticket.priority ===
                                                        'high' && (
                                                        <StatusBadge
                                                            tone='bad'
                                                            className='ml-1'
                                                        >
                                                            High
                                                        </StatusBadge>
                                                    )}
                                                </span>
                                                <span className='text-[13px] text-muted line-clamp-2 break-words'>
                                                    {ticket.lastMessagePreview}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {!loading && list.pagination?.totalItems > LIMIT && (
                            <div className='px-4 py-3 border-t border-line-soft'>
                                <Pagination
                                    currentPage={page}
                                    totalItems={list.pagination.totalItems}
                                    pageSize={LIMIT}
                                    onPageChange={(value) =>
                                        setFilters({
                                            page: value > 1 ? value : '',
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className={`min-w-0 ${ticketId ? 'block' : 'hidden lg:block'}`}
                    >
                        {ticketId ? (
                            <TicketPane
                                key={ticketId}
                                ticketId={ticketId}
                                onBack={closeTicket}
                                onLoaded={markRead}
                                onChanged={refresh}
                                onDeleted={() => {
                                    closeTicket();
                                    refresh();
                                }}
                            />
                        ) : (
                            <EmptyState
                                icon={MessagesSquare}
                                title='Pick a ticket'
                                description='Its conversation opens here, with a box to reply or leave a note for the team.'
                                className='h-full'
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
