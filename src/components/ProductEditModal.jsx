import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    AlertTriangle,
    Package,
    Type,
    FileText,
    DollarSign,
    Tag,
    CheckCircle2,
    Clock,
    XCircle,
    User,
    Loader,
} from 'lucide-react';
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

    const statusOptions = [
        {
            value: 'pending',
            label: 'Pending Review',
            icon: <Clock className='h-4 w-4' />,
            color: 'amber',
            description: 'Waiting for admin approval',
        },
        {
            value: 'approved',
            label: 'Approved',
            icon: <CheckCircle2 className='h-4 w-4' />,
            color: 'green',
            description: 'Available to students',
        },
        {
            value: 'rejected',
            label: 'Rejected',
            icon: <XCircle className='h-4 w-4' />,
            color: 'red',
            description: 'Not approved for use',
        },
    ];

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
        } else if (
            formData.rejectionReason &&
            formData.rejectionReason.trim().length < 10
        ) {
            newErrors.rejectionReason =
                'Rejection reason must be at least 10 characters';
        } else if (
            formData.rejectionReason &&
            formData.rejectionReason.trim().length > 500
        ) {
            newErrors.rejectionReason =
                'Rejection reason cannot exceed 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? checked
                    : type === 'number'
                      ? Number(value)
                      : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleStatusChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            submissionStatus: value,
        }));
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

            await api.put(`/dashboard/store/edit/${product._id}`, updateData);
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

    const FormField = ({
        label,
        icon,
        children,
        required = false,
        description,
        error,
    }) => (
        <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100'>
                {icon}
                {label}
                {required && <span className='text-red-500'>*</span>}
            </label>
            {description && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {description}
                </p>
            )}
            {children}
            {error && (
                <p className='flex items-center gap-1 text-xs text-red-600 dark:text-red-400'>
                    <AlertTriangle className='h-3 w-3' />
                    {error}
                </p>
            )}
        </div>
    );

    const getCurrentStatus = () => {
        return statusOptions.find(
            (option) => option.value === formData.submissionStatus,
        );
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                <div
                    className='fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm bg-opacity-75'
                    onClick={onClose}
                ></div>
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>
                <div className='inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-auto shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full lg:max-w-6xl xl:max-w-7xl relative z-10'>
                    <div className='flex flex-col h-full max-h-[90vh] lg:max-h-[95vh]'>
                        {/* Header */}
                        <div className='flex-shrink-0 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white p-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-3'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                                            <Package className='w-5 h-5 text-white' />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-white'>
                                            Edit Product
                                        </h3>
                                        <p className='text-sm text-green-100'>
                                            Update product information and
                                            settings
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className='text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className='flex-1 flex flex-col overflow-hidden'
                        >
                            <div className='flex-1 overflow-y-auto p-6 space-y-6'>
                                {/* Basic Information Section */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <Package className='h-5 w-5 text-green-500' />
                                        Basic Information
                                    </h3>

                                    <div className='grid md:grid-cols-2 gap-6'>
                                        <FormField
                                            label='Name'
                                            icon={
                                                <Type className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            description='Clear and descriptive product name'
                                            error={errors.name}
                                        >
                                            <input
                                                type='text'
                                                name='name'
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.name
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='Enter product name...'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Price (₹)'
                                            icon={
                                                <DollarSign className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            description='Product price in rupees'
                                            error={errors.price}
                                        >
                                            <input
                                                type='number'
                                                name='price'
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                min='0'
                                                max='100000'
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.price
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='0'
                                            />
                                        </FormField>
                                    </div>

                                    <FormField
                                        label='Description'
                                        icon={
                                            <FileText className='h-4 w-4 text-gray-500' />
                                        }
                                        required
                                        description='Detailed description of the product'
                                        error={errors.description}
                                    >
                                        <textarea
                                            name='description'
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                                                errors.description
                                                    ? 'border-red-300 dark:border-red-600'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            placeholder='Enter product description...'
                                        />
                                    </FormField>

                                    <div className='grid md:grid-cols-2 gap-6'>
                                        <FormField
                                            label='Image URL'
                                            icon={
                                                <Package className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Product image URL'
                                            error={errors.image}
                                        >
                                            <input
                                                type='url'
                                                name='image'
                                                value={formData.image}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.image
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='https://example.com/image.jpg'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Slug'
                                            icon={
                                                <Tag className='h-4 w-4 text-gray-500' />
                                            }
                                            description='URL slug for the product'
                                            error={errors.slug}
                                        >
                                            <input
                                                type='text'
                                                name='slug'
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.slug
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='product-slug'
                                            />
                                        </FormField>
                                    </div>

                                    <div className='flex items-center space-x-3'>
                                        <input
                                            type='checkbox'
                                            name='available'
                                            checked={formData.available}
                                            onChange={handleInputChange}
                                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded'
                                        />
                                        <label className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                            Available for purchase
                                        </label>
                                    </div>
                                </div>

                                {/* Status Management Section */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <CheckCircle2 className='h-5 w-5 text-blue-500' />
                                        Status Management
                                    </h3>

                                    <div className='space-y-4'>
                                        <FormField
                                            label='Approval Status'
                                            icon={getCurrentStatus()?.icon}
                                            required
                                            description='Current approval status of this product'
                                            error={errors.submissionStatus}
                                        >
                                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                                                {statusOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type='button'
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                option.value,
                                                            )
                                                        }
                                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                            formData.submissionStatus ===
                                                            option.value
                                                                ? option.color ===
                                                                  'green'
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                    : option.color ===
                                                                        'amber'
                                                                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                    >
                                                        <div className='flex items-center gap-2 mb-1'>
                                                            {option.icon}
                                                            <span className='font-medium text-gray-900 dark:text-gray-100'>
                                                                {option.label}
                                                            </span>
                                                        </div>
                                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                            {option.description}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </FormField>

                                        {formData.submissionStatus ===
                                            'rejected' && (
                                            <FormField
                                                label='Rejection Reason'
                                                icon={
                                                    <AlertTriangle className='h-4 w-4 text-red-500' />
                                                }
                                                required
                                                description='Explain why this product was rejected'
                                                error={errors.rejectionReason}
                                            >
                                                <textarea
                                                    name='rejectionReason'
                                                    value={
                                                        formData.rejectionReason
                                                    }
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${
                                                        errors.rejectionReason
                                                            ? 'border-red-300 dark:border-red-600'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                    placeholder='Enter the reason for rejection...'
                                                />
                                            </FormField>
                                        )}
                                    </div>
                                </div>

                                {/* Product Information */}
                                {product && (
                                    <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                            <Package className='h-5 w-5 text-purple-500' />
                                            Product Information
                                        </h3>
                                        <div className='grid md:grid-cols-2 gap-6'>
                                            <div className='space-y-2'>
                                                <label className='text-gray-500 dark:text-gray-400'>
                                                    Product ID
                                                </label>
                                                <div className='text-gray-900 dark:text-gray-100 font-mono text-sm'>
                                                    {product._id}
                                                </div>
                                            </div>
                                            <div className='space-y-2'>
                                                <label className='text-gray-500 dark:text-gray-400'>
                                                    Owner
                                                </label>
                                                <div className='flex items-center space-x-2'>
                                                    <User className='h-4 w-4 text-gray-400' />
                                                    <span className='text-gray-900 dark:text-gray-100'>
                                                        {product.owner
                                                            ?.username || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className='flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                        Last updated:{' '}
                                        {product &&
                                            new Date(
                                                product.updatedAt ||
                                                    product.createdAt,
                                            ).toLocaleString()}
                                    </div>
                                    <div className='flex gap-3'>
                                        <button
                                            type='button'
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            disabled={isSubmitting}
                                            className='px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className='h-4 w-4' />
                                                    Update Product
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductEditModal;
