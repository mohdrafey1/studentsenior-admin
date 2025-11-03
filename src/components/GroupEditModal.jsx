import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    AlertTriangle,
    MessageSquare,
    Type,
    FileText,
    Link,
    Building,
    BookOpen,
    Hash,
    Users,
    ExternalLink,
    Loader,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const GroupEditModal = ({ isOpen, onClose, group, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        groupName: '',
        description: '',
        groupLink: '',
        branch: '',
        subject: '',
        semester: '',
        memberCount: '',
        groupType: 'study',
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    const groupTypes = [
        {
            value: 'study',
            label: 'Study Group',
            icon: <BookOpen className='h-4 w-4' />,
        },
        {
            value: 'project',
            label: 'Project Group',
            icon: <Building className='h-4 w-4' />,
        },
        {
            value: 'general',
            label: 'General Discussion',
            icon: <MessageSquare className='h-4 w-4' />,
        },
        {
            value: 'placement',
            label: 'Placement/Career',
            icon: <Users className='h-4 w-4' />,
        },
    ];

    const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

    useEffect(() => {
        if (group && isOpen) {
            setFormData({
                groupName: group.groupName || '',
                description: group.description || '',
                groupLink: group.groupLink || '',
                branch: group.branch || '',
                subject: group.subject || '',
                semester: group.semester || '',
                memberCount: group.memberCount || '',
                groupType: group.groupType || 'study',
                isActive: group.isActive !== undefined ? group.isActive : true,
            });
            setErrors({});
        }
    }, [group, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.groupName.trim()) {
            newErrors.groupName = 'Group name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (formData.groupLink && !isValidWhatsAppLink(formData.groupLink)) {
            newErrors.groupLink = 'Please enter a valid WhatsApp group link';
        }

        if (
            formData.memberCount &&
            (isNaN(formData.memberCount) || Number(formData.memberCount) < 0)
        ) {
            newErrors.memberCount = 'Member count must be a valid number';
        }

        if (
            formData.semester &&
            (isNaN(formData.semester) ||
                Number(formData.semester) < 1 ||
                Number(formData.semester) > 8)
        ) {
            newErrors.semester = 'Semester must be between 1 and 8';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidWhatsAppLink = (url) => {
        const whatsappRegex = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
        return whatsappRegex.test(url);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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
                groupName: formData.groupName.trim(),
                description: formData.description.trim(),
                groupLink: formData.groupLink.trim(),
                branch: formData.branch.trim(),
                subject: formData.subject.trim(),
                semester: formData.semester
                    ? Number(formData.semester)
                    : undefined,
                memberCount: formData.memberCount
                    ? Number(formData.memberCount)
                    : undefined,
                groupType: formData.groupType,
                isActive: formData.isActive,
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

    const getCurrentGroupType = () => {
        return groupTypes.find((type) => type.value === formData.groupType);
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
                        <div className='flex-shrink-0 bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white p-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-3'>
                                    <div className='flex-shrink-0'>
                                        <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                                            <MessageSquare className='w-5 h-5 text-white' />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-white'>
                                            Edit WhatsApp Group
                                        </h3>
                                        <p className='text-sm text-green-100'>
                                            Update group information and
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
                                        <MessageSquare className='h-5 w-5 text-green-500' />
                                        Basic Information
                                    </h3>

                                    <div className='space-y-6'>
                                        <FormField
                                            label='Group Name'
                                            icon={
                                                <Type className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            description='Clear and descriptive group name'
                                            error={errors.groupName}
                                        >
                                            <input
                                                type='text'
                                                name='groupName'
                                                value={formData.groupName}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.groupName
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='Enter group name...'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Description'
                                            icon={
                                                <FileText className='h-4 w-4 text-gray-500' />
                                            }
                                            required
                                            description='Brief description of the group purpose'
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
                                                placeholder='Describe the group purpose and guidelines...'
                                            />
                                        </FormField>

                                        <FormField
                                            label='WhatsApp Group Link'
                                            icon={
                                                <Link className='h-4 w-4 text-gray-500' />
                                            }
                                            description='WhatsApp group invitation link'
                                            error={errors.groupLink}
                                        >
                                            <input
                                                type='url'
                                                name='groupLink'
                                                value={formData.groupLink}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.groupLink
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='https://chat.whatsapp.com/...'
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Academic Information Section */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <BookOpen className='h-5 w-5 text-blue-500' />
                                        Academic Information
                                    </h3>

                                    <div className='grid md:grid-cols-2 gap-6'>
                                        <FormField
                                            label='Branch'
                                            icon={
                                                <Building className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Academic branch (leave empty for all branches)'
                                        >
                                            <input
                                                type='text'
                                                name='branch'
                                                value={formData.branch}
                                                onChange={handleInputChange}
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                placeholder='e.g., Computer Science, Mechanical'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Subject'
                                            icon={
                                                <BookOpen className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Specific subject (leave empty for general)'
                                        >
                                            <input
                                                type='text'
                                                name='subject'
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                placeholder='e.g., Data Structures, Mathematics'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Semester'
                                            icon={
                                                <Hash className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Target semester (leave empty for all)'
                                            error={errors.semester}
                                        >
                                            <select
                                                name='semester'
                                                value={formData.semester}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.semester
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            >
                                                <option value=''>
                                                    All Semesters
                                                </option>
                                                {semesters.map((sem) => (
                                                    <option
                                                        key={sem}
                                                        value={sem}
                                                    >
                                                        Semester {sem}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>

                                        <FormField
                                            label='Group Type'
                                            icon={getCurrentGroupType()?.icon}
                                            description='Purpose of the group'
                                        >
                                            <select
                                                name='groupType'
                                                value={formData.groupType}
                                                onChange={handleInputChange}
                                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                            >
                                                {groupTypes.map((type) => (
                                                    <option
                                                        key={type.value}
                                                        value={type.value}
                                                    >
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>
                                    </div>
                                </div>

                                {/* Group Settings Section */}
                                <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                        <Users className='h-5 w-5 text-purple-500' />
                                        Group Settings
                                    </h3>

                                    <div className='grid md:grid-cols-2 gap-6'>
                                        <FormField
                                            label='Member Count'
                                            icon={
                                                <Users className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Current number of members'
                                            error={errors.memberCount}
                                        >
                                            <input
                                                type='number'
                                                name='memberCount'
                                                value={formData.memberCount}
                                                onChange={handleInputChange}
                                                min='0'
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.memberCount
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                                placeholder='0'
                                            />
                                        </FormField>

                                        <FormField
                                            label='Status'
                                            icon={
                                                <MessageSquare className='h-4 w-4 text-gray-500' />
                                            }
                                            description='Group availability status'
                                        >
                                            <div className='flex items-center space-x-3'>
                                                <label className='flex items-center'>
                                                    <input
                                                        type='checkbox'
                                                        name='isActive'
                                                        checked={
                                                            formData.isActive
                                                        }
                                                        onChange={
                                                            handleInputChange
                                                        }
                                                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded'
                                                    />
                                                    <span className='ml-2 text-sm text-gray-900 dark:text-gray-100'>
                                                        Group is active and
                                                        accepting members
                                                    </span>
                                                </label>
                                            </div>
                                        </FormField>
                                    </div>
                                </div>

                                {/* Group Information */}
                                {group && (
                                    <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                            <MessageSquare className='h-5 w-5 text-green-500' />
                                            Group Information
                                        </h3>
                                        <div className='grid md:grid-cols-2 gap-6'>
                                            <div className='space-y-2'>
                                                <label className='text-gray-500 dark:text-gray-400'>
                                                    Group ID
                                                </label>
                                                <div className='text-gray-900 dark:text-gray-100 font-mono text-sm'>
                                                    {group._id}
                                                </div>
                                            </div>
                                            <div className='space-y-2'>
                                                <label className='text-gray-500 dark:text-gray-400'>
                                                    College
                                                </label>
                                                <div className='flex items-center space-x-2'>
                                                    <Building className='h-4 w-4 text-gray-400' />
                                                    <span className='text-gray-900 dark:text-gray-100'>
                                                        {group.college
                                                            ?.collegeName ||
                                                            'N/A'}
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
                                        {group &&
                                            new Date(
                                                group.updatedAt ||
                                                    group.createdAt,
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
                                            className='px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className='h-4 w-4' />
                                                    Update Group
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

export default GroupEditModal;
