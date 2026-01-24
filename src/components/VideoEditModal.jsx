import React, { useState, useEffect } from 'react';
import { X, Loader, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const VideoEditModal = ({ isOpen, onClose, video, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        subject: '',
        duration: '',
        submissionStatus: 'pending',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const subjects = [
        'Computer Science',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Economics',
        'History',
        'Psychology',
        'Engineering',
        'Business Studies',
        'Other',
    ];

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title || '',
                description: video.description || '',
                videoUrl: video.videoUrl || '',
                thumbnailUrl: video.thumbnailUrl || '',
                subject: video.subject || '',
                duration: video.duration || '',
                submissionStatus: video.submissionStatus || 'pending',
                rejectionReason: video.rejectionReason || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                videoUrl: '',
                thumbnailUrl: '',
                subject: '',
                duration: '',
                submissionStatus: 'pending',
                rejectionReason: '',
            });
        }
        setErrors({});
    }, [video]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const extractVideoId = (url) => {
        const regex =
            /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const generateThumbnail = (videoUrl) => {
        const videoId = extractVideoId(videoUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        return '';
    };

    const handleVideoUrlChange = (e) => {
        const url = e.target.value;
        setFormData((prev) => ({
            ...prev,
            videoUrl: url,
            thumbnailUrl: generateThumbnail(url),
        }));

        if (errors.videoUrl) {
            setErrors((prev) => ({
                ...prev,
                videoUrl: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Video title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.videoUrl.trim()) {
            newErrors.videoUrl = 'Video URL is required';
        } else if (!isValidUrl(formData.videoUrl)) {
            newErrors.videoUrl = 'Please enter a valid video URL';
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.duration.trim()) {
            newErrors.duration = 'Duration is required';
        } else if (!isValidDuration(formData.duration)) {
            newErrors.duration =
                'Please enter duration in format MM:SS or HH:MM:SS';
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason?.trim()
        ) {
            newErrors.rejectionReason =
                'Rejection reason is required when rejecting a video';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    };

    const isValidDuration = (duration) => {
        const regex = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/;
        return regex.test(duration);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const apiData = {
                title: formData.title,
                videoUrl: formData.videoUrl,
                description: formData.description,
                subjectCode: formData.subject,
                submissionStatus: formData.submissionStatus,
                rejectionReason: formData.rejectionReason,
            };

            let response;
            if (video) {
                // Update existing video
                response = await api.put(`/video/edit/${video._id}`, apiData);
            } else {
                // Create new video
                response = await api.post(`/video/create`, apiData);
            }

            if (video) {
                toast.success('Video updated successfully');
            } else {
                toast.success('Video created successfully');
            }
            onSuccess(response.data.data);
        } catch (error) {
            console.error('Error saving video:', error);
            const errorMessage = error.message || 'Failed to save video';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
            <div className='flex items-center justify-center min-h-screen p-4'>
                <div className='fixed inset-0' onClick={onClose}></div>

                <div className='relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                        <div>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {video ? 'Edit Video' : 'Add New Video'}
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {video?.college?.collegeName || 'Videos'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
                            disabled={loading}
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
                            {/* Status */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Status{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    name='submissionStatus'
                                    value={formData.submissionStatus}
                                    onChange={handleChange}
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                >
                                    <option value='pending'>
                                        Pending Review
                                    </option>
                                    <option value='approved'>Approved</option>
                                    <option value='rejected'>Rejected</option>
                                </select>
                            </div>

                            {/* Rejection Reason */}
                            {formData.submissionStatus === 'rejected' && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Rejection Reason{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <textarea
                                        name='rejectionReason'
                                        value={formData.rejectionReason}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                            errors.rejectionReason
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='Please provide a reason for rejection...'
                                    />
                                    {errors.rejectionReason && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Video Title */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Video Title{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='title'
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.title
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., Introduction to Data Structures'
                                />
                                {errors.title && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Description{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    name='description'
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        errors.description
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Provide a detailed description...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Video URL */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Video URL{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='url'
                                    name='videoUrl'
                                    value={formData.videoUrl}
                                    onChange={handleVideoUrlChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.videoUrl
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://www.youtube.com/watch?v=...'
                                />
                                {errors.videoUrl && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.videoUrl}
                                    </p>
                                )}
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    YouTube, Vimeo, or direct video links
                                    supported
                                </p>
                            </div>

                            {/* Subject and Duration */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Subject{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='subject'
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.subject
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <option value=''>Select Subject</option>
                                        {subjects.map((subject) => (
                                            <option
                                                key={subject}
                                                value={subject}
                                            >
                                                {subject}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.subject && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.subject}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Duration{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='duration'
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.duration
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='e.g., 45:30 or 1:25:45'
                                    />
                                    {errors.duration && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.duration}
                                        </p>
                                    )}
                                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                        Format: MM:SS or HH:MM:SS
                                    </p>
                                </div>
                            </div>

                            {/* Thumbnail Preview */}
                            {formData.thumbnailUrl && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Thumbnail Preview
                                    </label>
                                    <div className='relative w-40 h-24 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden'>
                                        <img
                                            src={formData.thumbnailUrl}
                                            alt='Video thumbnail'
                                            className='w-full h-full object-cover'
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700'>
                            <button
                                type='button'
                                onClick={onClose}
                                disabled={loading}
                                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={loading}
                                className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <Loader className='h-4 w-4 animate-spin' />
                                        Saving...
                                    </>
                                ) : video ? (
                                    'Update Video'
                                ) : (
                                    'Add Video'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VideoEditModal;
