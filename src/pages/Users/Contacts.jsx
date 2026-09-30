import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Inbox } from 'lucide-react';
import api from '../../utils/api';
import { formatShortDate } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import FilterBar from '../../components/Common/FilterBar';
import { filterByTime } from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import ContactDetailModal, {
    ContactPane,
} from '../../components/ContactDetailModal';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    EmptyState,
    PageHeader,
    StatusBadge,
    Tabs,
} from '../../components/ui';

const STATUS_TABS = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['in-progress', 'In progress'],
    ['resolved', 'Resolved'],
];

const WEEK = 7 * 24 * 60 * 60 * 1000;
const age = (date) =>
    date && Date.now() - new Date(date) < WEEK
        ? relativeTime(date)
        : formatShortDate(date);

const isWide = () => window.matchMedia('(min-width: 1024px)').matches;

const Contacts = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Filters live in the URL so a filtered inbox can be shared or reloaded.
    const params = new URLSearchParams(location.search);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(params.get('search') || '');
    const [currentPage, setCurrentPage] = useState(
        parseInt(params.get('page')) || 1,
    );
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(params.get('time') || 'all');
    const [statusFilter, setStatusFilter] = useState(
        params.get('status') || '',
    );
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | email
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedId, setSelectedId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const fetchContacts = async () => {
        try {
            setError(null);
            const response = await api.get('/stats/contact-us');
            setContacts(response.data.data || []);
        } catch (e) {
            console.error('Error fetching contacts:', e);
            setError(
                'Couldn’t load contact requests. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Persist filters in the URL.
    useEffect(() => {
        const next = new URLSearchParams();
        if (searchQuery) next.set('search', searchQuery);
        if (timeFilter) next.set('time', timeFilter);
        if (statusFilter) next.set('status', statusFilter);
        if (currentPage > 1) next.set('page', currentPage.toString());
        navigate({ search: next.toString() }, { replace: true });
    }, [searchQuery, timeFilter, statusFilter, currentPage, navigate]);

    // A filter change starts a new list, so the first message gets selected.
    const resetList = () => {
        setCurrentPage(1);
        setSelectedId(null);
    };

    const handleStatusUpdate = (updatedContact) =>
        setContacts((prev) =>
            prev.map((contact) =>
                contact._id === updatedContact._id ? updatedContact : contact,
            ),
        );

    const handleDelete = (contact) => {
        // Close the narrow-screen dialog so the confirmation sits on its own.
        setIsDetailModalOpen(false);
        setConfirm({
            onConfirm: async () => {
                try {
                    await api.delete(`/stats/contact-us/${contact._id}`);
                    setContacts((prev) =>
                        prev.filter((c) => c._id !== contact._id),
                    );
                    setSelectedId(null);
                    toast.success('Message deleted');
                } catch (e) {
                    console.error('Error deleting contact:', e);
                    toast.error('Couldn’t delete the message. Try again.');
                }
            },
        });
    };

    // Everything except the status tab, so tab counts reflect the other filters.
    const q = searchQuery.trim().toLowerCase();
    const base = contacts.filter((contact) => {
        const matchesSearch =
            !q ||
            [
                contact.name,
                contact.email,
                contact.subject,
                contact.description || contact.message,
            ].some((field) =>
                (field || '').toString().toLowerCase().includes(q),
            );
        return matchesSearch && filterByTime(contact, timeFilter || 'all');
    });
    const counts = base.reduce(
        (acc, contact) => {
            const status = contact.status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { '': base.length },
    );

    const filteredAndSorted = base
        .filter(
            (contact) =>
                !statusFilter || (contact.status || 'pending') === statusFilter,
        )
        .sort((a, b) => {
            if (sortBy === 'email') {
                const cmp = (a.email || '')
                    .toLowerCase()
                    .localeCompare((b.email || '').toLowerCase());
                return sortOrder === 'asc' ? cmp : -cmp;
            }
            const diff =
                new Date(a.createdAt || 0).getTime() -
                new Date(b.createdAt || 0).getTime();
            return sortOrder === 'asc' ? diff : -diff;
        });

    const currentContacts = filteredAndSorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    // The chosen message stays open after its status changes, even if it no
    // longer matches the tab; otherwise the first message on the page is shown.
    const selected =
        contacts.find((c) => c._id === selectedId) ||
        currentContacts[0] ||
        null;

    const hasFilters = Boolean(
        searchQuery || (timeFilter && timeFilter !== 'all'),
    );
    const clearFilters = () => {
        setSearchQuery('');
        setTimeFilter('all');
        resetList();
    };

    if (loading) return <Loader />;

    const openContact = (contact) => {
        setSelectedId(contact._id);
        if (!isWide()) setIsDetailModalOpen(true);
    };

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Contact requests'
                description='Messages sent from the contact form on studentsenior.com.'
            />

            <Tabs
                label='Request status'
                className='mb-4'
                value={statusFilter}
                onChange={(value) => {
                    setStatusFilter(value);
                    resetList();
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
                search={searchQuery}
                onSearch={(value) => {
                    setSearchQuery(value);
                    resetList();
                }}
                searchPlaceholder='Search by email, subject or message'
                timeFilter={{
                    value: timeFilter,
                    onChange: (value) => {
                        setTimeFilter(value);
                        resetList();
                    },
                }}
                sortBy={{
                    value: sortBy,
                    onChange: setSortBy,
                    options: [
                        { value: 'createdAt', label: 'Date received' },
                        { value: 'email', label: 'Email' },
                    ],
                }}
                sortOrder={{
                    value: sortOrder,
                    onToggle: () =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
                }}
                onClear={clearFilters}
                showClear={hasFilters}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
                    action={
                        <Button size='sm' onClick={fetchContacts}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                {currentContacts.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        tone={
                            statusFilter === 'pending' && !hasFilters
                                ? 'done'
                                : 'neutral'
                        }
                        title={
                            contacts.length === 0
                                ? 'No messages yet'
                                : statusFilter === 'pending' && !hasFilters
                                  ? 'No pending messages'
                                  : 'No messages match'
                        }
                        description={
                            contacts.length === 0
                                ? 'Messages from the contact form on the website appear here.'
                                : hasFilters
                                  ? 'Try another search or clear the filters.'
                                  : 'Messages with this status appear here.'
                        }
                        action={
                            hasFilters ? (
                                <Button onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className='grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:min-h-[560px]'>
                        <ul
                            aria-label='Messages'
                            className='lg:border-r border-line-soft'
                        >
                            {currentContacts.map((contact) => {
                                const isSelected =
                                    selected?._id === contact._id;
                                return (
                                    <li
                                        key={contact._id}
                                        className='border-b border-line-soft'
                                    >
                                        <button
                                            type='button'
                                            aria-current={
                                                isSelected ? 'true' : undefined
                                            }
                                            onClick={() => openContact(contact)}
                                            className={`w-full flex flex-col gap-1.5 px-4 py-3.5 text-left cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'lg:bg-brand-soft/60 lg:shadow-[inset_3px_0_0_var(--color-brand)] hover:bg-sunken'
                                                    : 'hover:bg-sunken'
                                            }`}
                                        >
                                            <span className='flex items-center gap-2 w-full min-w-0'>
                                                <span className='flex-1 min-w-0 text-[13px] text-ink-2 truncate'>
                                                    {contact.email ||
                                                        'Unknown sender'}
                                                </span>
                                                <span className='text-xs text-muted whitespace-nowrap'>
                                                    {age(contact.createdAt)}
                                                </span>
                                            </span>
                                            <span className='flex items-start gap-2'>
                                                <span className='flex-1 min-w-0 text-sm font-semibold text-ink break-words'>
                                                    {contact.subject ||
                                                        'No subject'}
                                                </span>
                                                <StatusBadge
                                                    status={
                                                        contact.status ||
                                                        'pending'
                                                    }
                                                />
                                            </span>
                                            <span className='text-[13px] text-muted line-clamp-2 break-words'>
                                                {contact.description ||
                                                    contact.message}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className='hidden lg:block min-w-0'>
                            {selected && (
                                <ContactPane
                                    contact={selected}
                                    onStatusUpdate={handleStatusUpdate}
                                    onDelete={handleDelete}
                                />
                            )}
                        </div>
                    </div>
                )}
                {filteredAndSorted.length > 0 && (
                    <div className='px-4 py-3 border-t border-line-soft'>
                        <Pagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalItems={filteredAndSorted.length}
                            onPageChange={(value) => {
                                setCurrentPage(value);
                                setSelectedId(null);
                            }}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                resetList();
                            }}
                        />
                    </div>
                )}
            </div>

            <ContactDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                contact={selected}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
            />

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title='Delete this message?'
                message='It’s removed for the whole team. This can’t be undone.'
                confirmText='Delete message'
                variant='danger'
            />
        </div>
    );
};

export default Contacts;
