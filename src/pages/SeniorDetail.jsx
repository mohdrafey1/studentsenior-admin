import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    User,
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    Mail,
    Phone,
    Building,
    GraduationCap,
    Calendar,
    Briefcase,
    ExternalLink,
    AlertTriangle,
    Award,
    MapPin,
    Globe,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import SeniorEditModal from '../components/SeniorEditModal';

const SeniorDetail = () => {
    const [senior, setSenior] = useState(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRawData, setShowRawData] = useState(false);
    const { collegeslug, seniorid } = useParams();
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
            title: 'Delete Senior Profile',
            message: `Are you sure you want to delete "${senior.name}"'s profile? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/senior/delete/${senior._id}`);
                toast.success('Senior profile deleted successfully');
                navigate(`/${collegeslug}/seniors`);
            } catch (error) {
                console.error('Error deleting senior:', error);
                toast.error('Failed to delete senior profile');
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
                <div className='flex items-center justify-center min-h-[60vh]'>
                    <div className='text-center'>
                        <Loader className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
                        <p className='text-gray-600 dark:text-gray-400'>
                            Loading senior profile...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !senior) {
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
                                Senior Profile Not Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {error ||
                                    'The requested senior profile could not be found.'}
                            </p>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/seniors`)
                                }
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Back to Seniors
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
                        Back to Seniors
                    </button>
                </div>

                {/* Senior Header */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'>
                    <div className='bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-6 py-8'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-6'>
                                <div className='relative'>
                                    {senior.profilePicture ? (
                                        <img
                                            src={senior.profilePicture}
                                            alt={senior.name}
                                            className='w-24 h-24 rounded-full object-cover border-4 border-white/20'
                                        />
                                    ) : (
                                        <div className='w-24 h-24 bg-white/20 rounded-full flex items-center justify-center'>
                                            <User className='h-12 w-12 text-white' />
                                        </div>
                                    )}
                                    <div className='absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2'>
                                        <GraduationCap className='h-4 w-4 text-white' />
                                    </div>
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-white mb-2'>
                                        {senior.name}
                                    </h1>
                                    <div className='flex items-center space-x-4 text-white/90'>
                                        <div className='flex items-center space-x-1'>
                                            <Building className='h-4 w-4' />
                                            <span>
                                                {senior.domain ||
                                                    'Unknown Branch'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={handleEdit}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Edit Profile'
                                >
                                    <Edit2 className='h-5 w-5' />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Delete Profile'
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
                        {/* About Section */}
                        {senior.description && (
                            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                    About
                                </h3>
                                <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                                    {senior.description}
                                </p>
                            </div>
                        )}

                        {/* Academic Information */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <GraduationCap className='h-5 w-5 text-green-500' />
                                Academic Information
                            </h3>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div className='space-y-3'>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Branch/Department
                                        </label>
                                        <p className='text-gray-900 dark:text-gray-100'>
                                            {senior.branch?.branchName ||
                                                'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Graduation Year
                                        </label>
                                        <p className='text-gray-900 dark:text-gray-100'>
                                            {senior.year || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        {/* Contact Information */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Contact Information
                            </h3>
                            <div className='space-y-3'>
                                {senior.socialMediaLinks.map((link, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center space-x-3'
                                    >
                                        <Globe className='h-4 w-4 text-gray-400' />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                {link.platform}
                                            </p>
                                            <a
                                                href={link.url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1'
                                            >
                                                {link.url}
                                                <ExternalLink className='h-3 w-3' />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile Statistics */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Profile Details
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Joined:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            senior.createdAt,
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Last Updated:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            senior.updatedAt ||
                                                senior.createdAt,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                {senior.owner && (
                                    <div className='flex justify-between'>
                                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                                            Added by:
                                        </span>
                                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                                            {senior.owner.username}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Raw Data Toggle */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <button
                                onClick={() => setShowRawData(!showRawData)}
                                className='flex items-center justify-between w-full text-left'
                            >
                                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                    Raw Data
                                </span>
                                <span className='text-xs text-blue-600 dark:text-blue-400 hover:underline'>
                                    {showRawData ? 'Hide JSON' : 'Show JSON'}
                                </span>
                            </button>
                            {showRawData && (
                                <div className='mt-4'>
                                    <pre className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300'>
                                        {JSON.stringify(senior, null, 2)}
                                    </pre>
                                </div>
                            )}
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

            <SeniorEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                senior={senior}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default SeniorDetail;
