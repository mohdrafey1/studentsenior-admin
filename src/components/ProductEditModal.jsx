import React, { useState, useEffect } from 'react';
import { X, Loader, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ProductEditModal = ({ isOpen, onClose, product, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        image: '',
        submissionStatus: 'pending',
        rejectionReason: '',
        slug: '',
        available: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                image: product.image || '',
                submissionStatus:
                    product.submissionStatus === true
                        ? 'approved'
                        : product.submissionStatus === false
                          ? 'pending'
                          : product.submissionStatus || 'pending',
                rejectionReason: product.rejectionReason || '',
                slug: product.slug || '',
                available:
                    product.available !== undefined ? product.available : true,
            });
            setErrors({});
        }
    }, [product, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Name cannot exceed 200 characters';
        }

        if (!formData.description?.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length > 1000) {
            newErrors.description = 'Description cannot exceed 1000 characters';
        }

        if (formData.price < 0) {
            newErrors.price = 'Price cannot be negative';
        } else if (formData.price > 100000) {
            newErrors.price = 'Price cannot exceed ₹1,00,000';
        }

        if (formData.slug && formData.slug.trim()) {
            const slugPattern = /^[a-z0-9-]+$/;
            if (!slugPattern.test(formData.slug.trim())) {
                newErrors.slug =
                    'Slug can only contain lowercase letters, numbers, and hyphens';
            }
        }

        if (formData.image && formData.image.trim()) {
            try {
                new URL(formData.image);
            } catch {
                newErrors.image = 'Please provide a valid image URL';
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
                [name]:
                    type === 'checkbox'
                        ? checked
                        : type === 'number'
                          ? Number(value)
                          : value,
            };

            // Automatically manage slug suffix based on submission status
            if (name === 'submissionStatus') {
                const currentSlug = prev.slug || '';
                const baseSlug = currentSlug.replace(/-rejected$/, '');
                
                if (value === 'rejected') {
                    newData.slug = baseSlug + '-rejected';
                } else {
                    newData.slug = baseSlug;
                }
            }

            return newData;
        });

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
            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                image: formData.image.trim() || undefined,
                submissionStatus: formData.submissionStatus,
                rejectionReason:
                    formData.submissionStatus === 'rejected'
                        ? formData.rejectionReason.trim()
                        : undefined,
                slug: formData.slug.trim() || undefined,
                available: formData.available,
            };

            await api.put(`/store/edit/${product._id}`, updateData);
            toast.success('Product updated successfully!');
            onClose();
            onSuccess && onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || 'Failed to update product',
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
                                Edit Product
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {product?.owner?.username || 'Store'}
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
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                >
                                    <option value='pending'>Pending</option>
                                    <option value='approved'>Approved</option>
                                    <option value='rejected'>Rejected</option>
                                </select>
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

                            {/* Name */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Product Name <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='name'
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.name
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter product name...'
                                />
                                {errors.name && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.name}
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
                                    placeholder='Enter product description...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Price and Slug */}
                            <div className='grid grid-cols-2 gap-4'>
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
                                        max='100000'
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
                                        placeholder='product-slug'
                                    />
                                    {errors.slug && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Image URL
                                </label>
                                <input
                                    type='url'
                                    name='image'
                                    value={formData.image}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.image
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://example.com/image.jpg'
                                />
                                {errors.image && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            {/* Available Checkbox */}
                            <div>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        name='available'
                                        checked={formData.available}
                                        onChange={handleInputChange}
                                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                        Available for Purchase
                                    </span>
                                </label>
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
                                    'Update Product'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductEditModal;
