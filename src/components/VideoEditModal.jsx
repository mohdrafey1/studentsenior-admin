import React, { useState, useEffect } from 'react';
import { X, Loader, Play, Save, Link as LinkIcon } from 'lucide-react';
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto'>
                {/* Header */}
                <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                    <div className='flex items-center space-x-3'>
                        <div className='p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg'>
                            <Play className='h-5 w-5 text-white' />
                        </div>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                            {video ? 'Edit Video' : 'Add New Video'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                    >
                        <X className='h-6 w-6' />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='p-6'>
                    <div className='space-y-6'>
                        {/* Video Title */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                Video Title *
                            </label>
                            <input
                                type='text'
                                name='title'
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                    errors.title
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder='e.g., Introduction to Data Structures'
                            />
                            {errors.title && (
                                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                Description *
                            </label>
                            <textarea
                                name='description'
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                    errors.description
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder='Provide a detailed description of the video content...'
                            />
                            {errors.description && (
                                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Video URL */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                Video URL *
                            </label>
                            <div className='relative'>
                                <LinkIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                                <input
                                    type='url'
                                    name='videoUrl'
                                    value={formData.videoUrl}
                                    onChange={handleVideoUrlChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                        errors.videoUrl
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://www.youtube.com/watch?v=...'
                                />
                            </div>
                            {errors.videoUrl && (
                                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                                    {errors.videoUrl}
                                </p>
                            )}
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                YouTube, Vimeo, or direct video links supported
                            </p>
                        </div>

                        {/* Subject and Duration */}
                        <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                    Subject *
                                </label>
                                <select
                                    name='subject'
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                        errors.subject
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    <option value=''>Select Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                                {errors.subject && (
                                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                                        {errors.subject}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                    Duration *
                                </label>
                                <input
                                    type='text'
                                    name='duration'
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                        errors.duration
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., 45:30 or 1:25:45'
                                />
                                {errors.duration && (
                                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
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
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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

                        {/* Status (Admin only) */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                Status
                            </label>
                            <select
                                name='submissionStatus'
                                value={formData.submissionStatus}
                                onChange={handleChange}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            >
                                <option value='pending'>Pending Review</option>
                                <option value='approved'>Approved</option>
                                <option value='rejected'>Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? (
                                <>
                                    <Loader className='h-4 w-4 animate-spin' />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className='h-4 w-4' />
                                    <span>
                                        {video ? 'Update Video' : 'Add Video'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VideoEditModal;
