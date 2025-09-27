import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
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
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import VideoEditModal from '../components/VideoEditModal';

const VideoDetail = () => {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { collegeslug, videoid } = useParams();
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
                ...config,
                isOpen: true,
                onConfirm: () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    resolve(true);
                },
            });
        });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const fetchVideo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/video/${videoid}`);
            setVideo(response.data.data);
            setError(null);
        } catch (err) {
            setError(
                err.response?.data?.message || 'Failed to fetch video details',
            );
            toast.error('Failed to fetch video details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideo();
    }, [videoid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Delete Video',
            message: `Are you sure you want to delete "${video.title}"? This action cannot be undone.`,
            variant: 'danger',
        });

        if (confirmed) {
            try {
                await api.delete(`/video/delete/${video._id}`);
                toast.success('Video deleted successfully');
                navigate(`/${collegeslug}/videos`);
            } catch (err) {
                toast.error(
                    err.response?.data?.message || 'Failed to delete video',
                );
            }
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const extractVideoId = (url) => {
        const regex =
            /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleModalSuccess = (updatedVideo) => {
        setVideo(updatedVideo);
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center h-96'>
                    <div className='flex items-center space-x-2'>
                        <Loader className='h-6 w-6 animate-spin text-red-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading video details...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex flex-col items-center justify-center h-96 space-y-4'>
                    <div className='text-red-500 text-6xl'>😞</div>
                    <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                        Video Not Found
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400 text-center max-w-md'>
                        {error ||
                            "The video you're looking for doesn't exist or may have been deleted."}
                    </p>
                    <button
                        onClick={() => navigate(`/${collegeslug}/videos`)}
                        className='mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Videos</span>
                    </button>
                </div>
            </div>
        );
    }

    const videoId = extractVideoId(video.videoUrl);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <div className='p-6'>
                {/* Header */}
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center space-x-4'>
                        <button
                            onClick={() => navigate(`/${collegeslug}/videos`)}
                            className='p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors'
                        >
                            <ArrowLeft className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                        </button>
                        <div>
                            <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                                Video Details
                            </h1>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {video.title}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center space-x-3'>
                        <button
                            onClick={handleEdit}
                            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
                        >
                            <Edit2 className='h-4 w-4' />
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
                        >
                            <Trash2 className='h-4 w-4' />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className='grid lg:grid-cols-3 gap-6'>
                    {/* Video Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        {/* Video Player */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
                            <div className='aspect-video bg-gray-900 relative'>
                                {videoId ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title={video.title}
                                        className='w-full h-full'
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-center text-white'>
                                            <Play className='h-16 w-16 mx-auto mb-4 opacity-60' />
                                            <p className='text-lg opacity-80'>
                                                Video Preview Not Available
                                            </p>
                                            <a
                                                href={video.videoUrl}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='inline-flex items-center space-x-2 mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors'
                                            >
                                                <ExternalLink className='h-4 w-4' />
                                                <span>Open Video</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Info */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>
                                {video.title}
                            </h2>
                            {video.description && (
                                <p className='text-gray-600 dark:text-gray-400 mb-4 leading-relaxed'>
                                    {video.description}
                                </p>
                            )}

                            {/* Video Stats */}
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                                <div className='flex items-center space-x-2'>
                                    <Eye className='h-4 w-4 text-gray-400' />
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        {formatNumber(video.clickCounts || 0)}{' '}
                                        views
                                    </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Clock className='h-4 w-4 text-gray-400' />
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        {video.duration || 'N/A'}
                                    </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Calendar className='h-4 w-4 text-gray-400' />
                                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                                        {new Date(
                                            video.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        {/* Details Card */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4'>
                                Details
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center space-x-3'>
                                    <BookOpen className='h-4 w-4 text-blue-500' />
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                                            Subject
                                        </p>
                                        <p className='font-medium text-gray-800 dark:text-gray-200'>
                                            {video.subject?.subjectName ||
                                                'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-3'>
                                    <User className='h-4 w-4 text-green-500' />
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                                            Created by
                                        </p>
                                        <p className='font-medium text-gray-800 dark:text-gray-200'>
                                            {video.owner?.username || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-3'>
                                    <ExternalLink className='h-4 w-4 text-purple-500' />
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                                            Video URL
                                        </p>
                                        <a
                                            href={video.videoUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm'
                                        >
                                            Open Original Video
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />

            <VideoEditModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                video={video}
                onSuccess={handleModalSuccess}
                collegeslug={collegeslug}
            />
        </div>
    );
};

export default VideoDetail;
