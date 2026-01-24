import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Bell,
    Send,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
    RotateCcw,
} from 'lucide-react';

// Navigation screen options
const NAVIGATION_SCREENS = [
    { value: '', label: 'No navigation (default)' },
    { value: 'pyqs', label: 'PYQs Page' },
    { value: 'notes', label: 'Notes Page' },
    { value: 'syllabus', label: 'Syllabus Page' },
    { value: 'store', label: 'Store Page' },
    { value: 'college', label: 'College Home' },
    { value: 'profile', label: 'User Profile' },
    { value: 'settings', label: 'Settings' },
    { value: 'collection', label: 'Saved Collection' },
];

const Notifications = () => {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState({
        usersWithPushTokens: 0,
        totalNotificationsSent: 0,
    });
    const [notifications, setNotifications] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        screen: '',
        college: '',
        slug: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    // Fetch notification stats
    const fetchStats = async () => {
        try {
            const response = await api.get('/notification/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch notification history
    const fetchNotifications = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get(
                `/notification?page=${page}&limit=${pagination.limit}`,
            );
            if (response.data.success) {
                setNotifications(response.data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    page,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 1,
                }));
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error(
                error.response?.data?.message ||
                    'Failed to fetch notification history',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.body.trim()) {
            toast.error('Title and body are required');
            return;
        }

        if (stats.usersWithPushTokens === 0) {
            toast.error('No users with push tokens to send notifications to');
            return;
        }

        try {
            setSending(true);

            // Build notification payload with navigation data
            const payload = {
                title: formData.title,
                body: formData.body,
                data: {},
            };

            // Add navigation data if screen is selected
            if (formData.screen) {
                payload.data = {
                    screen: formData.screen,
                    params: {},
                };

                if (formData.college) {
                    payload.data.params.college = formData.college;
                }
                if (formData.slug) {
                    payload.data.params.slug = formData.slug;
                }
            }

            const response = await api.post('/notification', payload);

            if (response.data.success) {
                toast.success(
                    `Notification sent to ${response.data.data.successCount} users!`,
                );
                setFormData({
                    title: '',
                    body: '',
                    screen: '',
                    college: '',
                    slug: '',
                });
                fetchStats();
                fetchNotifications();
            } else {
                throw new Error(
                    response.data.message || 'Failed to send notification',
                );
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error(
                error.response?.data?.message || 'Failed to send notification',
            );
        } finally {
            setSending(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    // Handle repeat notification - populate form with existing notification data
    const handleRepeatNotification = (notification) => {
        setFormData({
            title: notification.title,
            body: notification.body,
            screen: notification.data?.screen || '',
            college: notification.data?.params?.college || '',
            slug: notification.data?.params?.slug || '',
        });

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });

        toast.success('Notification loaded! Edit and send again.');
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />

            <main className='pt-4 md:pt-6 pb-8 md:pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='space-y-6'>
                        {/* Page Header */}
                        <div className='flex items-center gap-3 mb-6'>
                            <Bell className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                            <div>
                                <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
                                    Push Notifications
                                </h1>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    Send push notifications to all app users
                                </p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full'>
                                        <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                            Users with Push Tokens
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                            {stats.usersWithPushTokens}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-3 bg-green-100 dark:bg-green-900/30 rounded-full'>
                                        <Send className='w-6 h-6 text-green-600 dark:text-green-400' />
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                            Total Notifications Sent
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                            {stats.totalNotificationsSent}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Send Notification Form */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Send New Notification
                                </h2>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    This notification will be sent to all users
                                    who have enabled push notifications
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className='p-6 space-y-4'
                            >
                                <div>
                                    <label
                                        htmlFor='title'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                    >
                                        Title{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        id='title'
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        maxLength={100}
                                        placeholder='Enter notification title'
                                        className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    />
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                        {formData.title.length}/100 characters
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor='body'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                    >
                                        Message{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <textarea
                                        id='body'
                                        value={formData.body}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                body: e.target.value,
                                            }))
                                        }
                                        maxLength={500}
                                        rows={4}
                                        placeholder='Enter notification message'
                                        className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                                    />
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                        {formData.body.length}/500 characters
                                    </p>
                                </div>

                                {/* Navigation Options */}
                                <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
                                    <div className='flex items-center gap-2 mb-3'>
                                        <ExternalLink className='w-4 h-4 text-gray-500' />
                                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                            Deep Link (Optional)
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
                                        When users tap the notification, they
                                        will be navigated to the selected
                                        screen.
                                    </p>

                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        {/* Screen Selector */}
                                        <div>
                                            <label
                                                htmlFor='screen'
                                                className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                                            >
                                                Navigate To
                                            </label>
                                            <select
                                                id='screen'
                                                value={formData.screen}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        screen: e.target.value,
                                                        // Reset college and slug when screen changes
                                                        college:
                                                            e.target.value ===
                                                                'profile' ||
                                                            e.target.value ===
                                                                'settings' ||
                                                            e.target.value ===
                                                                'collection' ||
                                                            e.target.value ===
                                                                ''
                                                                ? ''
                                                                : prev.college,
                                                        slug:
                                                            e.target.value ===
                                                                'college' ||
                                                            e.target.value ===
                                                                'profile' ||
                                                            e.target.value ===
                                                                'settings' ||
                                                            e.target.value ===
                                                                'collection' ||
                                                            e.target.value ===
                                                                ''
                                                                ? ''
                                                                : prev.slug,
                                                    }))
                                                }
                                                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            >
                                                {NAVIGATION_SCREENS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        {/* College Slug - shown for pyqs, notes, syllabus, store, college */}
                                        {[
                                            'pyqs',
                                            'notes',
                                            'syllabus',
                                            'store',
                                            'college',
                                        ].includes(formData.screen) && (
                                            <div>
                                                <label
                                                    htmlFor='college'
                                                    className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                                                >
                                                    College Slug
                                                </label>
                                                <input
                                                    type='text'
                                                    id='college'
                                                    value={formData.college}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            college:
                                                                e.target.value
                                                                    .toLowerCase()
                                                                    .replace(
                                                                        /\s+/g,
                                                                        '-',
                                                                    ),
                                                        }))
                                                    }
                                                    placeholder='e.g., integral-university'
                                                    className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                                />
                                            </div>
                                        )}

                                        {/* Item Slug - shown for pyqs, notes, syllabus, store */}
                                        {[
                                            'pyqs',
                                            'notes',
                                            'syllabus',
                                            'store',
                                        ].includes(formData.screen) && (
                                            <div>
                                                <label
                                                    htmlFor='slug'
                                                    className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                                                >
                                                    Item Slug (Optional)
                                                </label>
                                                <input
                                                    type='text'
                                                    id='slug'
                                                    value={formData.slug}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            slug: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder='Specific item slug'
                                                    className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='flex items-center justify-between pt-4'>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        Will be sent to{' '}
                                        <strong>
                                            {stats.usersWithPushTokens}
                                        </strong>{' '}
                                        users
                                    </p>
                                    <button
                                        type='submit'
                                        disabled={
                                            sending ||
                                            stats.usersWithPushTokens === 0
                                        }
                                        className='inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors'
                                    >
                                        {sending ? (
                                            <>
                                                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className='w-4 h-4' />
                                                Send Notification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Notification History */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                                <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Notification History
                                </h2>
                            </div>

                            {loading ? (
                                <div className='p-8 text-center'>
                                    <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto' />
                                    <p className='text-gray-500 dark:text-gray-400 mt-2'>
                                        Loading...
                                    </p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className='p-8 text-center'>
                                    <Bell className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                                    <p className='text-gray-500 dark:text-gray-400'>
                                        No notifications sent yet
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className='overflow-x-auto'>
                                        <table className='w-full'>
                                            <thead className='bg-gray-50 dark:bg-gray-700'>
                                                <tr>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Notification
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Sent At
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Recipients
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Status
                                                    </th>
                                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                                                {notifications.map(
                                                    (notification) => (
                                                        <tr
                                                            key={
                                                                notification._id
                                                            }
                                                            className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                        >
                                                            <td className='px-6 py-4'>
                                                                <div>
                                                                    <p className='font-medium text-gray-900 dark:text-white'>
                                                                        {
                                                                            notification.title
                                                                        }
                                                                    </p>
                                                                    <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
                                                                        {
                                                                            notification.body
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
                                                                    <Clock className='w-4 h-4' />
                                                                    {formatDate(
                                                                        notification.createdAt,
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <span className='text-sm text-gray-900 dark:text-white'>
                                                                    {
                                                                        notification.recipientCount
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <div className='flex items-center gap-4'>
                                                                    <div className='flex items-center gap-1 text-green-600 dark:text-green-400'>
                                                                        <CheckCircle className='w-4 h-4' />
                                                                        <span className='text-sm'>
                                                                            {notification.successCount ||
                                                                                0}
                                                                        </span>
                                                                    </div>
                                                                    {notification.failureCount >
                                                                        0 && (
                                                                        <div className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                                                                            <XCircle className='w-4 h-4' />
                                                                            <span className='text-sm'>
                                                                                {
                                                                                    notification.failureCount
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                                <button
                                                                    onClick={() =>
                                                                        handleRepeatNotification(
                                                                            notification,
                                                                        )
                                                                    }
                                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors'
                                                                    title='Repeat this notification'
                                                                >
                                                                    <RotateCcw className='w-3.5 h-3.5' />
                                                                    Repeat
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination.pages > 1 && (
                                        <div className='p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                Showing {notifications.length}{' '}
                                                of {pagination.total}{' '}
                                                notifications
                                            </p>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() =>
                                                        fetchNotifications(
                                                            pagination.page - 1,
                                                        )
                                                    }
                                                    disabled={
                                                        pagination.page === 1
                                                    }
                                                    className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50'
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        fetchNotifications(
                                                            pagination.page + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        pagination.page ===
                                                        pagination.pages
                                                    }
                                                    className='px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50'
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Notifications;
