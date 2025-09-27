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
    Mail,
    Phone,
    ExternalLink,
    AlertTriangle,
    Briefcase,
    Calendar,
    User,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Building,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import OpportunityEditModal from '../components/OpportunityEditModal';

const OpportunityDetail = () => {
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { collegeslug, opportunityid } = useParams();
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
        fetchOpportunity();
    }, [opportunityid]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOpportunity = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/opportunity/${opportunityid}`);
            setOpportunity(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching opportunity:', error);
            setError('Failed to fetch opportunity details');
            toast.error('Failed to fetch opportunity details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete Opportunity',
            message: `Are you sure you want to delete "${opportunity.name}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/opportunity/delete/${opportunity._id}`);
                toast.success('Opportunity deleted successfully');
                navigate(`/${collegeslug}/opportunities`);
            } catch (error) {
                console.error('Error deleting opportunity:', error);
                toast.error('Failed to delete opportunity');
            }
        }
    };

    const handleApplyNow = () => {
        if (opportunity.link) {
            window.open(opportunity.link, '_blank');
        } else if (opportunity.email) {
            window.location.href = `mailto:${opportunity.email}?subject=Application for ${opportunity.name}`;
        } else {
            toast.info('No application method available');
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSuccess = () => {
        fetchOpportunity();
        handleModalClose();
    };

    const getStatusColor = (status) => {
        const colors = {
            approved:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            rejected:
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status) => {
        const icons = {
            approved: CheckCircle,
            pending: Clock,
            rejected: XCircle,
        };
        const Icon = icons[status] || Clock;
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
                            Loading opportunity details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !opportunity) {
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
                                Opportunity Not Found
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 mb-4'>
                                {error ||
                                    'The requested opportunity could not be found.'}
                            </p>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/opportunities`)
                                }
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                Back to Opportunities
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
                        Back to Opportunities
                    </button>
                </div>

                {/* Opportunity Header */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'>
                    <div className='bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 px-6 py-8'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-6'>
                                <div className='w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center'>
                                    <Briefcase className='h-12 w-12 text-white' />
                                </div>
                                <div>
                                    <div className='flex items-center space-x-3 mb-2'>
                                        <h1 className='text-3xl font-bold text-white'>
                                            {opportunity.name}
                                        </h1>
                                        <span
                                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                opportunity.submissionStatus,
                                            )} bg-white/20 text-white`}
                                        >
                                            {getStatusIcon(
                                                opportunity.submissionStatus,
                                            )}
                                            <span className='capitalize'>
                                                {opportunity.submissionStatus}
                                            </span>
                                        </span>
                                    </div>
                                    <div className='flex items-center space-x-4 text-white/90'>
                                        <div className='flex items-center space-x-1'>
                                            <User className='h-4 w-4' />
                                            <span>
                                                Posted by{' '}
                                                {opportunity.owner?.username ||
                                                    'Unknown'}
                                            </span>
                                        </div>
                                        <div className='flex items-center space-x-1'>
                                            <Calendar className='h-4 w-4' />
                                            <span>
                                                {new Date(
                                                    opportunity.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={handleApplyNow}
                                    className='flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white font-medium'
                                >
                                    <ExternalLink className='h-4 w-4' />
                                    <span>Apply Now</span>
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Edit Opportunity'
                                >
                                    <Edit2 className='h-5 w-5' />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className='p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white'
                                    title='Delete Opportunity'
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
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                About This Opportunity
                            </h3>
                            <div className='prose dark:prose-invert max-w-none'>
                                <p className='text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap'>
                                    {opportunity.description}
                                </p>
                            </div>
                        </div>

                        {/* Application Instructions */}
                        <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <ExternalLink className='h-5 w-5 text-blue-500' />
                                How to Apply
                            </h3>
                            <div className='space-y-3'>
                                {opportunity.link && (
                                    <div className='flex items-center space-x-3 text-sm'>
                                        <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center'>
                                            <span className='text-blue-600 dark:text-blue-400 font-semibold text-xs'>
                                                1
                                            </span>
                                        </div>
                                        <span className='text-gray-700 dark:text-gray-300'>
                                            Click "Apply Now" to visit the
                                            application portal
                                        </span>
                                    </div>
                                )}
                                <div className='flex items-center space-x-3 text-sm'>
                                    <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center'>
                                        <span className='text-blue-600 dark:text-blue-400 font-semibold text-xs'>
                                            {opportunity.link ? '2' : '1'}
                                        </span>
                                    </div>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        Contact the recruiter using the provided
                                        email or WhatsApp
                                    </span>
                                </div>
                                <div className='flex items-center space-x-3 text-sm'>
                                    <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center'>
                                        <span className='text-blue-600 dark:text-blue-400 font-semibold text-xs'>
                                            {opportunity.link ? '3' : '2'}
                                        </span>
                                    </div>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        Prepare your resume and cover letter
                                    </span>
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
                                <div className='flex items-center space-x-3'>
                                    <Mail className='h-4 w-4 text-gray-400' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                                            Email
                                        </p>
                                        <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                            {opportunity.email}
                                        </p>
                                    </div>
                                </div>

                                {opportunity.whatsapp && (
                                    <div className='flex items-center space-x-3'>
                                        <Phone className='h-4 w-4 text-gray-400' />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                WhatsApp
                                            </p>
                                            <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                                {opportunity.whatsapp}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {opportunity.link && (
                                    <div className='flex items-center space-x-3'>
                                        <ExternalLink className='h-4 w-4 text-gray-400' />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                Application Link
                                            </p>
                                            <a
                                                href={opportunity.link}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline'
                                            >
                                                Apply Online
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Actions */}
                            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2'>
                                <button
                                    onClick={() => {
                                        window.location.href = `mailto:${opportunity.email}?subject=Application for ${opportunity.name}`;
                                    }}
                                    className='w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
                                >
                                    <Mail className='h-4 w-4' />
                                    <span>Send Email</span>
                                </button>

                                {opportunity.whatsapp && (
                                    <button
                                        onClick={() => {
                                            window.open(
                                                `https://wa.me/${opportunity.whatsapp.replace(
                                                    /[^0-9]/g,
                                                    '',
                                                )}?text=Hi, I'm interested in the ${
                                                    opportunity.name
                                                } opportunity.`,
                                                '_blank',
                                            );
                                        }}
                                        className='w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors'
                                    >
                                        <Phone className='h-4 w-4' />
                                        <span>WhatsApp</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Opportunity Details */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                                Opportunity Details
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Opportunity ID:
                                    </span>
                                    <span className='text-sm font-mono text-gray-900 dark:text-gray-100'>
                                        {opportunity._id.slice(-6)}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Posted:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            opportunity.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Last Updated:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {new Date(
                                            opportunity.updatedAt ||
                                                opportunity.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        College:
                                    </span>
                                    <span className='text-sm text-gray-900 dark:text-gray-100'>
                                        {opportunity.college?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        Status:
                                    </span>
                                    <span
                                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            opportunity.submissionStatus,
                                        )}`}
                                    >
                                        {getStatusIcon(
                                            opportunity.submissionStatus,
                                        )}
                                        <span className='capitalize'>
                                            {opportunity.submissionStatus}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className='bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white'>
                            <h3 className='text-lg font-semibold mb-2'>
                                Don't Miss Out!
                            </h3>
                            <p className='text-orange-100 text-sm mb-4'>
                                This is a great opportunity. Apply now to secure
                                your spot.
                            </p>
                            <button
                                onClick={handleApplyNow}
                                className='w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium'
                            >
                                Apply Now
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

            <OpportunityEditModal
                isOpen={showModal}
                onClose={handleModalClose}
                opportunity={opportunity}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default OpportunityDetail;
