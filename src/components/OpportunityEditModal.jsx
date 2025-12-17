import React, { useState, useEffect } from 'react';
import { X, Loader, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const OpportunityEditModal = ({ isOpen, onClose, opportunity, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: '',
        whatsapp: '',
        link: '',
        submissionStatus: 'pending',
        rejectionReason: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (opportunity) {
            setFormData({
                name: opportunity.name || '',
                description: opportunity.description || '',
                email: opportunity.email || '',
                whatsapp: opportunity.whatsapp || '',
                link: opportunity.link || '',
                submissionStatus: opportunity.submissionStatus || 'pending',
                rejectionReason: opportunity.rejectionReason || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                email: '',
                whatsapp: '',
                link: '',
                submissionStatus: 'pending',
                rejectionReason: '',
            });
        }
        setErrors({});
    }, [opportunity]);

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Opportunity name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.link && !isValidUrl(formData.link)) {
            newErrors.link = 'Please enter a valid URL';
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

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (opportunity) {
                // Update existing opportunity
                await api.put(`/opportunity/edit/${opportunity._id}`, formData);
                toast.success('Opportunity updated successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving opportunity:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to save opportunity';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
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
                                {opportunity ? 'Edit Opportunity' : 'Create Opportunity'}
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {opportunity?.college?.collegeName || 'Opportunities'}
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

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
                            {/* Status */}
                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Status <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='submissionStatus'
                                        value={formData.submissionStatus}
                                        onChange={handleChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        <option value='pending'>Pending</option>
                                        <option value='approved'>Approved</option>
                                        <option value='rejected'>Rejected</option>
                                    </select>
                                </div>
                                {formData.submissionStatus === 'rejected' && (
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                            Rejection Reason <span className='text-red-500'>*</span>
                                        </label>
                                        <textarea
                                            name='rejectionReason'
                                            value={formData.rejectionReason}
                                            onChange={handleChange}
                                            rows={2}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                                errors.rejectionReason
                                                    ? 'border-red-300'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                            placeholder='Reason for rejection...'
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

                            {/* Opportunity Name */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Opportunity Name <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='name'
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.name
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='e.g., Software Engineer Internship'
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
                                    onChange={handleChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none ${
                                        errors.description
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Describe the opportunity, requirements, and benefits...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Email and WhatsApp */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Email <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='email'
                                        name='email'
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.email
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='contact@company.com'
                                    />
                                    {errors.email && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        WhatsApp Number
                                    </label>
                                    <input
                                        type='text'
                                        name='whatsapp'
                                        value={formData.whatsapp}
                                        onChange={handleChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='+1234567890'
                                    />
                                </div>
                            </div>

                            {/* Application Link */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Application Link
                                </label>
                                <input
                                    type='url'
                                    name='link'
                                    value={formData.link}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.link
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://company.com/apply'
                                />
                                {errors.link && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.link}
                                    </p>
                                )}
                            </div>
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
                                ) : (
                                    opportunity ? 'Update' : 'Create'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OpportunityEditModal;
