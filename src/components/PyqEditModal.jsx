import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
    X,
    FileText,
    Calendar,
    BookOpen,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Hash,
    Award,
    Eye,
    CreditCard,
    DollarSign,
    Info,
    Loader,
} from 'lucide-react';

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
        { value: 'midsem1', label: 'Mid Semester 1', icon: '📝' },
        { value: 'midsem2', label: 'Mid Semester 2', icon: '📄' },
        { value: 'endsem', label: 'End Semester', icon: '📋' },
        { value: 'improvement', label: 'Improvement', icon: '🔄' },
    ];

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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleToggleChange = (name) => {
        setFormData((prev) => ({ ...prev, [name]: !prev[name] }));

        // Reset price when switching from paid to free
        if (name === 'isPaid' && formData.isPaid) {
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

    const ToggleField = ({
        label,
        description,
        isOn,
        onToggle,
        icon,
        color = 'indigo',
    }) => {
        const colorClasses = {
            indigo: isOn ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
            green: isOn ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700',
            amber: isOn ? 'bg-amber-600' : 'bg-gray-200 dark:bg-gray-700',
            red: isOn ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700',
        };

        return (
            <div className='flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'>
                <div className='flex items-start gap-3'>
                    <div className='mt-1'>{icon}</div>
                    <div>
                        <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                            {label}
                        </h4>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                            {description}
                        </p>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={onToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${colorClasses[color]}`}
                    aria-pressed={isOn}
                >
                    <span
                        className={`${
                            isOn ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
                    />
                </button>
            </div>
        );
    };

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
                        {/* Header */}
                        <div className='flex-shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h2 className='text-2xl font-bold mb-2'>
                                        Edit PYQ
                                    </h2>
                                    <p className='text-indigo-100'>
                                        {pyq?.subject?.subjectName} •{' '}
                                        {pyq?.subject?.branch?.branchName}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                                    disabled={isSubmitting}
                                >
                                    <X className='h-5 w-5' />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className='flex-1 flex flex-col overflow-hidden'
                        >
                            <div className='flex-1 overflow-y-auto p-6 space-y-6'>
                                {/* Status Management */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <CheckCircle2 className='h-5 w-5 text-green-500' />
                                        Status Management
                                    </h3>

                                    <div className='space-y-4'>
                                        <FormField
                                            label='Approval Status'
                                            icon={
                                                getCurrentStatus()?.icon || (
                                                    <Clock className='h-4 w-4' />
                                                )
                                            }
                                            required
                                            description='Current approval status of this paper'
                                            error={errors.submissionStatus}
                                        >
                                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                                                {statusOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type='button'
                                                        onClick={() => {
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    submissionStatus:
                                                                        option.value,
                                                                }),
                                                            );
                                                            if (
                                                                errors.submissionStatus
                                                            ) {
                                                                setErrors(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        submissionStatus:
                                                                            '',
                                                                    }),
                                                                );
                                                            }
                                                        }}
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
                                                description='Explain why this paper was rejected'
                                                error={errors.rejectionReason}
                                            >
                                                <textarea
                                                    name='rejectionReason'
                                                    value={
                                                        formData.rejectionReason
                                                    }
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white transition-all resize-none ${
                                                        errors.rejectionReason
                                                            ? 'border-red-300 focus:border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600 focus:border-red-500'
                                                    }`}
                                                    placeholder='Enter the reason for rejection...'
                                                />
                                            </FormField>
                                        )}
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <FileText className='h-5 w-5 text-indigo-500' />
                                        Basic Information
                                    </h3>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                        <FormField
                                            label='Slug'
                                            icon={
                                                <Hash className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            error={errors.slug}
                                        >
                                            <input
                                                type='text'
                                                name='slug'
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all ${
                                                    errors.slug
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                                                }`}
                                                placeholder='example-paper-2024'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Academic Year'
                                            icon={
                                                <Calendar className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            error={errors.year}
                                        >
                                            <select
                                                name='year'
                                                value={formData.year}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all ${
                                                    errors.year
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                                                }`}
                                            >
                                                <option value=''>
                                                    Select academic year
                                                </option>
                                                {academicYears.map((year) => (
                                                    <option
                                                        key={year}
                                                        value={year}
                                                    >
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>

                                        <FormField
                                            label='Exam Type'
                                            icon={
                                                <BookOpen className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            error={errors.examType}
                                        >
                                            <select
                                                name='examType'
                                                value={formData.examType}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all ${
                                                    errors.examType
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                                                }`}
                                            >
                                                <option value=''>
                                                    Select exam type
                                                </option>
                                                {examTypes.map((type) => (
                                                    <option
                                                        key={type.value}
                                                        value={type.value}
                                                    >
                                                        {type.icon} {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>

                                        {formData.isPaid && (
                                            <FormField
                                                label='Price (₹)'
                                                icon={
                                                    <DollarSign className='h-4 w-4 text-gray-500' />
                                                }
                                                required={formData.isPaid}
                                                description='Price students will pay for this paper'
                                                error={errors.price}
                                            >
                                                <input
                                                    type='number'
                                                    name='price'
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    min='0'
                                                    max='1000'
                                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-all ${
                                                        errors.price
                                                            ? 'border-red-300 focus:border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                                                    }`}
                                                    placeholder='0'
                                                />
                                            </FormField>
                                        )}
                                    </div>
                                </div>

                                {/* Properties */}
                                <div className='space-y-4'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                                        <Award className='h-5 w-5 text-purple-500' />
                                        Paper Properties
                                    </h3>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <ToggleField
                                            label='Solved Paper'
                                            description='This paper includes complete solutions'
                                            isOn={formData.solved}
                                            onToggle={() =>
                                                handleToggleChange('solved')
                                            }
                                            icon={
                                                formData.solved ? (
                                                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                                                ) : (
                                                    <Eye className='h-5 w-5 text-gray-400' />
                                                )
                                            }
                                            color='green'
                                        />

                                        <ToggleField
                                            label='Paid Resource'
                                            description='Students need to purchase this paper'
                                            isOn={formData.isPaid}
                                            onToggle={() =>
                                                handleToggleChange('isPaid')
                                            }
                                            icon={
                                                formData.isPaid ? (
                                                    <CreditCard className='h-5 w-5 text-amber-500' />
                                                ) : (
                                                    <DollarSign className='h-5 w-5 text-gray-400' />
                                                )
                                            }
                                            color='amber'
                                        />
                                    </div>
                                </div>

                                {/* Summary Info */}
                                <div className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800'>
                                    <div className='flex items-start gap-3'>
                                        <Info className='h-5 w-5 text-blue-500 mt-0.5' />
                                        <div className='text-sm text-blue-700 dark:text-blue-300'>
                                            <p className='font-medium mb-1'>
                                                Summary
                                            </p>
                                            <p>
                                                This{' '}
                                                {formData.solved
                                                    ? 'solved'
                                                    : 'unsolved'}{' '}
                                                {formData.isPaid
                                                    ? `paid (₹${formData.price})`
                                                    : 'free'}{' '}
                                                paper will be{' '}
                                                {formData.submissionStatus ===
                                                'approved'
                                                    ? 'available to students'
                                                    : formData.submissionStatus ===
                                                        'rejected'
                                                      ? 'hidden from students'
                                                      : 'pending approval'}
                                                .
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className='flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                        Last updated:{' '}
                                        {pyq &&
                                            new Date(
                                                pyq.updatedAt || pyq.createdAt,
                                            ).toLocaleString()}
                                    </div>
                                    <div className='flex gap-3'>
                                        <button
                                            type='button'
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            disabled={isSubmitting}
                                            className='px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader className='h-4 w-4 animate-spin' />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className='h-4 w-4' />
                                                    Update PYQ
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

export default PyqEditModal;
