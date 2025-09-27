import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText, Building, GraduationCap } from 'lucide-react';
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

    // Update local branches when hook branches change
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

            // If we have both course and branch, ensure the current branch is in the options
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

                // Then fetch all branches for the course
                fetchBranches(courseId);
            } else if (courseId) {
                // If we only have course ID, fetch branches immediately
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
            // Only fetch branches on course change for new entries
            // For existing entries, branches are fetched in the first useEffect
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
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

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
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto'>
                <div className='flex-shrink-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                            <div className='flex-shrink-0'>
                                <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                                    <User className='w-5 h-5 text-white' />
                                </div>
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-white'>
                                    Edit Senior Profile
                                </h3>
                                <p className='text-sm text-purple-100'>
                                    Update senior student information
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
                    className='flex-1 flex flex-col overflow-auto'
                >
                    <div className='flex-1 overflow-y-auto p-6 space-y-6'>
                        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <User className='h-5 w-5 text-purple-500' />
                                Basic Information
                            </h3>

                            <div className='grid md:grid-cols-2 gap-6'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Full Name{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
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
                                        placeholder='Enter full name...'
                                    />
                                    {errors.name && (
                                        <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Year{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='year'
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                            errors.year
                                                ? 'border-red-300 dark:border-red-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder='e.g., 2024, Final Year, etc.'
                                    />
                                    {errors.year && (
                                        <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                                            {errors.year}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Course{' '}
                                        <span className='text-red-500'>*</span>
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
                                                branch: '', // Reset branch when course changes
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
                                        <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                                            {errors.course}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Branch{' '}
                                        <span className='text-red-500'>*</span>
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
                                        <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                                            {errors.branch}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Domain
                                    </label>
                                    <input
                                        type='text'
                                        name='domain'
                                        value={formData.domain}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        placeholder='e.g., Web Development, Data Science, etc.'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Profile Picture URL
                                    </label>
                                    <input
                                        type='url'
                                        name='profilePicture'
                                        value={formData.profilePicture}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        placeholder='https://example.com/profile.jpg'
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <FileText className='h-5 w-5 text-green-500' />
                                Description
                            </h3>
                            <div>
                                <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                    Description
                                </label>
                                <textarea
                                    name='description'
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    placeholder='Tell us about yourself...'
                                />
                            </div>
                        </div>

                        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                            {senior.whatsapp && (
                                <div>
                                    For Temporary Add it below - whatsapp:-
                                    {senior.whatsapp}
                                </div>
                            )}
                            {senior.telegram && (
                                <div>
                                    For Temporary Add it below - telegram:-
                                    {senior.telegram}
                                </div>
                            )}
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                                    <Building className='h-5 w-5 text-blue-500' />
                                    Social Media Links
                                </h3>
                                <button
                                    type='button'
                                    onClick={addSocialMediaLink}
                                    className='px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                                >
                                    Add Link
                                </button>
                            </div>
                            {formData.socialMediaLinks.map((link, index) => (
                                <div key={index} className='flex gap-3 mb-3'>
                                    <select
                                        value={link.platform}
                                        onChange={(e) =>
                                            updateSocialMediaLink(
                                                index,
                                                'platform',
                                                e.target.value,
                                            )
                                        }
                                        className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    >
                                        <option value='whatsapp'>
                                            WhatsApp
                                        </option>
                                        <option value='linkedin'>
                                            LinkedIn
                                        </option>
                                        <option value='github'>GitHub</option>
                                        <option value='twitter'>Twitter</option>
                                        <option value='instagram'>
                                            Instagram
                                        </option>
                                        <option value='facebook'>
                                            Facebook
                                        </option>
                                        <option value='youtube'>YouTube</option>
                                        <option value='telegram'>
                                            Telegram
                                        </option>
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
                                        className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            removeSocialMediaLink(index)
                                        }
                                        className='px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                <GraduationCap className='h-5 w-5 text-blue-500' />
                                Status Management
                            </h3>

                            <div className='grid md:grid-cols-2 gap-6'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Submission Status
                                    </label>
                                    <select
                                        name='submissionStatus'
                                        value={formData.submissionStatus}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    >
                                        <option value='pending'>Pending</option>
                                        <option value='approved'>
                                            Approved
                                        </option>
                                        <option value='rejected'>
                                            Rejected
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Slug
                                    </label>
                                    <input
                                        type='text'
                                        name='slug'
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        placeholder='e.g., john-doe-cse-2024'
                                    />
                                </div>
                            </div>

                            {formData.submissionStatus === 'rejected' && (
                                <div className='mt-6'>
                                    <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                                        Rejection Reason{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <textarea
                                        name='rejectionReason'
                                        value={formData.rejectionReason}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                                            errors.rejectionReason
                                                ? 'border-red-300 dark:border-red-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder='Please provide a reason for rejection...'
                                    />
                                    {errors.rejectionReason && (
                                        <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                                            {errors.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {senior && (
                            <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                                    <User className='h-5 w-5 text-purple-500' />
                                    Profile Information
                                </h3>
                                <div className='grid md:grid-cols-2 gap-6'>
                                    <div className='space-y-2'>
                                        <label className='text-gray-500 dark:text-gray-400'>
                                            Profile ID
                                        </label>
                                        <div className='text-gray-900 dark:text-gray-100 font-mono text-sm'>
                                            {senior._id}
                                        </div>
                                    </div>
                                    <div className='space-y-2'>
                                        <label className='text-gray-500 dark:text-gray-400'>
                                            Created By
                                        </label>
                                        <div className='flex items-center space-x-2'>
                                            <User className='h-4 w-4 text-gray-400' />
                                            <span className='text-gray-900 dark:text-gray-100'>
                                                {senior.owner?.username ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4'>
                        <div className='flex items-center justify-between'>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                Last updated:{' '}
                                {senior &&
                                    new Date(
                                        senior.updatedAt || senior.createdAt,
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
                                    className='px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className='h-4 w-4' />
                                            Update Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeniorEditModal;
