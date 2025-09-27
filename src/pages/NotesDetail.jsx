import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    FileText,
    User,
    Calendar,
    BookOpen,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    Building,
    Link,
    ExternalLink,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import NotesEditModal from '../components/NotesEditModal';
import { getStatusBadge } from '../utils/getStatusColor';

const NotesDetail = () => {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [showModal, setShowModal] = useState(false);
    const [signedUrl, setSignedUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const { collegeslug, noteid } = useParams();
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
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const fetchNote = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/notes/${noteid}`);
            setNote(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch note');
            toast.error('Failed to fetch note details');
        } finally {
            setLoading(false);
        }
    };

    const fetchSignedUrl = async (fileUrl) => {
        try {
            setPdfLoading(true);
            const response = await api.get(
                `http://localhost:8081/api/v2/aws/signed-url?fileUrl=${encodeURIComponent(
                    fileUrl,
                )}`,
            );
            setSignedUrl(response.data.data.signedUrl);
        } catch (error) {
            console.error('Error fetching signed URL:', error);
            toast.error('Failed to load PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchNote();
    }, [noteid]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'preview' && note?.fileUrl && !signedUrl) {
            fetchSignedUrl(note.fileUrl);
        }
    }, [activeTab, note?.fileUrl, signedUrl]);

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete Note',
            message: `Are you sure you want to delete "${note?.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/dashboard/notes/delete/${note._id}`);
                toast.success('Note deleted successfully');
                navigate(`/${collegeslug}/notes`);
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete note',
                );
            }
        }
        closeConfirm();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case true:
                return <CheckCircle2 className='w-5 h-5 text-green-500' />;
            case false:
                return <Clock className='w-5 h-5 text-yellow-500' />;
            default:
                return <Clock className='w-5 h-5 text-yellow-500' />;
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                    <div className='flex items-center justify-center h-96'>
                        <div className='text-center'>
                            <Loader className='w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400' />
                            <p className='mt-4 text-gray-600 dark:text-gray-400'>
                                Loading note details...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                    <div className='text-center py-12'>
                        <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                            Note Not Found
                        </h2>
                        <p className='text-gray-600 dark:text-gray-400 mb-8'>
                            {error ||
                                "The note you're looking for doesn't exist."}
                        </p>
                        <button
                            onClick={() => navigate(`/${collegeslug}/notes`)}
                            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            <ArrowLeft className='w-4 h-4 mr-2' />
                            Back to Notes
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
                <div className='px-4 py-6 sm:px-0'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center space-x-4'>
                            <button
                                onClick={() =>
                                    navigate(`/${collegeslug}/notes`)
                                }
                                className='inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            >
                                <ArrowLeft className='w-4 h-4 mr-2' />
                                Back to Notes
                            </button>
                            <div className='flex items-center'>
                                <FileText className='w-8 h-8 text-purple-600 dark:text-purple-400 mr-3' />
                                <div>
                                    <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                                        {note.title}
                                    </h1>
                                    <div className='flex items-center space-x-4 mt-1'>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                                note.submissionStatus,
                                            )}`}
                                        >
                                            {getStatusIcon(
                                                note.submissionStatus,
                                            )}
                                            <span className='ml-1'>
                                                {note.submissionStatus}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex items-center space-x-3'>
                            <button
                                onClick={handleEdit}
                                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            >
                                <Edit2 className='w-4 h-4 mr-2' />
                                Edit Note
                            </button>
                            <button
                                onClick={handleDelete}
                                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                            >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className='border-b border-gray-200 dark:border-gray-700 mb-6'>
                        <nav className='-mb-px flex space-x-8'>
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'info'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                Information
                            </button>
                            {note.fileUrl && (
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'preview'
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Preview
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className='bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg'>
                        {activeTab === 'info' && (
                            <div className='px-4 py-5 sm:p-6'>
                                <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2'>
                                    <div>
                                        <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                            <FileText className='w-4 h-4 mr-2' />
                                            Title
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                            {note.title || 'N/A'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                            <BookOpen className='w-4 h-4 mr-2' />
                                            Subject
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                            {note.subject?.subjectName || 'N/A'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                            <User className='w-4 h-4 mr-2' />
                                            Owner
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                            {note.owner?.username || 'N/A'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                            <Calendar className='w-4 h-4 mr-2' />
                                            Created
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                            {note.createdAt
                                                ? new Date(
                                                      note.createdAt,
                                                  ).toLocaleString()
                                                : 'N/A'}
                                        </dd>
                                    </div>

                                    {note.slug && (
                                        <div>
                                            <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                                <Link className='w-4 h-4 mr-2' />
                                                Slug
                                            </dt>
                                            <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                                {note.slug}
                                            </dd>
                                        </div>
                                    )}

                                    <div className='sm:col-span-2'>
                                        <dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Description
                                        </dt>
                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                                            {note.description ||
                                                'No description provided'}
                                        </dd>
                                    </div>

                                    {note.fileUrl && (
                                        <div className='sm:col-span-2'>
                                            <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center'>
                                                <ExternalLink className='w-4 h-4 mr-2' />
                                                File
                                            </dt>
                                            <dd className='mt-1'>
                                                <a
                                                    href={note.fileUrl}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300'
                                                >
                                                    View Original File
                                                    <ExternalLink className='w-4 h-4 ml-1' />
                                                </a>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}

                        {activeTab === 'preview' && note.fileUrl && (
                            <div className='p-6'>
                                <div className='bg-gray-100 dark:bg-gray-700 rounded-lg p-4'>
                                    {pdfLoading ? (
                                        <div className='flex items-center justify-center h-96'>
                                            <div className='text-center'>
                                                <Loader className='w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400' />
                                                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                                                    Loading preview...
                                                </p>
                                            </div>
                                        </div>
                                    ) : signedUrl ? (
                                        <iframe
                                            src={signedUrl}
                                            className='w-full h-96 border-0 rounded'
                                            title='Note Preview'
                                        />
                                    ) : (
                                        <div className='flex items-center justify-center h-96'>
                                            <div className='text-center'>
                                                <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                                                <p className='text-gray-600 dark:text-gray-400'>
                                                    Preview not available
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <NotesEditModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                note={note}
                onSuccess={(updatedNote) => {
                    setNote(updatedNote);
                    setShowModal(false);
                }}
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

export default NotesDetail;
