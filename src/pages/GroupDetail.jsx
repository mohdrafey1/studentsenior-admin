import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    MessageCircle,
    Users,
    ExternalLink,
    AlertTriangle,
    Hash,
    Calendar,
    BookOpen,
    GraduationCap,
    Clock,
    User,
    Shield,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import GroupEditModal from '../components/GroupEditModal';

const GroupDetail = () => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
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
            message: `Are you sure you want to delete "${group.groupName}"? This action cannot be undone.`,
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
        if (group.whatsappLink) {
            window.open(group.whatsappLink, '_blank');
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

    const getGroupTypeColor = (type) => {
        const colors = {
            study: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            project:
                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            placement:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            general:
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
            events: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            sports: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[type] || colors.general;
    };

    const getGroupTypeIcon = (type) => {
        const icons = {
            study: BookOpen,
            project: Hash,
            placement: GraduationCap,
            general: MessageCircle,
            events: Calendar,
            sports: Users,
        };
        const Icon = icons[type] || MessageCircle;
        return <Icon className='h-4 w-4' />;
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading group details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back
                    </button>

                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                Group Not Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {error ||
                                    'The requested group could not be found.'}
                            </p>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/groups`)
                                }
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Back to Groups
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                {/* Navigation */}
                <div className='mb-6'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back to Groups
                    </button>
                </div>

                {/* Group Header */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'>
                    <div className='bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 px-6 py-8'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-6'>
                                <div className='w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center'>
                                    <MessageCircle className='h-12 w-12 text-white' />
                                </div>
                                <div>
                                    <div className='flex items-center space-x-3 mb-2'>
                                        <h1 className='text-3xl font-bold text-white'>
                                            {group.groupName}
                                        </h1>
                                        <span
                                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getGroupTypeColor(
                                                group.groupType,
                                            )} bg-white/20 text-white`}
                                        >
                                            {getGroupTypeIcon(group.groupType)}
                                            <span className='capitalize'>
                                                {group.groupType}
                                            </span>
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-4 text-white/90'>
                                        <div className='flex items-center space-x-1'>
                                            <GraduationCap className='h-4 w-4' />
                                            <span>
                                                {group.branch || 'All Branches'}
                                            </span>
                                        </div>
                                        {group.semester && (
                                            <div className='flex items-center space-x-1'>
                                                <BookOpen className='h-4 w-4' />
                                                <span>
                                                    Semester {group.semester}
                                                </span>
                                            </div>
                                        )}
                                        {group.subject && (
                                            <div className='flex items-center space-x-1'>
                                                <Hash className='h-4 w-4' />
                                                <span>{group.subject}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={handleJoinGroup}
                                    className='flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white font-medium'
                                >
                                    <MessageCircle className='h-4 w-4' />
                                    <span>Join Group</span>
                                    <ExternalLink className='h-4 w-4' />
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Edit Group'
                                >
                                    <Edit2 className='h-5 w-5' />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Delete Group'
                                >
                                    <Trash2 className='h-5 w-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid lg:grid-cols-3 gap-6'>
                    {/* Main Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        {/* Description Section */}
                        {group.description && (
                            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                    About This Group
                                </h3>
                                <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                                    {group.description}
                                </p>
                            </div>
                        )}

                        {/* Academic Information */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <GraduationCap className='h-5 w-5 text-blue-500' />
                                Academic Details
                            </h3>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div className='space-y-3'>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Branch/Department
                                        </label>
                                        <p className='text-gray-900 dark:text-gray-100'>
                                            {group.branch || 'All Branches'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Subject
                                        </label>
                                        <p className='text-gray-900 dark:text-gray-100'>
                                            {group.subject ||
                                                'General Discussion'}
                                        </p>
                                    </div>
                                </div>
                                <div className='space-y-3'>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Semester
                                        </label>
                                        <p className='text-gray-900 dark:text-gray-100'>
                                            {group.semester
                                                ? `Semester ${group.semester}`
                                                : 'All Semesters'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Group Type
                                        </label>
                                        <div className='flex items-center space-x-2'>
                                            <span
                                                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getGroupTypeColor(
                                                    group.groupType,
                                                )}`}
                                            >
                                                {getGroupTypeIcon(
                                                    group.groupType,
                                                )}
                                                <span className='capitalize'>
                                                    {group.groupType}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Group Guidelines */}
                        <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <Shield className='h-5 w-5 text-blue-500' />
                                Group Guidelines
                            </h3>
                            <div className='grid md:grid-cols-2 gap-4 text-sm'>
                                <div className='space-y-2'>
                                    <div className='flex items-center space-x-2 text-green-600 dark:text-green-400'>
                                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                                        <span>
                                            Stay on topic and be respectful
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-2 text-green-600 dark:text-green-400'>
                                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                                        <span>
                                            Share relevant academic resources
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-2 text-green-600 dark:text-green-400'>
                                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                                        <span>
                                            Help fellow students with queries
                                        </span>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
                                        <div className='w-1.5 h-1.5 bg-red-500 rounded-full'></div>
                                        <span>
                                            No spam or promotional content
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
                                        <div className='w-1.5 h-1.5 bg-red-500 rounded-full'></div>
                                        <span>
                                            Avoid sharing personal information
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
                                        <div className='w-1.5 h-1.5 bg-red-500 rounded-full'></div>
                                        <span>
                                            No hate speech or discrimination
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        {/* Join Group Card */}
                        <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6'>
                            <div className='text-center'>
                                <div className='w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4'>
                                    <MessageCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
                                </div>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                                    Join the Discussion
                                </h3>
                                <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                                    Connect with your peers and participate in
                                    academic discussions.
                                </p>
                                <button
                                    onClick={handleJoinGroup}
                                    className='w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium'
                                >
                                    <MessageCircle className='h-4 w-4' />
                                    <span>Join WhatsApp Group</span>
                                    <ExternalLink className='h-4 w-4' />
                                </button>
                            </div>
                        </div>

                        {/* Group Information */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Group Information
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Group ID:
                                    </span>
                                    <span className='text-sm font-mono text-gray-900 dark:text-gray-100'>
                                        {group._id.slice(-6)}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Created:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            group.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Last Updated:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            group.updatedAt || group.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        College:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {group.college?.collegeName ||
                                            'Unknown'}
                                    </span>
                                </div>
                                {group.owner && (
                                    <div className='flex justify-between'>
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            Created by:
                                        </span>
                                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                                            {group.owner.username}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Group Stats
                            </h3>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                                    <Clock className='h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1' />
                                    <div className='text-xs text-gray-600 dark:text-gray-400'>
                                        Active Since
                                    </div>
                                    <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            group.createdAt,
                                        ).getFullYear()}
                                    </div>
                                </div>
                                <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                                    <Users className='h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1' />
                                    <div className='text-xs text-gray-600 dark:text-gray-400'>
                                        Group Type
                                    </div>
                                    <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize'>
                                        {group.groupType}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Groups Suggestion */}
                        <div className='bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white'>
                            <h3 className='text-lg font-semibold mb-2'>
                                Explore More Groups
                            </h3>
                            <p className='text-purple-100 text-sm mb-4'>
                                Discover other study groups and academic
                                communities.
                            </p>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/groups`)
                                }
                                className='w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium'
                            >
                                Browse All Groups
                            </button>
                        </div>
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
    );
};

export default GroupDetail;
