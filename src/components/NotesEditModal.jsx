import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    AlertTriangle,
    FileText,
    Type,
    CheckCircle2,
    Clock,
    XCircle,
    Link,
    User,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const NotesEditModal = ({ isOpen, onClose, note, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: false,
        slug: '',
    });
    const [errors, setErrors] = useState({});

    const statusOptions = [
        {
            value: false,
            label: 'Pending Review',
            icon: <Clock className='h-4 w-4' />,
            color: 'amber',
            description: 'Waiting for admin approval',
        },
        {
            value: true,
            label: 'Approved',
            icon: <CheckCircle2 className='h-4 w-4' />,
            color: 'green',
            description: 'Available to students',
        },
    ];

    useEffect(() => {
        if (note && isOpen) {
            setFormData({
                title: note.title || '',
                description: note.description || '',
                status: note.status || false,
                slug: note.slug || '',
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStatusChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            status: value,
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
                title: formData.title.trim(),
                description: formData.description.trim(),
                status: formData.status,
                slug: formData.slug.trim() || undefined,
            };

            const response = await api.put(
                `/notes/edit/${note._id}`,
                updateData,
            );

            if (response.data.success) {
                toast.success('Note updated successfully');
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
                <p className='text-xs text-gray-500 dark:text-gray-400 -mt-1'>
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
        return statusOptions.find((option) => option.value === formData.status);
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
            <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                <div
                    className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
                    onClick={onClose}
                ></div>
                <span
                    className='hidden sm:inline-block sm:align-middle sm:h-screen'
                    aria-hidden='true'
                >
                    &#8203;
                </span>
                <div className='inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10'>
                    <div className='flex flex-col h-full max-h-[90vh]'>
                        {/* Header with gradient */}
                        <div className='flex-shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-3'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                                            <FileText className='w-5 h-5 text-white' />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-white'>
                                            Edit Note
                                        </h3>
                                        <p className='text-sm text-purple-100'>
                                            Update note information and settings
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

                        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
                            {/* Basic Information Section */}
                            <div className='space-y-4'>
                                <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2'>
                                    Basic Information
                                </h4>

                                <FormField
                                    label='Title'
                                    icon={
                                        <Type className='h-4 w-4 text-gray-500' />
                                    }
                                    required
                                    description='Clear and descriptive title for the note'
                                    error={errors.title}
                                >
                                    <input
                                        type='text'
                                        name='title'
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                            errors.title
                                                ? 'border-red-300 dark:border-red-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder='Enter note title...'
                                    />
                                </FormField>

                                <FormField
                                    label='Description'
                                    icon={
                                        <FileText className='h-4 w-4 text-gray-500' />
                                    }
                                    required
                                    description='Detailed description of the note content'
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
                                        placeholder='Enter note description...'
                                    />
                                </FormField>

                                <FormField
                                    label='URL Slug'
                                    icon={
                                        <Link className='h-4 w-4 text-gray-500' />
                                    }
                                    description='Custom URL identifier (optional)'
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
                                        placeholder='e.g., calculus-chapter-1'
                                    />
                                </FormField>
                            </div>

                            {/* Status Section */}
                            <div className='space-y-4'>
                                <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2'>
                                    Status Management
                                </h4>

                                <FormField
                                    label='Approval Status'
                                    icon={getCurrentStatus()?.icon}
                                    description='Current status of the note'
                                >
                                    <div className='grid grid-cols-1 gap-3'>
                                        {statusOptions.map((option) => (
                                            <label
                                                key={option.value}
                                                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all ${
                                                    formData.status ===
                                                    option.value
                                                        ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                <input
                                                    type='radio'
                                                    name='status'
                                                    checked={
                                                        formData.status ===
                                                        option.value
                                                    }
                                                    onChange={() =>
                                                        handleStatusChange(
                                                            option.value,
                                                        )
                                                    }
                                                    className='sr-only'
                                                />
                                                <div className='flex items-center w-full'>
                                                    <div
                                                        className={`flex-shrink-0 text-${option.color}-600 dark:text-${option.color}-400`}
                                                    >
                                                        {option.icon}
                                                    </div>
                                                    <div className='ml-3 flex-1'>
                                                        <div
                                                            className={`text-sm font-medium ${
                                                                formData.status ===
                                                                option.value
                                                                    ? `text-${option.color}-900 dark:text-${option.color}-100`
                                                                    : 'text-gray-900 dark:text-gray-100'
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </div>
                                                        <div
                                                            className={`text-xs ${
                                                                formData.status ===
                                                                option.value
                                                                    ? `text-${option.color}-700 dark:text-${option.color}-300`
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {option.description}
                                                        </div>
                                                    </div>
                                                    {formData.status ===
                                                        option.value && (
                                                        <div
                                                            className={`flex-shrink-0 text-${option.color}-600`}
                                                        >
                                                            <CheckCircle2 className='h-5 w-5' />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </FormField>
                            </div>

                            {/* Note Information */}
                            {note && (
                                <div className='space-y-4'>
                                    <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2'>
                                        Note Information
                                    </h4>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                                        <div className='space-y-2'>
                                            <label className='text-gray-500 dark:text-gray-400'>
                                                Subject
                                            </label>
                                            <div className='flex items-center space-x-2'>
                                                <FileText className='h-4 w-4 text-gray-400' />
                                                <span className='text-gray-900 dark:text-gray-100'>
                                                    {note.subject
                                                        ?.subjectName || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='space-y-2'>
                                            <label className='text-gray-500 dark:text-gray-400'>
                                                Owner
                                            </label>
                                            <div className='flex items-center space-x-2'>
                                                <User className='h-4 w-4 text-gray-400' />
                                                <span className='text-gray-900 dark:text-gray-100'>
                                                    {note.owner?.username ||
                                                        'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className='flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
                                <button
                                    type='button'
                                    onClick={onClose}
                                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className='w-4 h-4 mr-2' />
                                            Update Note
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesEditModal;
