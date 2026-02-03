import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    User,
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    Mail,
    Linkedin,
    Github,
    Instagram,
    MapPin,
    Calendar,
    Briefcase,
    GraduationCap,
    AlertTriangle,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import SeniorEditModal from '../../components/SeniorEditModal';
import ApprovalActions from '../../components/ApprovalActions';

const SeniorDetail = () => {
    const [senior, setSenior] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRawData, setShowRawData] = useState(false);

    const { collegeslug, seniorid } = useParams();
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
        fetchSenior();
    }, [seniorid]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSenior = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/senior/${seniorid}`);
            setSenior(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching senior:', error);
            setError('Failed to fetch senior details');
            toast.error('Failed to fetch senior details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete Senior',
            message: `Are you sure you want to delete "${senior.name}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/senior/delete/${senior._id}`);
                toast.success('Senior deleted successfully');
                navigate(`/${collegeslug}/seniors`);
            } catch (error) {
                console.error('Error deleting senior:', error);
                toast.error('Failed to delete senior');
            }
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSuccess = () => {
        fetchSenior();
        handleModalClose();
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <Loader className='h-8 w-8 animate-spin text-blue-600' />
                </div>
            </div>
        );
    }

    if (error || !senior) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-8 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back to Seniors
                    </button>
                    <div className='text-center py-12'>
                        <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            Senior Not Found
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400'>
                            {error ||
                                'The requested senior could not be found.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans'>
            <Header />
            <Sidebar />
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
                                {senior.name}
                            </h1>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2'>
                                <span className='font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded'>
                                    ID: {senior._id}
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

                <ApprovalActions
                    resourceId={senior._id}
                    resourceType='Senior'
                    currentStatus={senior.submissionStatus}
                    apiEndpoint={`/senior/edit/${senior._id}`}
                    onStatusChange={fetchSenior}
                />

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Left Column: Profile & About */}
                    <div className='lg:col-span-2 space-y-8'>
                        {/* Profile Header Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col md:flex-row items-center md:items-start gap-8'>
                            <div className='flex-shrink-0'>
                                {senior.profilePicture ? (
                                    <img
                                        src={senior.profilePicture}
                                        alt={senior.name}
                                        className='h-32 w-32 rounded-full object-cover ring-4 ring-gray-50 dark:ring-gray-700'
                                    />
                                ) : (
                                    <div className='h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-4 ring-gray-50 dark:ring-gray-700'>
                                        <User className='h-12 w-12 text-gray-400' />
                                    </div>
                                )}
                            </div>
                            <div className='text-center md:text-left flex-1'>
                                <h2 className='text-2xl font-bold mb-2'>
                                    {senior.name}
                                </h2>
                                <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4'>
                                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                                        <Briefcase className='h-3.5 w-3.5' />
                                        {senior.domain || 'N/A'}
                                    </span>
                                    {senior.year && (
                                        <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'>
                                            <GraduationCap className='h-3.5 w-3.5' />
                                            {senior.year}
                                        </span>
                                    )}
                                </div>
                                <div className='flex items-center justify-center md:justify-start gap-4'>
                                    {senior.linkedin && (
                                        <a
                                            href={senior.linkedin}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-gray-400 hover:text-[#0077b5] transition-colors'
                                        >
                                            <Linkedin className='h-6 w-6' />
                                        </a>
                                    )}
                                    {senior.github && (
                                        <a
                                            href={senior.github}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                                        >
                                            <Github className='h-6 w-6' />
                                        </a>
                                    )}
                                    {senior.instagram && (
                                        <a
                                            href={senior.instagram}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-gray-400 hover:text-[#E4405F] transition-colors'
                                        >
                                            <Instagram className='h-6 w-6' />
                                        </a>
                                    )}
                                    {senior.email && (
                                        <a
                                            href={`mailto:${senior.email}`}
                                            className='text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                                        >
                                            <Mail className='h-6 w-6' />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-4'>
                                About
                            </h2>
                            <div className='prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed'>
                                {senior.description ||
                                    'No description provided.'}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Metadata & Details */}
                    <div className='space-y-8'>
                        {/* Info Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-6 flex items-center gap-2'>
                                <User className='h-5 w-5 text-gray-400' />
                                Senior Details
                            </h2>
                            <dl className='space-y-4'>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Branch
                                    </dt>
                                    <dd className='font-medium'>
                                        {senior.branch?.branchName ||
                                            senior.branch ||
                                            'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Created By
                                    </dt>
                                    <dd className='flex items-center gap-2 text-sm'>
                                        <div className='h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400'>
                                            <User className='h-3.5 w-3.5' />
                                        </div>
                                        {senior.owner?.username || 'Unknown'}
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
                                                    senior.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-gray-500'>
                                                Updated
                                            </span>
                                            <span className='font-mono'>
                                                {new Date(
                                                    senior.updatedAt ||
                                                        senior.createdAt,
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
                                        {JSON.stringify(senior, null, 2)}
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

                <SeniorEditModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    senior={senior}
                    onSuccess={handleModalSuccess}
                />
            </div>
        </div>
    );
};

export default SeniorDetail;
