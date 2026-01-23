import React, { useState, useEffect } from 'react';
import {
    X,
    Mail,
    Calendar,
    MessageSquare,
    User,
    PhoneCall,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ContactDetailModal = ({ isOpen, onClose, contact, onStatusUpdate }) => {
    const [status, setStatus] = useState(contact?.status || 'pending');
    const [resolvedDescription, setResolvedDescription] = useState(
        contact?.resolvedDescription || '',
    );
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (contact) {
            setStatus(contact.status || 'pending');
            setResolvedDescription(contact.resolvedDescription || '');
        }
    }, [contact]);

    if (!isOpen || !contact) return null;

    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'yellow', icon: Clock },
        {
            value: 'in-progress',
            label: 'In Progress',
            color: 'blue',
            icon: AlertCircle,
        },
        {
            value: 'resolved',
            label: 'Resolved',
            color: 'green',
            icon: CheckCircle,
        },
    ];

    // const getStatusBadge = (statusValue) => {
    //     const option = statusOptions.find((opt) => opt.value === statusValue);
    //     const colors = {
    //         yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    //         blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    //         green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    //     };
    //     return colors[option?.color] || colors.yellow;
    // };

    const handleUpdateStatus = async () => {
        if (status === 'resolved' && !resolvedDescription.trim()) {
            toast.error('Please provide a resolution description');
            return;
        }

        setIsUpdating(true);
        try {
            const response = await api.patch(
                `/stats/contact-us/${contact._id}/status`,
                {
                    status,
                    resolvedDescription:
                        status === 'resolved' ? resolvedDescription : undefined,
                },
            );
            toast.success('Status updated successfully');
            if (onStatusUpdate) {
                onStatusUpdate(response.data.data);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
            <div className='flex items-center justify-center min-h-screen p-4'>
                <div
                    className='fixed inset-0'
                    onClick={onClose}
                    aria-hidden='true'
                ></div>

                <div className='relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                        <div className='flex items-center gap-3'>
                            <div className='bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg'>
                                <PhoneCall className='w-6 h-6 text-pink-600 dark:text-pink-400' />
                            </div>
                            <div>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Contact Request Details
                                </h2>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    ID: {contact._id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    {/* Content */}
                    <div className='p-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                        {/* Meta Info Grid */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <Mail className='w-4 h-4 text-gray-400' />
                                    <span className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                        Email
                                    </span>
                                </div>
                                <div className='text-sm font-medium text-gray-900 dark:text-white break-all'>
                                    {contact.email || 'N/A'}
                                </div>
                            </div>

                            <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <Calendar className='w-4 h-4 text-gray-400' />
                                    <span className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                        Date Received
                                    </span>
                                </div>
                                <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {contact.createdAt
                                        ? new Date(
                                              contact.createdAt,
                                          ).toLocaleString()
                                        : 'N/A'}
                                </div>
                            </div>

                            {contact.name && (
                                <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 sm:col-span-2'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <User className='w-4 h-4 text-gray-400' />
                                        <span className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                            Name
                                        </span>
                                    </div>
                                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                        {contact.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject */}
                        <div>
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                                <MessageSquare className='w-4 h-4 text-blue-500' />
                                Subject
                            </h3>
                            <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm'>
                                {contact.subject || 'No subject'}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                                <MessageSquare className='w-4 h-4 text-green-500' />
                                Full Message
                            </h3>
                            <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto'>
                                {contact.description ||
                                    contact.message ||
                                    'No content'}
                            </div>
                        </div>

                        {/* Status Section */}
                        <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                                <AlertCircle className='w-4 h-4 text-purple-500' />
                                Status Management
                            </h3>

                            <div className='space-y-4'>
                                {/* Status Dropdown */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                        Current Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                                    >
                                        {statusOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Resolution Description (shown only when resolved) */}
                                {status === 'resolved' && (
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                            Resolution Description{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            value={resolvedDescription}
                                            onChange={(e) =>
                                                setResolvedDescription(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='Describe how this request was resolved...'
                                            rows={3}
                                            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none'
                                        />
                                    </div>
                                )}

                                {/* Show existing resolution if available */}
                                {contact.resolvedDescription &&
                                    contact.status === 'resolved' &&
                                    status !== 'resolved' && (
                                        <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800'>
                                            <p className='text-sm font-medium text-green-800 dark:text-green-400 mb-1'>
                                                Previous Resolution:
                                            </p>
                                            <p className='text-sm text-green-700 dark:text-green-300'>
                                                {contact.resolvedDescription}
                                            </p>
                                        </div>
                                    )}

                                {/* Update Button */}
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={
                                        isUpdating ||
                                        (status === contact.status &&
                                            resolvedDescription ===
                                                (contact.resolvedDescription ||
                                                    ''))
                                    }
                                    className='w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader className='w-4 h-4 animate-spin' />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className='w-4 h-4' />
                                            Update Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end'>
                        <button
                            onClick={onClose}
                            className='px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium'
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactDetailModal;
