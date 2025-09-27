import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const EditCollegeModal = ({
    isOpen,
    onClose,
    college,
    onSave,
    loading = false,
    readOnly = false,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        slug: '',
        status: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (college) {
            setFormData({
                name: college.name || '',
                description: college.description || '',
                location: college.location || '',
                slug: college.slug || '',
                status: college.status !== undefined ? college.status : true,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                location: '',
                slug: '',
                status: true,
            });
        }
        setErrors({});
    }, [college, isOpen]);

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));

        if (errors.name) {
            setErrors((prev) => ({ ...prev, name: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'College name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'College name must be at least 2 characters';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug =
                'Slug can only contain lowercase letters, numbers, and hyphens';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description =
                'Description must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[9999] overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
                {/* Background overlay */}
                <div
                    className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                    onClick={onClose}
                ></div>

                {/* Modal centering span */}
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>

                {/* Modal */}
                <div className='relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    {/* Header */}
                    <div className='bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                                {readOnly ? 'View College' : 'Edit College'}
                            </h3>
                            <button
                                onClick={onClose}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                disabled={loading}
                            >
                                <X className='h-6 w-6' />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className='bg-white dark:bg-gray-800 px-6 py-4'
                    >
                        <div className='space-y-4'>
                            {/* College Name */}
                            <div>
                                <label
                                    htmlFor='name'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    College Name *
                                </label>
                                <input
                                    type='text'
                                    id='name'
                                    name='name'
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                                        errors.name
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter college name'
                                    disabled={loading || readOnly}
                                />
                                {errors.name && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label
                                    htmlFor='location'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Location *
                                </label>
                                <input
                                    type='text'
                                    id='location'
                                    name='location'
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                                        errors.location
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter location'
                                    disabled={loading || readOnly}
                                />
                                {errors.location && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.location}
                                    </p>
                                )}
                            </div>

                            {/* Slug */}
                            <div>
                                <label
                                    htmlFor='slug'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Slug *
                                </label>
                                <input
                                    type='text'
                                    id='slug'
                                    name='slug'
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm ${
                                        errors.slug
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='college-slug'
                                    disabled={loading || readOnly}
                                />
                                {errors.slug && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.slug}
                                    </p>
                                )}
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    URL-friendly version of the college name
                                    (auto-generated)
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor='description'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Description *
                                </label>
                                <textarea
                                    id='description'
                                    name='description'
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none ${
                                        errors.description
                                            ? 'border-red-300 dark:border-red-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter college description'
                                    disabled={loading || readOnly}
                                />
                                {errors.description && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div className='flex items-center'>
                                <input
                                    type='checkbox'
                                    id='status'
                                    name='status'
                                    checked={formData.status}
                                    onChange={handleChange}
                                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                    disabled={loading || readOnly}
                                />
                                <label
                                    htmlFor='status'
                                    className='ml-2 block text-sm text-gray-700 dark:text-gray-300'
                                >
                                    Active Status
                                </label>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className='mt-6 flex justify-end space-x-3'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                                disabled={loading}
                            >
                                {readOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!readOnly && (
                                <button
                                    type='submit'
                                    className='inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    disabled={loading}
                                >
                                    {loading && (
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    )}
                                    <Save className='h-4 w-4 mr-2' />
                                    Update
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCollegeModal;
