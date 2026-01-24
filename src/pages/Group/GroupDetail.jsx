import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    MessageCircle,
    ExternalLink,
    AlertTriangle,
    GraduationCap,
    Clock,
    User,
    CheckCircle,
    XCircle,
    Calendar,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import GroupEditModal from '../../components/GroupEditModal';

const GroupDetail = () => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRawData, setShowRawData] = useState(false);

    const { collegeslug, groupid } = useParams();
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
        fetchGroup();
    }, [groupid]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchGroup = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/group/${groupid}`);
            setGroup(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching group:', error);
            setError('Failed to fetch group details');
            toast.error('Failed to fetch group details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete WhatsApp Group',
            message: `Are you sure you want to delete "${group.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/group/delete/${group._id}`);
                toast.success('Group deleted successfully');
                navigate(`/${collegeslug}/groups`);
            } catch (error) {
                console.error('Error deleting group:', error);
                toast.error('Failed to delete group');
            }
        }
    };

    const handleJoinGroup = () => {
        if (group.link) {
            window.open(group.link, '_blank');
        } else {
            toast.error('WhatsApp link not available');
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSuccess = () => {
        fetchGroup();
        handleModalClose();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'>
                        <CheckCircle className='h-4 w-4' />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'>
                        <XCircle className='h-4 w-4' />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'>
                        <Clock className='h-4 w-4' />
                        Pending
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <Loader className='h-8 w-8 animate-spin text-blue-600' />
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-8 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back to Groups
                    </button>
                    <div className='text-center py-12'>
                        <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            Group Not Found
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400'>
                            {error || 'The requested group could not be found.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans'>
            <Header />
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                {/* Top Navigation & Actions */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8'>
                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => navigate(-1)}
                            className='p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors'
                        >
                            <ArrowLeft className='h-5 w-5' />
                        </button>
                        <div>
                            <h1 className='text-2xl font-bold flex items-center gap-3'>
                                {group.title}
                                {getStatusBadge(group.submissionStatus)}
                            </h1>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2'>
                                <span className='font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded'>
                                    ID: {group._id}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handleEdit}
                            className='flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium'
                        >
                            <Edit2 className='h-4 w-4' />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className='flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium'
                        >
                            <Trash2 className='h-4 w-4' />
                            Delete
                        </button>
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Left Column: Group Info */}
                    <div className='lg:col-span-2 space-y-8'>
                        {/* Status Alert - Only if rejected */}
                        {group.submissionStatus === 'rejected' && (
                            <div className='bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg'>
                                <div className='flex'>
                                    <div className='flex-shrink-0'>
                                        <AlertTriangle className='h-5 w-5 text-red-500' />
                                    </div>
                                    <div className='ml-3'>
                                        <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                                            Group Rejected
                                        </h3>
                                        <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                                            <p>{group.rejectionReason}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Group Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col md:flex-row items-center md:items-start gap-8'>
                            <div className='flex-shrink-0'>
                                <div className='h-32 w-32 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg'>
                                    <MessageCircle className='h-16 w-16 text-white' />
                                </div>
                            </div>
                            <div className='text-center md:text-left flex-1'>
                                <h2 className='text-2xl font-bold mb-2'>
                                    {group.title}
                                </h2>
                                <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6'>
                                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                                        <GraduationCap className='h-3.5 w-3.5' />
                                        {group.domain || 'All Domains'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleJoinGroup}
                                    className='inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm'
                                >
                                    <MessageCircle className='h-5 w-5' />
                                    Join Group
                                    <ExternalLink className='h-4 w-4' />
                                </button>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-4'>
                                About This Group
                            </h2>
                            <div className='prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed'>
                                {group.info || 'No information provided.'}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Metadata & Details */}
                    <div className='space-y-8'>
                        {/* Info Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-6 flex items-center gap-2'>
                                <MessageCircle className='h-5 w-5 text-gray-400' />
                                Group Details
                            </h2>
                            <dl className='space-y-4'>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Group Link
                                    </dt>
                                    <dd className='text-sm break-all'>
                                        {group.link ? (
                                            <a
                                                href={group.link}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-blue-600 dark:text-blue-400 hover:underline'
                                            >
                                                {group.link}
                                            </a>
                                        ) : (
                                            <span className='text-gray-500 dark:text-gray-400'>
                                                N/A
                                            </span>
                                        )}
                                    </dd>
                                </div>
                                {group.rejectionReason && (
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                            Rejection Reason
                                        </dt>
                                        <dd className='text-sm text-red-600 dark:text-red-400'>
                                            {group.rejectionReason}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Created By
                                    </dt>
                                    <dd className='flex items-center gap-2 text-sm'>
                                        <div className='h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400'>
                                            <User className='h-3.5 w-3.5' />
                                        </div>
                                        {group.owner?.username || 'Unknown'}
                                    </dd>
                                </div>

                                <div className='pt-4 border-t border-gray-100 dark:border-gray-700'>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Timestamps
                                    </dt>
                                    <dd className='space-y-2 text-sm'>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-500'>
                                                Created
                                            </span>
                                            <span className='font-mono'>
                                                {new Date(
                                                    group.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-500'>
                                                Updated
                                            </span>
                                            <span className='font-mono'>
                                                {new Date(
                                                    group.updatedAt ||
                                                        group.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Raw Data Toggle */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <button
                                onClick={() => setShowRawData(!showRawData)}
                                className='w-full flex items-center justify-between px-6 py-4 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                            >
                                <span className='text-gray-900 dark:text-white'>
                                    Raw Data
                                </span>
                                <span className='text-blue-600 dark:text-blue-400'>
                                    {showRawData ? 'Hide' : 'Show'}
                                </span>
                            </button>
                            {showRawData && (
                                <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto'>
                                    <pre className='text-xs font-mono text-gray-600 dark:text-gray-400'>
                                        {JSON.stringify(group, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={handleCloseConfirm}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    variant={confirmModal.variant}
                />

                <GroupEditModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    group={group}
                    onSuccess={handleModalSuccess}
                />
            </div>
        </div>
    );
};

export default GroupDetail;
