import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    FileText,
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    X,
    Calendar,
    GraduationCap,
    BookOpen,
    Building,
    User,
    Tag,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    ExternalLink,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import PyqEditModal from '../components/PyqEditModal';

const PyqDetail = () => {
    const [pyq, setPyq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [showModal, setShowModal] = useState(false);

    const [signedUrl, setSignedUrl] = useState(null);
    const [showRawData, setShowRawData] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
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
                onConfirm: () => resolve(true),
            });
        });
    };

    const closeConfirm = () => {
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
        if (activeTab === 'pdf' && pyq?.fileUrl && !signedUrl) {
            fetchSignedUrl(pyq.fileUrl);
        }
    }, [activeTab, pyq?.fileUrl, signedUrl]);

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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className='w-5 h-5 text-green-500' />;
            case 'rejected':
                return <XCircle className='w-5 h-5 text-red-500' />;
            default:
                return <AlertCircle className='w-5 h-5 text-yellow-500' />;
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            approved:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            rejected:
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return statusColors[status] || statusColors.pending;
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
                    <div className='flex items-center space-x-2'>
                        <Loader className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading PYQ...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !pyq) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
                    <div className='text-center'>
                        <XCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
                        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                            PYQ Not Found
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 mb-4'>
                            The PYQ you're looking for doesn't exist or has been
                            removed.
                        </p>
                        <button
                            onClick={() => navigate(`/${collegeslug}/pyqs`)}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                        >
                            <ArrowLeft className='w-4 h-4 mr-2' />
                            Back to PYQs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-6 pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate(`/${collegeslug}/pyqs`)}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-purple-600 text-white p-3 rounded-lg mr-4'>
                                    <FileText className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        {pyq.subject?.subjectName ||
                                            'PYQ Details'}
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        {pyq.year} • {pyq.examType} •{' '}
                                        {pyq.subject?.subjectCode}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <button
                                onClick={handleEdit}
                                className='inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                            >
                                <Edit2 className='w-4 h-4 mr-2' />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className='inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                            >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
                        <div className='border-b border-gray-200 dark:border-gray-700'>
                            <nav className='-mb-px flex'>
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                        activeTab === 'info'
                                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    PYQ Information
                                </button>
                                <button
                                    onClick={() => setActiveTab('pdf')}
                                    className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                        activeTab === 'pdf'
                                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    PDF Viewer
                                </button>
                            </nav>
                        </div>

                        <div className='p-6'>
                            {activeTab === 'info' && (
                                <div className='space-y-6'>
                                    {/* Status Card */}
                                    <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                {getStatusIcon(
                                                    pyq.submissionStatus,
                                                )}
                                                <span className='ml-2 text-sm font-medium text-gray-900 dark:text-white'>
                                                    Submission Status
                                                </span>
                                            </div>
                                            <span
                                                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(
                                                    pyq.submissionStatus,
                                                )}`}
                                            >
                                                {pyq.submissionStatus ||
                                                    'pending'}
                                            </span>
                                        </div>
                                        {pyq.rejectionReason &&
                                            pyq.submissionStatus ===
                                                'rejected' && (
                                                <div className='mt-3 p-3 bg-red-50 dark:bg-red-900/50 rounded-md'>
                                                    <p className='text-sm text-red-700 dark:text-red-300'>
                                                        <strong>
                                                            Rejection Reason:
                                                        </strong>{' '}
                                                        {pyq.rejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    {/* Subject Details */}
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                        <div className='space-y-4'>
                                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                Subject Information
                                            </h3>
                                            <div className='space-y-3'>
                                                <div className='flex items-center'>
                                                    <BookOpen className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Subject
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {
                                                                pyq.subject
                                                                    ?.subjectName
                                                            }{' '}
                                                            (
                                                            {
                                                                pyq.subject
                                                                    ?.subjectCode
                                                            }
                                                            )
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <Building className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Branch
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {
                                                                pyq.subject
                                                                    ?.branch
                                                                    ?.branchName
                                                            }{' '}
                                                            (
                                                            {
                                                                pyq.subject
                                                                    ?.branch
                                                                    ?.branchCode
                                                            }
                                                            )
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <GraduationCap className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Course
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {
                                                                pyq.subject
                                                                    ?.branch
                                                                    ?.course
                                                                    ?.courseName
                                                            }{' '}
                                                            (
                                                            {
                                                                pyq.subject
                                                                    ?.branch
                                                                    ?.course
                                                                    ?.courseCode
                                                            }
                                                            )
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <Calendar className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Semester
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            Semester{' '}
                                                            {
                                                                pyq.subject
                                                                    ?.semester
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='space-y-4'>
                                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                PYQ Details
                                            </h3>
                                            <div className='space-y-3'>
                                                <div className='flex items-center'>
                                                    <Calendar className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Year
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {pyq.year || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <Tag className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Exam Type
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {pyq.examType ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <DollarSign className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Price
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            ₹{pyq.price || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <User className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Uploaded by
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {pyq.owner
                                                                ?.username ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center'>
                                                    <Clock className='w-5 h-5 text-gray-400 mr-3' />
                                                    <div>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            Created
                                                        </p>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {pyq.createdAt
                                                                ? new Date(
                                                                      pyq.createdAt,
                                                                  ).toLocaleDateString()
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    {pyq.slug && (
                                        <div className='bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4'>
                                            <div className='flex items-center'>
                                                <Tag className='w-5 h-5 text-blue-500 mr-2' />
                                                <span className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                                                    URL Slug: {pyq.slug}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Raw Data Toggle */}
                                    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                                        <button
                                            onClick={() =>
                                                setShowRawData(!showRawData)
                                            }
                                            className='flex items-center justify-between w-full text-left'
                                        >
                                            <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                                Raw Data
                                            </span>
                                            <span className='text-xs text-blue-600 dark:text-blue-400 hover:underline'>
                                                {showRawData
                                                    ? 'Hide JSON'
                                                    : 'Show JSON'}
                                            </span>
                                        </button>
                                        {showRawData && (
                                            <div className='mt-4'>
                                                <pre className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300'>
                                                    {JSON.stringify(
                                                        pyq,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pdf' && (
                                <div className='space-y-4'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                            PDF Document
                                        </h3>
                                        <div className='flex items-center space-x-2'>
                                            {signedUrl && (
                                                <>
                                                    <a
                                                        href={signedUrl}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700'
                                                    >
                                                        <ExternalLink className='w-4 h-4 mr-1' />
                                                        Open in New Tab
                                                    </a>
                                                    <a
                                                        href={signedUrl}
                                                        download
                                                        className='inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700'
                                                    >
                                                        <Download className='w-4 h-4 mr-1' />
                                                        Download
                                                    </a>
                                                </>
                                            )}
                                            {pdfLoading && (
                                                <div className='inline-flex items-center px-3 py-1 bg-gray-400 text-white text-sm rounded-md'>
                                                    <Loader className='w-4 h-4 mr-1 animate-spin' />
                                                    Loading...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* PDF Viewer */}
                                    <div className='border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white'>
                                        {pdfLoading ? (
                                            <div className='flex items-center justify-center h-96'>
                                                <div className='text-center'>
                                                    <Loader className='w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin' />
                                                    <p className='text-gray-500 dark:text-gray-400'>
                                                        Loading PDF...
                                                    </p>
                                                </div>
                                            </div>
                                        ) : signedUrl ? (
                                            <iframe
                                                src={`${signedUrl}#view=FitH`}
                                                className='w-full h-[800px]'
                                                title='PYQ PDF'
                                                loading='lazy'
                                            />
                                        ) : pyq.fileUrl ? (
                                            <div className='flex items-center justify-center h-96'>
                                                <div className='text-center'>
                                                    <AlertCircle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
                                                    <p className='text-gray-500 dark:text-gray-400 mb-4'>
                                                        Unable to load PDF
                                                        preview
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            fetchSignedUrl(
                                                                pyq.fileUrl,
                                                            )
                                                        }
                                                        className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                                                    >
                                                        <FileText className='w-4 h-4 mr-2' />
                                                        Retry
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='flex items-center justify-center h-96'>
                                                <div className='text-center'>
                                                    <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                                                    <p className='text-gray-500 dark:text-gray-400'>
                                                        No PDF file available
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit PYQ Modal */}
            <PyqEditModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                pyq={pyq}
                onUpdate={handleModalUpdate}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default PyqDetail;
