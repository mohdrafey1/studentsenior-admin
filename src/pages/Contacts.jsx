import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
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
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [expandedItems, setExpandedItems] = useState(new Set());
    const navigate = useNavigate();

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

    // Filter contacts based on search
    const filteredContacts = contacts.filter(
        (contact) =>
            (contact.name?.toLowerCase() || '').includes(
                searchQuery.trim().toLowerCase(),
            ) ||
            (contact.email?.toLowerCase() || '').includes(
                searchQuery.trim().toLowerCase(),
            ) ||
            (contact.message?.toLowerCase() || '').includes(
                searchQuery.trim().toLowerCase(),
            ),
    );

    // Pagination logic
    const indexOfLastContact = currentPage * pageSize;
    const indexOfFirstContact = indexOfLastContact - pageSize;
    const currentContacts = filteredContacts.slice(
        indexOfFirstContact,
        indexOfLastContact,
    );

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
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

            <main className='pt-6 pb-12'>
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

                    {/* Search */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='relative max-w-md'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                            <input
                                type='text'
                                placeholder='Search by name, email, or message...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                            />
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

                    {/* Contacts Cards */}
                    {currentContacts.length > 0 ? (
                        <div className='space-y-6'>
                            {/* Contact Cards */}
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

                            {/* Pagination */}
                            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                                <div className='px-4 py-3'>
                                    <Pagination
                                        currentPage={currentPage}
                                        pageSize={pageSize}
                                        totalItems={filteredContacts.length}
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
