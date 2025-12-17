import React from 'react';
import { X, Mail, Calendar, MessageSquare, User, PhoneCall } from 'lucide-react';

const ContactDetailModal = ({ isOpen, onClose, contact }) => {
    if (!isOpen || !contact) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div
                    className="fixed inset-0"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                                <PhoneCall className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Contact Request Details
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {contact._id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Meta Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Email
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white break-all">
                                    {contact.email || 'N/A'}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Date Received
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {contact.createdAt
                                        ? new Date(contact.createdAt).toLocaleString()
                                        : 'N/A'}
                                </div>
                            </div>

                            {contact.name && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 sm:col-span-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Name
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {contact.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                Subject
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                                {contact.subject || 'No subject'}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                Full Message
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                                {contact.description || contact.message || 'No content'}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
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
