import React, { useState, useEffect } from 'react';
import {
    X,
    AlertTriangle,
    Loader,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const NotesEditModal = ({ isOpen, onClose, note, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        submissionStatus: 'pending',
        slug: '',
        isPaid: false,
        price: 0,
        rejectionReason: '',
        isDownloadable: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (note && isOpen) {
            setFormData({
                title: note.title || '',
                description: note.description || '',
                submissionStatus: note.submissionStatus || 'pending',
                slug: note.slug || '',
                isPaid: note.isPaid || false,
                price: note.price || 0,
                rejectionReason: note.rejectionReason || '',
                isDownloadable: note.isDownloadable || true,
            });
            setErrors({});
        }
    }, [note, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        if (!formData.description?.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description =
                'Description must be at least 10 characters long';
        } else if (formData.description.trim().length > 500) {
            newErrors.description =
                'Description must be less than 500 characters';
        }

        if (formData.slug && formData.slug.trim()) {
            const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            if (!slugPattern.test(formData.slug.trim())) {
                newErrors.slug =
                    'Slug must contain only lowercase letters, numbers, and hyphens';
            }
        }

        if (formData.isPaid) {
            if (!formData.price || formData.price < 0) {
                newErrors.price = 'Price must be a positive number';
            } else if (formData.price > 1000) {
                newErrors.price = 'Price cannot exceed ₹1000';
            }
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason?.trim()
        ) {
            newErrors.rejectionReason = 'Rejection reason is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            };

            // Automatically manage slug suffix based on submission status
            if (name === 'submissionStatus') {
                const currentSlug = prev.slug || '';
                const baseSlug = currentSlug.replace(/-rejected$/, ''); // Remove existing -rejected suffix
                
                if (value === 'rejected') {
                    // Add -rejected suffix if not already present
                    newData.slug = baseSlug + '-rejected';
                } else {
                    // Remove -rejected suffix for approved/pending
                    newData.slug = baseSlug;
                }
            }

            return newData;
        });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }

        // Reset price when switching from paid to free
        if (name === 'isPaid' && !checked) {
            setFormData((prev) => ({ ...prev, price: 0 }));
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
            const updateData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                submissionStatus: formData.submissionStatus,
                slug: formData.slug.trim() || undefined,
                isPaid: formData.isPaid,
                price: formData.isPaid ? Number(formData.price) : 0,
                rejectionReason:
                    formData.submissionStatus === 'rejected'
                        ? formData.rejectionReason.trim()
                        : undefined,
                isDownloadable: formData.isDownloadable,
            };

            const response = await api.put(
                `/notes/edit/${note._id}`,
                updateData,
            );

            if (response.data.success) {
                toast.success('Note updated successfully');
                onClose();
                onSuccess?.(response.data.data.updatedNotes);
            }
        } catch (error) {
            console.error('Error updating note:', error);
            toast.error(
                error.response?.data?.message || 'Failed to update note',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50'>
            <div className='flex items-center justify-center min-h-screen p-4'>
                <div
                    className='fixed inset-0'
                    onClick={onClose}
                ></div>
                
                <div className='relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                        <div>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Edit Note
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {note?.subject?.subjectName}
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
                            {/* Status */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Status <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    name='submissionStatus'
                                    value={formData.submissionStatus}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.submissionStatus
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    <option value='pending'>Pending</option>
                                    <option value='approved'>Approved</option>
                                    <option value='rejected'>Rejected</option>
                                </select>
                                {errors.submissionStatus && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.submissionStatus}
                                    </p>
                                )}
                            </div>

                            {/* Rejection Reason */}
                            {formData.submissionStatus === 'rejected' && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Rejection Reason <span className='text-red-500'>*</span>
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
                                        placeholder='Enter rejection reason...'
                                    />
                                    {errors.rejectionReason && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Title <span className='text-red-500'>*</span>
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
                                    placeholder='Enter note title...'
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
                                    Description <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    name='description'
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        errors.description
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter note description...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    URL Slug
                                </label>
                                <input
                                    type='text'
                                    name='slug'
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.slug
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., calculus-chapter-1'
                                />
                                {errors.slug && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            
                           <div className='flex gap-2'>
                             {/* Paid Resource Checkbox */}
                            <div className='space-y-2'>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        name='isDownloadable'
                                        checked={formData.isDownloadable}
                                        onChange={handleInputChange}
                                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                       Is Downloadable
                                    </span>
                                </label>
                            </div>

                            {/* Paid Resource Checkbox */}
                            <div className='space-y-2'>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        name='isPaid'
                                        checked={formData.isPaid}
                                        onChange={handleInputChange}
                                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                        Paid Resource
                                    </span>
                                </label>
                            </div>
                           </div>

                            {/* Price */}
                            {formData.isPaid && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Price (₹) <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='number'
                                        name='price'
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        min='0'
                                        max='1000'
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.price
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='0'
                                    />
                                    {errors.price && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.price}
                                        </p>
                                    )}
                                </div>
                            )}
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
                                    'Update Note'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NotesEditModal;

