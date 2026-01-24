import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const GroupEditModal = ({ isOpen, onClose, group, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        info: '',
        link: '',
        domain: '',
        submissionStatus: 'pending',
        rejectionReason: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (group && isOpen) {
            setFormData({
                title: group.title || '',
                info: group.info || '',
                link: group.link || '',
                domain: group.domain || '',
                submissionStatus: group.submissionStatus || 'pending',
                rejectionReason: group.rejectionReason || '',
            });
            setErrors({});
        }
    }, [group, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Group title is required';
        }

        if (!formData.info.trim()) {
            newErrors.info = 'Info/Description is required';
        }

        if (formData.link && !isValidWhatsAppLink(formData.link)) {
            newErrors.link = 'Please enter a valid WhatsApp group link';
        }

        if (!formData.domain.trim()) {
            newErrors.domain = 'Domain is required';
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason.trim()
        ) {
            newErrors.rejectionReason =
                'Rejection reason is required when status is rejected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidWhatsAppLink = (url) => {
        const whatsappRegex = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
        return whatsappRegex.test(url);
    };

    const handleInputChange = (e) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setIsSubmitting(true);

        try {
            const updatedGroup = {
                title: formData.title.trim(),
                info: formData.info.trim(),
                link: formData.link.trim(),
                domain: formData.domain.trim(),
                submissionStatus: formData.submissionStatus,
                rejectionReason: formData.rejectionReason.trim() || undefined,
            };

            await api.put(`/group/edit/${group._id}`, updatedGroup);
            toast.success('Group updated successfully!');
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || 'Failed to update group',
            );
        } finally {
            setIsSubmitting(false);
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
                                Edit WhatsApp Group
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {group?.college?.collegeName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
                            disabled={isSubmitting}
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
                            {/* Status and Rejection Reason */}
                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Status{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='submissionStatus'
                                        value={formData.submissionStatus}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        <option value='pending'>Pending</option>
                                        <option value='approved'>
                                            Approved
                                        </option>
                                        <option value='rejected'>
                                            Rejected
                                        </option>
                                    </select>
                                </div>

                                {formData.submissionStatus === 'rejected' && (
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                            Rejection Reason{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            name='rejectionReason'
                                            value={formData.rejectionReason}
                                            onChange={handleInputChange}
                                            rows={2}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white resize-none ${
                                                errors.rejectionReason
                                                    ? 'border-red-300'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                            placeholder='Provide rejection reason...'
                                        />
                                        {errors.rejectionReason && (
                                            <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                                <AlertTriangle className='h-3 w-3' />
                                                {errors.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Group Title */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Group Title{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='title'
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.title
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter group title...'
                                />
                                {errors.title && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Info/Description */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Info / Description{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    name='info'
                                    value={formData.info}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        errors.info
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Describe the group purpose...'
                                />
                                {errors.info && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.info}
                                    </p>
                                )}
                            </div>

                            {/* WhatsApp Link */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    WhatsApp Group Link{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='url'
                                    name='link'
                                    value={formData.link}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.link
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://chat.whatsapp.com/...'
                                />
                                {errors.link && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.link}
                                    </p>
                                )}
                            </div>

                            {/* Domain */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Domain{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='domain'
                                    value={formData.domain}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.domain
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., Computer Science, General...'
                                />
                                {errors.domain && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.domain}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700'>
                            <button
                                type='button'
                                onClick={onClose}
                                disabled={isSubmitting}
                                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2'
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className='h-4 w-4 animate-spin' />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Group'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GroupEditModal;
