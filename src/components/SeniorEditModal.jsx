import React, { useState, useEffect, useId } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';
import { useResources } from '../hooks/useResources';
import { Button, Dialog, Field, Input, Select, Textarea } from './ui';

// Every platform the Senior model accepts.
const PLATFORM_OPTIONS = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'other', label: 'Other' },
];

// Label and error around a SearchableSelect, which renders its own control
// and can't take the id that Field would give it.
const PickerField = ({ label, error, children }) => {
    const labelId = useId();
    return (
        <div
            role='group'
            aria-labelledby={labelId}
            className='flex flex-col gap-1.5'
        >
            <span id={labelId} className='text-[13px] font-medium text-ink'>
                {label}
                <span className='text-bad-ink' aria-hidden='true'>
                    {' '}
                    *
                </span>
            </span>
            {children}
            {error && <p className='text-[12.5px] text-bad-ink'>{error}</p>}
        </div>
    );
};

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
    const linksLabelId = useId();
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
            newErrors.name = 'Enter a name';
        }

        if (!formData.year.trim()) {
            newErrors.year = 'Enter a year';
        }

        if (!formData.course) {
            newErrors.course = 'Choose a course';
        }

        if (!formData.branch) {
            newErrors.branch = 'Choose a branch';
        }

        if (formData.submissionStatus === 'rejected') {
            if (!formData.rejectionReason.trim()) {
                newErrors.rejectionReason = 'Add a reason for the senior';
            } else if (formData.rejectionReason.trim().length < 10) {
                // The API refuses shorter reasons for seniors.
                newErrors.rejectionReason = 'Use at least 10 characters';
            }
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
            toast.error('Check the highlighted fields');
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
            toast.success('Senior saved');
            onSuccess && onSuccess(updatedSenior);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the senior. Try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={isSubmitting}
            size='lg'
            title='Edit senior'
            description={
                senior?.owner?.username
                    ? `Submitted by @${senior.owner.username}`
                    : senior?.name
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='senior-edit-form'
                        variant='primary'
                        disabled={isSubmitting}
                        icon={isSubmitting ? Loader2 : undefined}
                        className={isSubmitting ? '[&>svg]:animate-spin' : ''}
                    >
                        {isSubmitting ? 'Saving…' : 'Save changes'}
                    </Button>
                </>
            }
        >
            <form
                id='senior-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Status' required>
                        <Select
                            name='submissionStatus'
                            value={formData.submissionStatus}
                            onChange={handleInputChange}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'approved', label: 'Approved' },
                                { value: 'rejected', label: 'Rejected' },
                            ]}
                        />
                    </Field>
                    <Field label='Slug'>
                        <Input
                            name='slug'
                            value={formData.slug}
                            onChange={handleInputChange}
                            placeholder='john-doe-cse-2024'
                            className='font-mono text-[13px]'
                        />
                    </Field>
                </div>

                {formData.submissionStatus === 'rejected' && (
                    <Field
                        label='Reason for the senior'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder='What should the senior fix?'
                        />
                    </Field>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Full name' required error={errors.name}>
                        <Input
                            name='name'
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder='Ayesha Khan'
                        />
                    </Field>
                    <Field label='Year' required error={errors.year}>
                        <Input
                            name='year'
                            value={formData.year}
                            onChange={handleInputChange}
                            placeholder='4th Year'
                        />
                    </Field>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <PickerField label='Course' error={errors.course}>
                        <SearchableSelect
                            options={courses}
                            value={formData.course}
                            onChange={(value) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    course:
                                        typeof value === 'string' ? value : '',
                                    branch: '',
                                }));
                                if (value) {
                                    fetchBranches(value);
                                }
                            }}
                            placeholder='Choose a course'
                            loading={loadingCourses}
                            errorState={!!errors.course}
                        />
                    </PickerField>
                    <PickerField label='Branch' error={errors.branch}>
                        <SearchableSelect
                            options={branches}
                            value={formData.branch}
                            onChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    branch:
                                        typeof value === 'string' ? value : '',
                                }))
                            }
                            placeholder='Choose a branch'
                            loading={loadingBranches}
                            errorState={!!errors.branch}
                            disabled={!formData.course}
                        />
                    </PickerField>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Domain'>
                        <Input
                            name='domain'
                            value={formData.domain}
                            onChange={handleInputChange}
                            placeholder='Web development'
                        />
                    </Field>
                    <Field label='Photo link'>
                        <Input
                            type='url'
                            name='profilePicture'
                            value={formData.profilePicture}
                            onChange={handleInputChange}
                            placeholder='https://…/photo.jpg'
                            className='font-mono text-[13px]'
                        />
                    </Field>
                </div>

                <Field label='About'>
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder='What they can help juniors with'
                    />
                </Field>

                <div
                    role='group'
                    aria-labelledby={linksLabelId}
                    className='flex flex-col gap-2'
                >
                    <div className='flex items-center justify-between gap-3'>
                        <span
                            id={linksLabelId}
                            className='text-[13px] font-medium text-ink'
                        >
                            Social links
                        </span>
                        <Button
                            size='sm'
                            variant='ghost'
                            icon={Plus}
                            onClick={addSocialMediaLink}
                        >
                            Add link
                        </Button>
                    </div>
                    {formData.socialMediaLinks.length === 0 ? (
                        <p className='text-[12.5px] text-muted'>
                            No links yet.
                        </p>
                    ) : (
                        formData.socialMediaLinks.map((link, index) => (
                            <div key={index} className='flex gap-2'>
                                <div className='w-32 sm:w-36 shrink-0'>
                                    <Select
                                        aria-label={`Platform for link ${index + 1}`}
                                        value={link.platform}
                                        onChange={(e) =>
                                            updateSocialMediaLink(
                                                index,
                                                'platform',
                                                e.target.value,
                                            )
                                        }
                                        options={PLATFORM_OPTIONS}
                                    />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <Input
                                        aria-label={`Address for link ${index + 1}`}
                                        value={link.url}
                                        onChange={(e) =>
                                            updateSocialMediaLink(
                                                index,
                                                'url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder='https://…'
                                        className='font-mono text-[13px]'
                                    />
                                </div>
                                <Button
                                    variant='ghost'
                                    iconOnly
                                    icon={Trash2}
                                    aria-label={`Remove link ${index + 1}`}
                                    className='text-bad-ink hover:text-bad-ink shrink-0'
                                    onClick={() => removeSocialMediaLink(index)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </form>
        </Dialog>
    );
};

export default SeniorEditModal;
