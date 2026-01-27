import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PhoneCall, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import FilterBar from '../../components/Common/FilterBar';
import {
    filterByTime,
    getTimeFilterLabel,
} from '../../components/Common/timeFilterUtils';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import ContactDetailModal from '../../components/ContactDetailModal';
import Loader from '../../components/Common/Loader';
import BackButton from '../../components/Common/BackButton';

const Contacts = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || 'all';
    const initialPage = parseInt(params.get('page')) || 1;
    const initialStatusFilter = params.get('status') || '';

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter); // time filter
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter); // status filter
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | name | email
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [selectedContact, setSelectedContact] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { mainContentMargin } = useSidebarLayout();

    // Status badge helper
    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                label: 'Pending',
                className:
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                icon: Clock,
            },
            'in-progress': {
                label: 'In Progress',
                className:
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                icon: AlertCircle,
            },
            resolved: {
                label: 'Resolved',
                className:
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                icon: CheckCircle,
            },
        };
        return statusConfig[status] || statusConfig.pending;
    };

    // Handle status update from modal
    const handleStatusUpdate = (updatedContact) => {
        setContacts((prevContacts) =>
            prevContacts.map((contact) =>
                contact._id === updatedContact._id ? updatedContact : contact,
            ),
        );
        setSelectedContact(updatedContact);
    };

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
    });

    const showConfirm = (config) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: config.title || 'Confirm Action',
                message: config.message,
                variant: config.variant || 'danger',
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const toggleExpanded = (contactId, field) => {
        const key = `${contactId}-${field}`;
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const fetchContacts = async () => {
        try {
            setError(null);
            const response = await api.get('/stats/contact-us');
            setContacts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setError('Failed to load contact requests');
            toast.error('Failed to load contact requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Persist filters in URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (timeFilter) params.set('time', timeFilter);
        if (statusFilter) params.set('status', statusFilter);
        if (currentPage > 1) params.set('page', currentPage.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [searchQuery, timeFilter, statusFilter, currentPage, navigate]);

    // Auto switch view mode on resize
    useEffect(() => {
        const handleResize = () =>
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDelete = async (contactId) => {
        const ok = await showConfirm({
            title: 'Delete Contact Request',
            message:
                'Are you sure you want to delete this contact request? This action cannot be undone.',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/stats/contact-us/${contactId}`);
            setContacts(
                contacts.filter((contact) => contact._id !== contactId),
            );
            toast.success('Contact request deleted successfully');
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error('Failed to delete contact request');
        }
    };

    // Filter + Sort
    const filteredAndSorted = contacts
        .filter((contact) => {
            const q = searchQuery.trim().toLowerCase();
            const name = (contact.name || '').toLowerCase();
            const email = (contact.email || '').toLowerCase();
            const message = (contact.description || contact.message || '')
                .toString()
                .toLowerCase();
            const matchesSearch =
                !q ||
                name.includes(q) ||
                email.includes(q) ||
                message.includes(q);
            const matchesTime = filterByTime(contact, timeFilter);
            const matchesStatus =
                !statusFilter || (contact.status || 'pending') === statusFilter;
            return matchesSearch && matchesTime && matchesStatus;
        })
        .sort((a, b) => {
            let aVal = 0;
            let bVal = 0;
            if (sortBy === 'createdAt') {
                aVal = new Date(a.createdAt || 0).getTime();
                bVal = new Date(b.createdAt || 0).getTime();
            } else if (sortBy === 'name') {
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
            } else if (sortBy === 'email') {
                aVal = (a.email || '').toLowerCase();
                bVal = (b.email || '').toLowerCase();
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const cmp = aVal.localeCompare(bVal);
                return sortOrder === 'asc' ? cmp : -cmp;
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

    // Pagination logic
    const indexOfLastContact = currentPage * pageSize;
    const indexOfFirstContact = indexOfLastContact - pageSize;
    const currentContacts = filteredAndSorted.slice(
        indexOfFirstContact,
        indexOfLastContact,
    );

    const totalContacts =
        timeFilter || statusFilter ? filteredAndSorted.length : 0;

    const clearFilters = () => {
        setSearchQuery('');
        setTimeFilter('all');
        setStatusFilter('');
        setCurrentPage(1);
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />

            <main
                className={`pt-6 pb-12 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <BackButton
                        title='Contact Requests'
                        TitleIcon={PhoneCall}
                    />

                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 space-y-3'>
                        <div className='flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded text-xs'>
                            <span className='text-gray-600 dark:text-gray-400'>
                                Total ({getTimeFilterLabel(timeFilter)}):
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {totalContacts}
                            </span>
                        </div>

                        <FilterBar
                            search={searchQuery}
                            onSearch={setSearchQuery}
                            filters={[
                                {
                                    label: 'Status',
                                    value: statusFilter,
                                    onChange: setStatusFilter,
                                    options: [
                                        { value: '', label: 'All Status' },
                                        {
                                            value: 'pending',
                                            label: 'Pending',
                                        },
                                        {
                                            value: 'in-progress',
                                            label: 'In Progress',
                                        },
                                        {
                                            value: 'resolved',
                                            label: 'Resolved',
                                        },
                                    ],
                                },
                            ]}
                            timeFilter={{
                                value: timeFilter,
                                onChange: setTimeFilter,
                            }}
                            sortBy={{
                                value: sortBy,
                                onChange: setSortBy,
                                options: [
                                    {
                                        value: 'createdAt',
                                        label: 'Sort by Date',
                                    },
                                    {
                                        value: 'name',
                                        label: 'Sort by Name',
                                    },
                                    {
                                        value: 'email',
                                        label: 'Sort by Email',
                                    },
                                ],
                            }}
                            sortOrder={{
                                value: sortOrder,
                                onToggle: () =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    ),
                            }}
                            viewMode={{
                                value: viewMode,
                                onChange: setViewMode,
                            }}
                            onClear={clearFilters}
                            showClear={
                                !!(
                                    searchQuery ||
                                    statusFilter ||
                                    (timeFilter && timeFilter !== 'all')
                                )
                            }
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8'>
                            <div className='flex items-center'>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Contacts Views */}
                    {currentContacts.length > 0 ? (
                        <div className='space-y-6'>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className='grid md:grid-cols-2 gap-6'>
                                    {currentContacts.map((contact) => {
                                        const subjectKey = `${contact._id}-subject`;
                                        const messageKey = `${contact._id}-message`;
                                        const isSubjectExpanded =
                                            expandedItems.has(subjectKey);
                                        const isMessageExpanded =
                                            expandedItems.has(messageKey);

                                        return (
                                            <div
                                                key={contact._id}
                                                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'
                                            >
                                                <div className='flex items-start justify-between'>
                                                    {/* Contact Info */}
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex items-center flex-wrap gap-2 mb-4'>
                                                            <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                                                                <Mail className='w-4 h-4 mr-2' />
                                                                <span className='font-medium'>
                                                                    {contact.email ||
                                                                        'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                                <Calendar className='w-4 h-4 mr-2' />
                                                                {contact.createdAt
                                                                    ? new Date(
                                                                          contact.createdAt,
                                                                      ).toLocaleString()
                                                                    : 'N/A'}
                                                            </div>
                                                            {/* Status Badge */}
                                                            {(() => {
                                                                const statusInfo =
                                                                    getStatusBadge(
                                                                        contact.status ||
                                                                            'pending',
                                                                    );
                                                                const StatusIcon =
                                                                    statusInfo.icon;
                                                                return (
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                                                                    >
                                                                        <StatusIcon className='w-3 h-3' />
                                                                        {
                                                                            statusInfo.label
                                                                        }
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Subject */}
                                                        {contact.subject && (
                                                            <div className='mb-4'>
                                                                <div className='flex items-center mb-2'>
                                                                    <MessageSquare className='w-4 h-4 mr-2 text-blue-500' />
                                                                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                                                        Subject
                                                                    </span>
                                                                </div>
                                                                <div className='text-gray-900 dark:text-white'>
                                                                    {isSubjectExpanded ? (
                                                                        <div>
                                                                            <p className='whitespace-pre-wrap'>
                                                                                {
                                                                                    contact.subject
                                                                                }
                                                                            </p>
                                                                            {contact
                                                                                .subject
                                                                                .length >
                                                                                50 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        toggleExpanded(
                                                                                            contact._id,
                                                                                            'subject',
                                                                                        )
                                                                                    }
                                                                                    className='mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                                                                                >
                                                                                    <ChevronUp className='w-4 h-4 mr-1' />
                                                                                    Show
                                                                                    less
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <p>
                                                                                {truncateText(
                                                                                    contact.subject,
                                                                                    50,
                                                                                )}
                                                                            </p>
                                                                            {contact
                                                                                .subject
                                                                                .length >
                                                                                100 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        toggleExpanded(
                                                                                            contact._id,
                                                                                            'subject',
                                                                                        )
                                                                                    }
                                                                                    className='mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                                                                                >
                                                                                    <ChevronDown className='w-4 h-4 mr-1' />
                                                                                    Show
                                                                                    more
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Message */}
                                                        {contact.description && (
                                                            <div className='mb-4'>
                                                                <div className='flex items-center mb-2'>
                                                                    <MessageSquare className='w-4 h-4 mr-2 text-green-500' />
                                                                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                                                        Message
                                                                    </span>
                                                                </div>
                                                                <div className='text-gray-900 dark:text-white'>
                                                                    {isMessageExpanded ? (
                                                                        <div>
                                                                            <p className='whitespace-pre-wrap'>
                                                                                {
                                                                                    contact.description
                                                                                }
                                                                            </p>
                                                                            {contact
                                                                                .description
                                                                                .length >
                                                                                200 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        toggleExpanded(
                                                                                            contact._id,
                                                                                            'message',
                                                                                        )
                                                                                    }
                                                                                    className='mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                                                                                >
                                                                                    <ChevronUp className='w-4 h-4 mr-1' />
                                                                                    Show
                                                                                    less
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <p className='whitespace-pre-wrap'>
                                                                                {truncateText(
                                                                                    contact.description,
                                                                                    200,
                                                                                )}
                                                                            </p>
                                                                            {contact
                                                                                .description
                                                                                .length >
                                                                                200 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        toggleExpanded(
                                                                                            contact._id,
                                                                                            'message',
                                                                                        )
                                                                                    }
                                                                                    className='mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                                                                                >
                                                                                    <ChevronDown className='w-4 h-4 mr-1' />
                                                                                    Show
                                                                                    more
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className='ml-4 flex-shrink-0 flex flex-col gap-2'>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedContact(
                                                                    contact,
                                                                );
                                                                setIsDetailModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className='p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
                                                            title='View details'
                                                        >
                                                            <Eye className='w-5 h-5' />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    contact._id,
                                                                )
                                                            }
                                                            className='p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                                                            title='Delete contact request'
                                                        >
                                                            <Trash2 className='w-5 h-5' />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Action
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        User
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Subject
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Message
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {currentContacts.map(
                                                    (contact) => {
                                                        const statusInfo =
                                                            getStatusBadge(
                                                                contact.status ||
                                                                    'pending',
                                                            );
                                                        const StatusIcon =
                                                            statusInfo.icon;
                                                        return (
                                                            <tr
                                                                key={
                                                                    contact._id
                                                                }
                                                                className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            >
                                                                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                                    <div className='flex items-center gap-2'>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedContact(
                                                                                    contact,
                                                                                );
                                                                                setIsDetailModalOpen(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            className='px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:opacity-90 flex items-center gap-1'
                                                                            title='View Details'
                                                                        >
                                                                            <Eye className='w-3 h-3' />
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    contact._id,
                                                                                )
                                                                            }
                                                                            className='px-3 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:opacity-90'
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                                                                    >
                                                                        <StatusIcon className='w-3 h-3' />
                                                                        {
                                                                            statusInfo.label
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                                    <div className='flex items-start gap-2'>
                                                                        {/* <User className='w-4 h-4 text-gray-400 mt-1' /> */}
                                                                        <div>
                                                                            {/* <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                                            {contact.name ||
                                                                                'N/A'}
                                                                        </div> */}
                                                                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                                                {contact.email ||
                                                                                    'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className='px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate'>
                                                                    {contact.subject ||
                                                                        '-'}
                                                                </td>
                                                                <td className='px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md truncate'>
                                                                    {contact.description ||
                                                                        contact.message ||
                                                                        '-'}
                                                                </td>
                                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                                                    {contact.createdAt
                                                                        ? new Date(
                                                                              contact.createdAt,
                                                                          ).toLocaleString()
                                                                        : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                                <div className='px-4 py-3'>
                                    <Pagination
                                        currentPage={currentPage}
                                        pageSize={pageSize}
                                        totalItems={filteredAndSorted.length}
                                        onPageChange={setCurrentPage}
                                        onPageSizeChange={(size) => {
                                            setPageSize(size);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-12'>
                            <PhoneCall className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                            <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                                No Contact Requests Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                No contact requests match your current search.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            {/* Detail Modal */}
            <ContactDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                contact={selectedContact}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
};

export default Contacts;
