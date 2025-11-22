import React, { useState, useEffect } from 'react';
import { X, Loader, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';
import { useResources } from '../hooks/useResources';

const SeniorEditModal = ({ isOpen, onClose, senior, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        branch: '',
        year: '',
        domain: '',
        description: '',
        profilePicture: '',
        socialMediaLinks: [],
        submissionStatus: 'pending',
        rejectionReason: '',
        slug: '',
    });
    const [errors, setErrors] = useState({});
    const {
        courses,
        branches: hookBranches,
        loadingCourses,
        loadingBranches,
        fetchCourses,
        fetchBranches,
    } = useResources();

    const [branches, setBranches] = useState([]);

    useEffect(() => {
        setBranches(hookBranches);
    }, [hookBranches]);

    useEffect(() => {
        if (senior && isOpen) {
            const courseId =
                senior.branch?.course?._id ||
                (typeof senior.branch?.course === 'string'
                    ? senior.branch.course
                    : '') ||
                '';
            const branchId =
                senior.branch?._id ||
                (typeof senior.branch === 'string' ? senior.branch : '') ||
                '';

            setFormData({
                name: senior.name || '',
                course: courseId,
                branch: typeof branchId === 'string' ? branchId : '',
                year: senior.year || '',
                domain: senior.domain || '',
                description: senior.description || '',
                profilePicture: senior.profilePicture || '',
                socialMediaLinks: Array.isArray(senior.socialMediaLinks)
                    ? senior.socialMediaLinks.filter(
                          (link) =>
                              link &&
                              typeof link === 'object' &&
                              typeof link.platform === 'string' &&
                              typeof link.url === 'string',
                      )
                    : [],
                submissionStatus: senior.submissionStatus || 'pending',
                rejectionReason: senior.rejectionReason || '',
                slug: senior.slug || '',
            });
            setErrors({});

            if (
                courseId &&
                branchId &&
                typeof branchId === 'string' &&
                senior.branch?.branchName
            ) {
                const currentBranchOption = {
                    value: branchId,
                    label: `${senior.branch.branchName} (${
                        senior.branch?.course?.courseName || 'N/A'
                    })`,
                };
                setBranches([currentBranchOption]);
                fetchBranches(courseId);
            } else if (courseId) {
                fetchBranches(courseId);
            }
        }
    }, [senior, isOpen, fetchBranches]);

    useEffect(() => {
        if (isOpen) {
            fetchCourses();
        }
    }, [isOpen, fetchCourses]);

    useEffect(() => {
        if (formData.course && !senior) {
            fetchBranches(formData.course);
        }
    }, [formData.course, fetchBranches, senior]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.year.trim()) {
            newErrors.year = 'Year is required';
        }

        if (!formData.course) {
            newErrors.course = 'Course is required';
        }

        if (!formData.branch) {
            newErrors.branch = 'Branch is required';
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

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

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }

        if (name === 'course') {
            setFormData((prev) => ({ ...prev, branch: '' }));
        }
    };

    const addSocialMediaLink = () => {
        setFormData((prev) => ({
            ...prev,
            socialMediaLinks: [
                ...prev.socialMediaLinks,
                { platform: 'linkedin', url: '' },
            ],
        }));
    };

    const removeSocialMediaLink = (index) => {
        setFormData((prev) => ({
            ...prev,
            socialMediaLinks: prev.socialMediaLinks.filter(
                (_, i) => i !== index,
            ),
        }));
    };

    const updateSocialMediaLink = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            socialMediaLinks: prev.socialMediaLinks.map((link, i) =>
                i === index ? { ...link, [field]: value } : link,
            ),
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
            const updatedSenior = {
                name: formData.name.trim(),
                branch: formData.branch,
                year: formData.year.trim(),
                domain: formData.domain.trim() || undefined,
                description: formData.description.trim() || undefined,
                profilePicture: formData.profilePicture.trim() || undefined,
                socialMediaLinks: formData.socialMediaLinks.filter((link) =>
                    link.url.trim(),
                ),
                submissionStatus: formData.submissionStatus,
                rejectionReason: formData.rejectionReason.trim() || undefined,
                slug: formData.slug.trim() || undefined,
            };

            Object.keys(updatedSenior).forEach(
                (key) =>
                    updatedSenior[key] === undefined &&
                    delete updatedSenior[key],
            );

            await api.put(`/senior/edit/${senior._id}`, updatedSenior);
            toast.success('Senior profile updated successfully!');
            onSuccess && onSuccess(updatedSenior);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Failed to update senior profile',
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
                                Edit Senior Profile
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {senior?.owner?.username || 'Senior'}
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
                            {/* Status and Slug */}
                            <div className='grid grid-cols-2 gap-4'>
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

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        URL Slug
                                    </label>
                                    <input
                                        type='text'
                                        name='slug'
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='john-doe-cse-2024'
                                    />
                                </div>
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
                                        placeholder='Provide rejection reason...'
                                    />
                                    {errors.rejectionReason && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Name and Year */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Full Name <span className='text-red-500'>*</span>
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
                                        placeholder='Enter full name...'
                                    />
                                    {errors.name && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Year <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='year'
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white ${
                                            errors.year
                                                ? 'border-red-300'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder='e.g., 2024'
                                    />
                                    {errors.year && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.year}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Course and Branch */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Course <span className='text-red-500'>*</span>
                                    </label>
                                    <SearchableSelect
                                        options={courses}
                                        value={formData.course}
                                        onChange={(value) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                course:
                                                    typeof value === 'string'
                                                        ? value
                                                        : '',
                                                branch: '',
                                            }));
                                            if (value) {
                                                fetchBranches(value);
                                            }
                                        }}
                                        placeholder='Select course...'
                                        loading={loadingCourses}
                                        errorState={!!errors.course}
                                    />
                                    {errors.course && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.course}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Branch <span className='text-red-500'>*</span>
                                    </label>
                                    <SearchableSelect
                                        options={branches}
                                        value={formData.branch}
                                        onChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                branch:
                                                    typeof value === 'string'
                                                        ? value
                                                        : '',
                                            }))
                                        }
                                        placeholder='Select branch...'
                                        loading={loadingBranches}
                                        errorState={!!errors.branch}
                                        disabled={!formData.course}
                                    />
                                    {errors.branch && (
                                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                                            <AlertTriangle className='h-3 w-3' />
                                            {errors.branch}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Domain and Profile Picture */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Domain
                                    </label>
                                    <input
                                        type='text'
                                        name='domain'
                                        value={formData.domain}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='e.g., Web Development'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Profile Picture URL
                                    </label>
                                    <input
                                        type='url'
                                        name='profilePicture'
                                        value={formData.profilePicture}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                        placeholder='https://...'
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Description
                                </label>
                                <textarea
                                    name='description'
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none border-gray-300 dark:border-gray-600'
                                    placeholder='Tell us about yourself...'
                                />
                            </div>

                            {/* Social Media Links */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                        Social Media Links
                                    </label>
                                    <button
                                        type='button'
                                        onClick={addSocialMediaLink}
                                        className='text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1'
                                    >
                                        <Plus className='h-4 w-4' />
                                        Add Link
                                    </button>
                                </div>
                                <div className='space-y-2'>
                                    {formData.socialMediaLinks.map((link, index) => (
                                        <div key={index} className='flex gap-2'>
                                            <select
                                                value={link.platform}
                                                onChange={(e) =>
                                                    updateSocialMediaLink(
                                                        index,
                                                        'platform',
                                                        e.target.value,
                                                    )
                                                }
                                                className='px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                            >
                                                <option value='whatsapp'>WhatsApp</option>
                                                <option value='linkedin'>LinkedIn</option>
                                                <option value='github'>GitHub</option>
                                                <option value='twitter'>Twitter</option>
                                                <option value='instagram'>Instagram</option>
                                                <option value='telegram'>Telegram</option>
                                                <option value='other'>Other</option>
                                            </select>
                                            <input
                                                type='text'
                                                value={link.url}
                                                onChange={(e) =>
                                                    updateSocialMediaLink(
                                                        index,
                                                        'url',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='https://...'
                                                className='flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600'
                                            />
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    removeSocialMediaLink(index)
                                                }
                                                className='p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg'
                                            >
                                                <Trash2 className='h-4 w-4' />
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
                                    'Update Profile'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SeniorEditModal;
