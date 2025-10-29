import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    PhoneCall,
    Search,
    ArrowLeft,
    Loader,
    Mail,
    MessageSquare,
    Calendar,
    Trash2,
    ChevronDown,
    ChevronUp,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    User,
    Clock,
    X,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const Contacts = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Read URL params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search') || '';
    const initialTimeFilter = params.get('time') || '';
    const initialPage = parseInt(params.get('page')) || 1;

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(12);
    const [timeFilter, setTimeFilter] = useState(initialTimeFilter); // time filter
    const [sortBy, setSortBy] = useState('createdAt'); // createdAt | name | email
    const [sortOrder, setSortOrder] = useState('desc'); // asc | desc
    const [viewMode, setViewMode] = useState(() =>
        window.innerWidth >= 1024 ? 'table' : 'grid',
    );
    const [expandedItems, setExpandedItems] = useState(new Set());
    const { mainContentMargin } = useSidebarLayout();

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
        if (currentPage > 1) params.set('page', currentPage.toString());
        navigate({ search: params.toString() }, { replace: true });
    }, [searchQuery, timeFilter, currentPage, navigate]);

    // Auto switch view mode on resize
    useEffect(() => {
        const handleResize = () =>
            setViewMode(window.innerWidth >= 1024 ? 'table' : 'grid');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getTimeFilterLabel = () => {
        switch (timeFilter) {
            case 'last24h':
                return 'Last 24 Hours';
            case 'last7d':
                return 'Last 7 Days';
            case 'last28d':
                return 'Last 28 Days';
            case 'thisWeek':
                return 'This Week';
            case 'thisMonth':
                return 'This Month';
            case 'thisYear':
                return 'This Year';
            case 'all':
                return 'All Time';
            default:
                return '';
        }
    };

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

            // Time filter
            const matchesTime = (() => {
                if (!timeFilter) return true;
                const itemDate = new Date(contact.createdAt || 0);
                const now = new Date();

                switch (timeFilter) {
                    case 'last24h':
                        return now - itemDate <= 24 * 60 * 60 * 1000;
                    case 'last7d':
                        return now - itemDate <= 7 * 24 * 60 * 60 * 1000;
                    case 'last28d':
                        return now - itemDate <= 28 * 24 * 60 * 60 * 1000;
                    case 'thisWeek': {
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        startOfWeek.setHours(0, 0, 0, 0);
                        return itemDate >= startOfWeek;
                    }
                    case 'thisMonth': {
                        const startOfMonth = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1,
                        );
                        return itemDate >= startOfMonth;
                    }
                    case 'thisYear': {
                        const startOfYear = new Date(now.getFullYear(), 0, 1);
                        return itemDate >= startOfYear;
                    }
                    case 'all':
                    default:
                        return true;
                }
            })();

            return matchesSearch && matchesTime;
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

    const totalContacts = timeFilter ? filteredAndSorted.length : 0;

    const clearFilters = () => {
        setSearchQuery('');
        setTimeFilter('');
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div
                    className={`flex items-center justify-center py-20 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading contact requests...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />

            <main
                className={`pt-6 pb-12 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header Section */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate('/reports')}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-pink-600 text-white p-3 rounded-lg mr-4'>
                                    <PhoneCall className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Contact Requests
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Manage and respond to user inquiries
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-pink-50 dark:bg-pink-900/30 px-6 py-3 rounded-lg'>
                            <div className='text-sm text-pink-600 dark:text-pink-400'>
                                Total Requests:
                            </div>
                            <div className='text-2xl font-bold text-pink-800 dark:text-pink-300'>
                                {contacts.length}
                            </div>
                        </div>
                    </div>

                    {/* Total Contacts Banner */}
                    {timeFilter && (
                        <div className='bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 mb-6 text-white'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-pink-100 text-sm font-medium mb-1'>
                                        {getTimeFilterLabel()}
                                    </p>
                                    <p className='text-3xl font-bold'>
                                        {totalContacts} Requests
                                    </p>
                                </div>
                                <div className='bg-white/20 p-3 rounded-lg'>
                                    <PhoneCall className='w-8 h-8' />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search, View, Sort */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6'>
                        <div className='relative mb-4 max-w-xl'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                            <input
                                type='text'
                                placeholder='Search by name, email, or message...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            />
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                            {/* View toggle */}
                            <div className='flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Grid view'
                                >
                                    <Grid3x3 className='w-4 h-4' />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                    title='Table view'
                                >
                                    <List className='w-4 h-4' />
                                </button>
                            </div>

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm'
                            >
                                <option value='createdAt'>Sort by Date</option>
                                <option value='name'>Sort by Name</option>
                                <option value='email'>Sort by Email</option>
                            </select>

                            {/* Time Filter */}
                            <div className='relative'>
                                <Clock className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
                                <select
                                    value={timeFilter}
                                    onChange={(e) =>
                                        setTimeFilter(e.target.value)
                                    }
                                    className='pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm appearance-none'
                                >
                                    <option value=''>Time Filter</option>
                                    <option value='last24h'>
                                        Last 24 Hours
                                    </option>
                                    <option value='last7d'>Last 7 Days</option>
                                    <option value='last28d'>
                                        Last 28 Days
                                    </option>
                                    <option value='thisWeek'>This Week</option>
                                    <option value='thisMonth'>
                                        This Month
                                    </option>
                                    <option value='thisYear'>This Year</option>
                                    <option value='all'>All Time</option>
                                </select>
                            </div>

                            {/* Sort Order */}
                            <button
                                onClick={() =>
                                    setSortOrder(
                                        sortOrder === 'asc' ? 'desc' : 'asc',
                                    )
                                }
                                className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                title={
                                    sortOrder === 'asc'
                                        ? 'Ascending'
                                        : 'Descending'
                                }
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className='w-4 h-4' />
                                ) : (
                                    <SortDesc className='w-4 h-4' />
                                )}
                            </button>

                            {/* Clear Filters Button */}
                            {(searchQuery || timeFilter) && (
                                <button
                                    onClick={clearFilters}
                                    className='flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm font-medium'
                                >
                                    <X className='w-4 h-4' />
                                    Clear Filters
                                </button>
                            )}
                        </div>
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
                                                        <div className='flex items-center space-x-4 mb-4'>
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
                                                    <div className='ml-4 flex-shrink-0'>
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
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                                                {currentContacts.map(
                                                    (contact) => (
                                                        <tr
                                                            key={contact._id}
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        >
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <div className='flex items-start gap-2'>
                                                                    <User className='w-4 h-4 text-gray-400 mt-1' />
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
                                                            <td className='px-6 py-4 whitespace-nowrap text-sm'>
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
                                                            </td>
                                                        </tr>
                                                    ),
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
        </div>
    );
};

export default Contacts;
