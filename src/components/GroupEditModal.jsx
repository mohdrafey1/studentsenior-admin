import React, { useState, useEffect } from 'react';
import {
    X,
    AlertTriangle,
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
        { value: 'study', label: 'Study Group' },
        { value: 'project', label: 'Project Group' },
        { value: 'general', label: 'General Discussion' },
        { value: 'placement', label: 'Placement/Career' },
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
                            {/* Status */}
                            <div>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        name='isActive'
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                                    />
                                    <span className='text-sm text-gray-700 dark:text-gray-300'>
                                        Group is Active
                                    </span>
                                </label>
                            </div>

                            {/* Group Name */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Group Name <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='groupName'
                                    value={formData.groupName}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.groupName
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='Enter group name...'
                                />
                                {errors.groupName && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.groupName}
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
                                    placeholder='Describe the group purpose...'
                                />
                                {errors.description && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* WhatsApp Link */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    WhatsApp Group Link
                                </label>
                                <input
                                    type='url'
                                    name='groupLink'
                                    value={formData.groupLink}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.groupLink
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='https://chat.whatsapp.com/...'
                                />
                                {errors.groupLink && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.groupLink}
                                    </p>
                                )}
                            </div>

                            {/* Group Type and Semester */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Group Type
                                    </label>
                                    <select
                                        name='groupType'
                                        value={formData.groupType}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                    >
                                        {groupTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Semester
                                    </label>
                                    <select
                                        name='semester'
                                        value={formData.semester}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.semester
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <option value=''>All Semesters</option>
                                        {semesters.map((sem) => (
                                            <option key={sem} value={sem}>
                                                Semester {sem}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.semester && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.semester}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Branch and Subject */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Branch
                                    </label>
                                    <input
                                        type='text'
                                        name='branch'
                                        value={formData.branch}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='e.g., Computer Science'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Subject
                                    </label>
                                    <input
                                        type='text'
                                        name='subject'
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='e.g., Data Structures'
                                    />
                                </div>
                            </div>

                            {/* Member Count */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Member Count
                                </label>
                                <input
                                    type='number'
                                    name='memberCount'
                                    value={formData.memberCount}
                                    onChange={handleInputChange}
                                    min='0'
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                        errors.memberCount
                                            ? 'border-red-300'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder='0'
                                />
                                {errors.memberCount && (
                                    <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                        <AlertTriangle className='h-3 w-3' />
                                        {errors.memberCount}
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
