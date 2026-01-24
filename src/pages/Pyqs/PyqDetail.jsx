import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    Calendar,
    GraduationCap,
    BookOpen,
    Building,
    User,
    Tag,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    ExternalLink,
    Clock,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import PyqEditModal from '../../components/PyqEditModal';

const PyqDetail = () => {
    const [pyq, setPyq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [signedUrl, setSignedUrl] = useState(null);
    const [showRawData, setShowRawData] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const { collegeslug, pyqid } = useParams();
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

    const fetchPyq = async () => {
        try {
            setError(null);
            const response = await api.get(`/pyq/${pyqid}`);
            setPyq(response.data.data);
        } catch (e) {
            console.error(e);
            setError('Failed to load PYQ');
            toast.error('Failed to load PYQ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSignedUrl = async (fileUrl) => {
        try {
            setPdfLoading(true);
            const response = await api.get(
                `https://backend.studentsenior.com/api/v2/aws/signed-url?fileUrl=${encodeURIComponent(
                    fileUrl,
                )}`,
            );
            setSignedUrl(response.data.data.signedUrl);
        } catch (e) {
            console.error('Failed to get signed URL:', e);
            toast.error('Failed to load PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchPyq();
    }, [pyqid]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (showPreview && pyq?.fileUrl && !signedUrl) {
            fetchSignedUrl(pyq.fileUrl);
        }
    }, [showPreview, pyq?.fileUrl, signedUrl]);

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleModalUpdate = () => {
        fetchPyq();
    };

    const handleDelete = async () => {
        const ok = await showConfirm({
            title: 'Delete PYQ',
            message: `Are you sure you want to delete this PYQ for ${pyq.subject?.subjectName}? This action cannot be undone.`,
            variant: 'danger',
        });
        if (!ok) return;

        try {
            await api.delete(`/pyq/delete/${pyq._id}`);
            toast.success('PYQ deleted successfully');
            navigate(`/${collegeslug}/pyqs`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete PYQ');
        }
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

    if (error || !pyq) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <button
                        onClick={() => navigate(`/${collegeslug}/pyqs`)}
                        className='flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-8 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Back to PYQs
                    </button>
                    <div className='text-center py-12'>
                        <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <AlertCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                            PYQ Not Found
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400'>
                            {error ||
                                "The PYQ you're looking for doesn't exist."}
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
                            onClick={() => navigate(`/${collegeslug}/pyqs`)}
                            className='p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors'
                        >
                            <ArrowLeft className='h-5 w-5' />
                        </button>
                        <div>
                            <h1 className='text-2xl font-bold flex items-center gap-3'>
                                {pyq.subject?.subjectName || 'PYQ Details'}
                                {getStatusBadge(pyq.submissionStatus)}
                            </h1>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2'>
                                <span className='font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded'>
                                    ID: {pyq._id}
                                </span>
                                <span>•</span>
                                <span>
                                    Created{' '}
                                    {new Date(
                                        pyq.createdAt,
                                    ).toLocaleDateString()}
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
                    {/* Left Column: Preview & Subject Info */}
                    <div className='lg:col-span-2 space-y-8'>
                        {/* File Preview */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                                <h3 className='font-semibold flex items-center gap-2'>
                                    <FileText className='h-5 w-5 text-gray-400' />
                                    File Preview
                                </h3>
                                {pyq.fileUrl && !showPreview && (
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className='text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1'
                                    >
                                        <Eye className='h-4 w-4' />
                                        Load Preview
                                    </button>
                                )}
                            </div>

                            <div className='bg-gray-100 dark:bg-gray-900 min-h-[300px] flex items-center justify-center'>
                                {showPreview ? (
                                    pdfLoading ? (
                                        <div className='text-center'>
                                            <Loader className='w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-2' />
                                            <p className='text-sm text-gray-500'>
                                                Loading preview...
                                            </p>
                                        </div>
                                    ) : signedUrl ? (
                                        <iframe
                                            src={`${signedUrl}#view=FitH`}
                                            className='w-full h-[600px] border-0'
                                            title='PYQ Preview'
                                        />
                                    ) : (
                                        <div className='text-center p-8'>
                                            <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                                            <p className='text-gray-500'>
                                                Preview could not be loaded.
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className='text-center p-8'>
                                        <FileText className='w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4' />
                                        <p className='text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4'>
                                            Click "Load Preview" to view the
                                            document contents.
                                        </p>
                                        {pyq.fileUrl && (
                                            <a
                                                href={pyq.fileUrl}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                            >
                                                <ExternalLink className='h-4 w-4' />
                                                Open in New Tab
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subject Details */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-6 flex items-center gap-2'>
                                <BookOpen className='h-5 w-5 text-gray-400' />
                                Subject Information
                            </h2>
                            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6'>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Subject
                                    </dt>
                                    <dd className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                        {pyq.subject?.subjectName || 'N/A'} (
                                        {pyq.subject?.subjectCode})
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Branch
                                    </dt>
                                    <dd className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                        {pyq.subject?.branch?.branchName ||
                                            'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Course
                                    </dt>
                                    <dd className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                        {pyq.subject?.branch?.course
                                            ?.courseName || 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Semester
                                    </dt>
                                    <dd className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                        Semester{' '}
                                        {pyq.subject?.semester || 'N/A'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Right Column: Metadata & Details */}
                    <div className='space-y-8'>
                        {/* Status Card */}
                        {pyq.isPaid && (
                            <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                                <div className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                    Price
                                </div>
                                <div className='text-3xl font-bold flex items-center gap-1 text-green-600 dark:text-green-400'>
                                    <DollarSign className='h-6 w-6' />
                                    {pyq.price || 0}
                                </div>
                            </div>
                        )}

                        {/* Info Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-lg font-semibold mb-6 flex items-center gap-2'>
                                <FileText className='h-5 w-5 text-gray-400' />
                                PYQ Details
                            </h2>
                            <dl className='space-y-4'>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Year
                                    </dt>
                                    <dd className='font-medium text-gray-900 dark:text-gray-100'>
                                        {pyq.year || 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Exam Type
                                    </dt>
                                    <dd className='font-medium text-gray-900 dark:text-gray-100'>
                                        {pyq.examType || 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                        Uploaded By
                                    </dt>
                                    <dd className='flex items-center gap-2 text-sm'>
                                        <div className='h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400'>
                                            <User className='h-3.5 w-3.5' />
                                        </div>
                                        {pyq.owner?.username || 'Unknown'}
                                    </dd>
                                </div>
                                {pyq.slug && (
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                            Slug
                                        </dt>
                                        <dd className='text-sm font-mono text-gray-600 dark:text-gray-400 break-all'>
                                            {pyq.slug}
                                        </dd>
                                    </div>
                                )}
                                {pyq.rejectionReason &&
                                    pyq.submissionStatus === 'rejected' && (
                                        <div>
                                            <dt className='text-sm text-gray-500 dark:text-gray-400 font-medium mb-1'>
                                                Rejection Reason
                                            </dt>
                                            <dd className='text-sm text-red-600 dark:text-red-400'>
                                                {pyq.rejectionReason}
                                            </dd>
                                        </div>
                                    )}

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
                                                    pyq.createdAt,
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
                                        {JSON.stringify(pyq, null, 2)}
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

                <PyqEditModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    pyq={pyq}
                    onUpdate={handleModalUpdate}
                />
            </div>
        </div>
    );
};

export default PyqDetail;
