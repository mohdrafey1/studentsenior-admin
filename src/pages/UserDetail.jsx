import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    User,
    ArrowLeft,
    Loader,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Wallet,
    Gift,
    AlertTriangle,
    ShieldBan,
    ShieldCheck,
    Code,
    FileText,
    BookOpen,
    ShoppingBag,
    Users,
    Lightbulb,
    Search,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const UserDetail = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bonusPoints, setBonusPoints] = useState('');
    const [bonusDescription, setBonusDescription] = useState('');
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showRawData, setShowRawData] = useState(false);
    const [userContent, setUserContent] = useState({
        notes: [],
        pyqs: [],
        products: [],
        groups: [],
        opportunities: [],
        lostFound: [],
    });
    const [contentLoading, setContentLoading] = useState(true);

    const { userId } = useParams();
    const navigate = useNavigate();

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
                onConfirm: () => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const handleCloseConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchUser();
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (user?._id) {
            fetchUserContent();
        }
    }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchUserContent = async () => {
        try {
            setContentLoading(true);
            const response = await api.get(`/user/content/${user._id}`);

            const data = response.data.data || {
                notes: [],
                pyqs: [],
                products: [],
                groups: [],
                opportunities: [],
                lostFound: [],
            };

            setUserContent(data);
        } catch (error) {
            console.error('Error fetching user content:', error);
        } finally {
            setContentLoading(false);
        }
    };

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/user/users`);
            const foundUser = response.data.data.find((u) => u._id === userId);
            if (foundUser) {
                setUser(foundUser);
                setError(null);
            } else {
                setError('User not found');
                toast.error('User not found');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to fetch user details');
            toast.error('Failed to fetch user details');
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        const confirmed = await showConfirm({
            title: 'Block User',
            message: `Are you sure you want to block "${user.username}"? They will not be able to access their account.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                const response = await api.patch(
                    `/user/users/${user._id}/block`,
                );
                setUser(response.data.data);
                toast.success('User blocked successfully');
            } catch (error) {
                console.error('Error blocking user:', error);
                toast.error('Failed to block user');
            }
        }
    };

    const handleUnblock = async () => {
        const confirmed = await showConfirm({
            title: 'Unblock User',
            message: `Are you sure you want to unblock "${user.username}"? They will regain access to their account.`,
            variant: 'info',
        });

        if (confirmed) {
            try {
                const response = await api.patch(
                    `/user/users/${user._id}/unblock`,
                );
                setUser(response.data.data);
                toast.success('User unblocked successfully');
            } catch (error) {
                console.error('Error unblocking user:', error);
                toast.error('Failed to unblock user');
            }
        }
    };

    const handleGiveBonus = async () => {
        if (!bonusPoints || parseInt(bonusPoints) <= 0) {
            toast.error('Please enter valid points');
            return;
        }

        const confirmed = await showConfirm({
            title: 'Give Bonus Points',
            message: `Give ${bonusPoints} points to "${user.username}"? This will update their wallet and create a transaction record.`,
            variant: 'info',
        });

        if (confirmed) {
            try {
                setSubmitting(true);
                const response = await api.patch(
                    `/user/users/${user._id}/bonus`,
                    {
                        points: parseInt(bonusPoints),
                        description:
                            bonusDescription ||
                            `Admin bonus of ${bonusPoints} points`,
                    },
                );
                setUser(response.data.data.user);
                toast.success('Bonus given successfully');
                setBonusPoints('');
                setBonusDescription('');
                setShowBonusModal(false);
            } catch (error) {
                console.error('Error giving bonus:', error);
                toast.error('Failed to give bonus');
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading user details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400 mb-4'>
                            {error || 'User not found'}
                        </p>
                        <button
                            onClick={() => navigate('/users')}
                            className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                        >
                            Back to Users
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto'>
                {/* Header */}
                <div className='flex items-center mb-8'>
                    <button
                        onClick={() => navigate('/users')}
                        className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                    >
                        <ArrowLeft className='w-5 h-5' />
                    </button>
                    <div className='flex items-center'>
                        <div className='bg-indigo-600 text-white p-3 rounded-lg mr-4'>
                            <User className='w-6 h-6' />
                        </div>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                {user.username}
                            </h1>
                            <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                User Details
                            </p>
                        </div>
                    </div>
                </div>
                {/* User Info Card */}
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Email */}
                        <div>
                            <div className='flex items-center text-gray-600 dark:text-gray-400 mb-2'>
                                <Mail className='w-4 h-4 mr-2' />
                                <span className='text-sm font-medium'>
                                    Email
                                </span>
                            </div>
                            <p className='text-gray-900 dark:text-white font-semibold'>
                                {user.email}
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <div className='flex items-center text-gray-600 dark:text-gray-400 mb-2'>
                                <Phone className='w-4 h-4 mr-2' />
                                <span className='text-sm font-medium'>
                                    Phone
                                </span>
                            </div>
                            <p className='text-gray-900 dark:text-white font-semibold'>
                                {user.phone || 'Not provided'}
                            </p>
                        </div>

                        {/* College */}
                        <div>
                            <div className='flex items-center text-gray-600 dark:text-gray-400 mb-2'>
                                <MapPin className='w-4 h-4 mr-2' />
                                <span className='text-sm font-medium'>
                                    College
                                </span>
                            </div>
                            <p className='text-gray-900 dark:text-white font-semibold'>
                                {user.college || 'Not provided'}
                            </p>
                        </div>

                        {/* Joined Date */}
                        <div>
                            <div className='flex items-center text-gray-600 dark:text-gray-400 mb-2'>
                                <Calendar className='w-4 h-4 mr-2' />
                                <span className='text-sm font-medium'>
                                    Joined
                                </span>
                            </div>
                            <p className='text-gray-900 dark:text-white font-semibold'>
                                {createdDate}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Wallet & Status Card */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                    {/* Wallet Card */}
                    <div className='bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white'>
                        <div className='flex items-center mb-4'>
                            <Wallet className='w-6 h-6 mr-2' />
                            <h2 className='text-lg font-semibold'>Wallet</h2>
                        </div>
                        <div className='space-y-3'>
                            <div className='flex justify-between items-center py-2 border-b border-indigo-400'>
                                <span className='text-indigo-100'>
                                    Current Balance
                                </span>
                                <span className='text-2xl font-bold'>
                                    {user.wallet?.currentBalance || 0} pts
                                </span>
                            </div>
                            <div className='flex justify-between items-center py-2 border-b border-indigo-400'>
                                <span className='text-indigo-100'>
                                    Total Earning
                                </span>
                                <span className='text-xl font-semibold'>
                                    {user.wallet?.totalEarning || 0} pts
                                </span>
                            </div>
                            <div className='flex justify-between items-center py-2'>
                                <span className='text-indigo-100'>
                                    Total Withdrawal
                                </span>
                                <span className='text-xl font-semibold'>
                                    {user.wallet?.totalWithdrawal || 0} pts
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                            Account Status
                        </h2>
                        <div className='flex items-center mb-4'>
                            {user.blocked ? (
                                <div className='flex items-center'>
                                    <div className='bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full flex items-center'>
                                        <AlertTriangle className='w-4 h-4 mr-2' />
                                        <span className='font-semibold text-sm'>
                                            Blocked
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className='bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full flex items-center'>
                                    <ShieldCheck className='w-4 h-4 mr-2' />
                                    <span className='font-semibold text-sm'>
                                        Active
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className='text-gray-600 dark:text-gray-400 text-sm mb-4'>
                            {user.blocked
                                ? 'This user is currently blocked and cannot access their account.'
                                : 'This user is active and can access their account.'}
                        </p>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className='flex flex-wrap gap-4 mb-6'>
                    <button
                        onClick={() => setShowBonusModal(true)}
                        className='flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm'
                    >
                        <Gift className='w-5 h-5 mr-2' />
                        Give Bonus Points
                    </button>

                    {user.blocked ? (
                        <button
                            onClick={handleUnblock}
                            className='flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm'
                        >
                            <ShieldCheck className='w-5 h-5 mr-2' />
                            Unblock User
                        </button>
                    ) : (
                        <button
                            onClick={handleBlock}
                            className='flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm'
                        >
                            <ShieldBan className='w-5 h-5 mr-2' />
                            Block User
                        </button>
                    )}
                </div>

                {/* User Content Sections */}
                {contentLoading ? (
                    <div className='flex items-center justify-center py-8'>
                        <Loader className='w-6 h-6 text-indigo-600 animate-spin mr-2' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading user content...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Notes Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Notes ({userContent.notes.length})
                                </h3>
                            </div>
                            {userContent.notes.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.notes.map((note) => (
                                        <div
                                            key={note._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {note.title || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                {note.subject || 'No subject'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No notes uploaded
                                </p>
                            )}
                        </div>

                        {/* PYQs Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <BookOpen className='w-5 h-5 text-purple-600 dark:text-purple-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    PYQs ({userContent.pyqs.length})
                                </h3>
                            </div>
                            {userContent.pyqs.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.pyqs.map((pyq) => (
                                        <div
                                            key={pyq._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {pyq.slug || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                {pyq.examType || 'No exam info'}{' '}
                                                - {pyq.year || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No PYQs uploaded
                                </p>
                            )}
                        </div>

                        {/* Products Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <ShoppingBag className='w-5 h-5 text-green-600 dark:text-green-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Products ({userContent.products.length})
                                </h3>
                            </div>
                            {userContent.products.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.products.map((product) => (
                                        <div
                                            key={product._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {product.name || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                Price: ₹{product.price || 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No products created
                                </p>
                            )}
                        </div>

                        {/* Groups Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <Users className='w-5 h-5 text-orange-600 dark:text-orange-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Groups ({userContent.groups.length})
                                </h3>
                            </div>
                            {userContent.groups.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.groups.map((group) => (
                                        <div
                                            key={group._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {group.name || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                {group.description ||
                                                    'No description'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No groups created
                                </p>
                            )}
                        </div>

                        {/* Opportunities Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <Lightbulb className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Opportunities (
                                    {userContent.opportunities.length})
                                </h3>
                            </div>
                            {userContent.opportunities.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.opportunities.map((opp) => (
                                        <div
                                            key={opp._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {opp.name || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                {opp.email || 'No company'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No opportunities posted
                                </p>
                            )}
                        </div>

                        {/* Lost & Found Section */}
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6'>
                            <div className='flex items-center mb-4'>
                                <Search className='w-5 h-5 text-red-600 dark:text-red-400 mr-2' />
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Lost & Found ({userContent.lostFound.length}
                                    )
                                </h3>
                            </div>
                            {userContent.lostFound.length > 0 ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {userContent.lostFound.map((item) => (
                                        <div
                                            key={item._id}
                                            className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow'
                                        >
                                            <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                                {item.title || 'Untitled'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                {item.type || 'No type'} -{' '}
                                                {item.location || 'No location'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-gray-500 dark:text-gray-400'>
                                    No lost & found items posted
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Raw JSON Data Section */}
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                    <button
                        onClick={() => setShowRawData(!showRawData)}
                        className='flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                    >
                        <Code className='w-5 h-5' />
                        {showRawData ? 'Hide' : 'Show'} Raw JSON
                    </button>
                    {showRawData && (
                        <div className='mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700 overflow-auto max-h-96'>
                            <pre className='text-gray-100 text-sm font-mono whitespace-pre-wrap break-words'>
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                {/* 
                {/* Bonus Modal */}
                {showBonusModal && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6'>
                            <div className='flex items-center mb-4'>
                                <div className='bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg mr-3'>
                                    <Gift className='w-6 h-6' />
                                </div>
                                <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Give Bonus Points
                                </h3>
                            </div>

                            <div className='mb-4'>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                    Points
                                </label>
                                <input
                                    type='number'
                                    value={bonusPoints}
                                    onChange={(e) =>
                                        setBonusPoints(e.target.value)
                                    }
                                    placeholder='Enter points'
                                    className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>

                            <div className='mb-6'>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={bonusDescription}
                                    onChange={(e) =>
                                        setBonusDescription(e.target.value)
                                    }
                                    placeholder='Reason for bonus...'
                                    rows='3'
                                    className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white'
                                />
                            </div>

                            <div className='flex gap-3'>
                                <button
                                    onClick={() => {
                                        setShowBonusModal(false);
                                        setBonusPoints('');
                                        setBonusDescription('');
                                    }}
                                    disabled={submitting}
                                    className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGiveBonus}
                                    disabled={submitting}
                                    className='flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                                >
                                    {submitting ? (
                                        <Loader className='w-4 h-4 animate-spin' />
                                    ) : (
                                        'Give Bonus'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={handleCloseConfirm}
                    variant={confirmModal.variant}
                />
            </main>
        </div>
    );
};

export default UserDetail;
