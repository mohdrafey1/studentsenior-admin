import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Loader,
    Edit2,
    Trash2,
    Play,
    Calendar,
    User,
    BookOpen,
    Clock,
    Eye,
    ThumbsUp,
    ExternalLink,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Code,
    Video,
    Tag,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import VideoEditModal from '../components/VideoEditModal';

const VideoDetail = () => {
    const { collegeslug, videoid } = useParams();
    const navigate = useNavigate();
    const { mainContentMargin } = useSidebarLayout();

    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [videoid]);

    const fetchVideo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/video/${videoid}`);
            setVideo(response.data.data);
            setError(null);
        } catch (err) {
            setError(
                err.response?.data?.message || 'Failed to fetch video details'
            );
            toast.error('Failed to fetch video details');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleVideoUpdate = (updatedVideo) => {
        setVideo(updatedVideo);
        setIsEditModalOpen(false);
        fetchVideo(); // Refresh
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/video/delete/${video._id}`);
            toast.success('Video deleted successfully');
            navigate(`/${collegeslug}/videos`);
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to delete video'
            );
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const extractVideoId = (url) => {
        if (!url) return null;
        const regex =
            /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Loader className="w-12 h-12 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                            <p className="mt-4 text-gray-600 dark:text-gray-400">
                                Loading video details...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg">
                        {error || 'Video not found'}
                    </div>
                    <button
                        onClick={() => navigate(`/${collegeslug}/videos`)}
                        className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Videos
                    </button>
                </main>
            </div>
        );
    }

    const videoId = extractVideoId(video.videoUrl);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <Header />
            <Sidebar />
            <main
                className={`py-8 ${mainContentMargin} transition-all duration-300`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Navigation */}
                    <nav className="flex mb-8" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-4">
                            <li>
                                <div>
                                    <button
                                        onClick={() =>
                                            navigate(`/${collegeslug}/videos`)
                                        }
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ArrowLeft
                                            className="flex-shrink-0 h-5 w-5"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">Back</span>
                                    </button>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Header */}
                    <div className="md:flex md:items-center md:justify-between mb-8">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                                        video.submissionStatus === 'approved'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : video.submissionStatus ===
                                              'rejected'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    }`}
                                >
                                    {video.submissionStatus &&
                                        video.submissionStatus
                                            .charAt(0)
                                            .toUpperCase() +
                                            video.submissionStatus.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {formatNumber(video.clickCounts || 0)} views
                                </span>
                            </div>
                            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                                {video.title}
                            </h2>
                        </div>
                        <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4 space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewMode(
                                        viewMode === 'formatted'
                                            ? 'raw'
                                            : 'formatted'
                                    )
                                }
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                {viewMode === 'formatted' ? (
                                    <>
                                        <Code className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Raw Data
                                    </>
                                ) : (
                                    <>
                                        <Eye className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        Formatted View
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <Edit2 className="-ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Rejection Alert */}
                    {video.submissionStatus === 'rejected' &&
                        video.rejectionReason && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                            Submission Rejected
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                                            <p>{video.rejectionReason}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info (Left Column) */}
                        <div className="lg:col-span-2 space-y-6">
                            {viewMode === 'formatted' ? (
                                <>
                                    {/* Video Player */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="aspect-w-16 aspect-h-9 bg-black">
                                            {videoId ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    title={video.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <div className="text-center">
                                                        <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        <p>
                                                            Video preview not
                                                            available
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {video.duration ||
                                                            'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {formatNumber(
                                                            video.clickCounts ||
                                                                0
                                                        )}{' '}
                                                        views
                                                    </span>
                                                </div>
                                                <a
                                                    href={video.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    Open in YouTube
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <Tag className="w-5 h-5 text-indigo-500" />
                                                Description
                                            </h3>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="prose dark:prose-invert max-w-none text-gray-500 dark:text-gray-300">
                                                {video.description ? (
                                                    <p className="whitespace-pre-wrap">
                                                        {video.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic">
                                                        No description available
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <Code className="w-5 h-5 text-indigo-500" />
                                            Raw JSON Data
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                            {JSON.stringify(video, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details (Right Column) */}
                        <div className="space-y-6">
                            {/* Metadata */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-indigo-500" />
                                        Video details
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:p-0">
                                    <dl>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Subject
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-gray-400" />
                                                {video.subject?.subjectName ||
                                                    'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        video.submissionStatus ===
                                                        'approved'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : video.submissionStatus ===
                                                              'rejected'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    }`}
                                                >
                                                    {video.submissionStatus &&
                                                        video.submissionStatus
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            video.submissionStatus.slice(
                                                                1
                                                            )}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Uploaded By
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {video.owner?.username || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Created At
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(
                                                    video.createdAt
                                                ).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditModalOpen && (
                    <VideoEditModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        video={video}
                        onSuccess={handleVideoUpdate}
                        collegeslug={collegeslug}
                    />
                )}

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Video"
                    message="Are you sure you want to delete this video? This action cannot be undone."
                    isDeleting={isDeleting}
                />
            </main>
        </div>
    );
};

export default VideoDetail;
