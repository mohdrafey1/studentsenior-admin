import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { X, AlertTriangle, Loader } from 'lucide-react';

const PyqEditModal = ({ isOpen, onClose, pyq, onUpdate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        year: '',
        examType: '',
        submissionStatus: 'pending',
        rejectionReason: '',
        slug: '',
        price: 0,
        solved: false,
        isPaid: false,
    });
    const [errors, setErrors] = useState({});

    const academicYears = [
        '2021-22',
        '2022-23',
        '2023-24',
        '2024-25',
        '2025-26',
    ];

    const examTypes = [
        { value: 'midsem1', label: 'Mid Semester 1' },
        { value: 'midsem2', label: 'Mid Semester 2' },
        { value: 'endsem', label: 'End Semester' },
        { value: 'improvement', label: 'Improvement' },
    ];

    useEffect(() => {
        if (pyq && isOpen) {
            setFormData({
                year: pyq.year || '',
                examType: pyq.examType || '',
                submissionStatus: pyq.submissionStatus || 'pending',
                rejectionReason: pyq.rejectionReason || '',
                slug: pyq.slug || '',
                price: pyq.price || 0,
                solved: pyq.solved || false,
                isPaid: pyq.isPaid || false,
            });
            setErrors({});
        }
    }, [pyq, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.year.trim()) {
            newErrors.year = 'Academic year is required';
        }

        if (!formData.examType.trim()) {
            newErrors.examType = 'Exam type is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Paper identifier is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug =
                'Only lowercase letters, numbers, and hyphens allowed';
        }

        if (formData.isPaid) {
            const price = Number(formData.price);
            if (!formData.price) {
                newErrors.price = 'Price is required for paid resources';
            } else if (isNaN(price) || price <= 0) {
                newErrors.price = 'Price must be a positive number';
            } else if (price > 1000) {
                newErrors.price = 'Price cannot exceed ₹1000';
            }
        }

        if (!formData.submissionStatus) {
            newErrors.submissionStatus = 'Status is required';
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
            const updatedPyq = {
                year: formData.year,
                examType: formData.examType,
                submissionStatus: formData.submissionStatus,
                slug: formData.slug,
                price: formData.isPaid ? Number(formData.price) : 0,
                rejectionReason:
                    formData.submissionStatus === 'rejected'
                        ? formData.rejectionReason
                        : '',
            };

            await api.put(`/pyq/edit/${pyq._id}`, updatedPyq);
            toast.success('PYQ updated successfully!');
            onUpdate && onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || 'Failed to update PYQ',
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
                                Edit PYQ
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {pyq?.subject?.subjectName}
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
                                    Status{' '}
                                    <span className='text-red-500'>*</span>
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
                                        Rejection Reason{' '}
                                        <span className='text-red-500'>*</span>
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

                            {/* Slug */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Slug <span className='text-red-500'>*</span>
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
                                    placeholder='example-paper-2024'
                                />
                                {errors.slug && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            {/* Year and Exam Type */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Year{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='year'
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.year
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <option value=''>Select year</option>
                                        {academicYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.year && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.year}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Exam Type{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='examType'
                                        value={formData.examType}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.examType
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <option value=''>Select type</option>
                                        {examTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.examType && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.examType}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className='space-y-2'>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        name='solved'
                                        checked={formData.solved}
                                        onChange={handleInputChange}
                                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                        Solved Paper
                                    </span>
                                </label>

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

                            {/* Price */}
                            {formData.isPaid && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Price (₹){' '}
                                        <span className='text-red-500'>*</span>
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
                                    'Update PYQ'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PyqEditModal;
