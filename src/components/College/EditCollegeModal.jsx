import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Dialog } from '../ui';

const DEFAULT_SECTIONS = {
    pyqs: true,
    notes: true,
    videos: true,
    syllabus: true,
    store: false,
    seniors: false,
    resources: true,
    groups: false,
    opportunities: false,
    lostFound: false,
};

const ALL_SECTIONS_ENABLED = {
    pyqs: true,
    notes: true,
    videos: true,
    syllabus: true,
    store: true,
    seniors: true,
    resources: true,
    groups: true,
    opportunities: true,
    lostFound: true,
    quickNotes: true,
};

const SECTION_OPTIONS = [
    { key: 'pyqs', label: 'PYQs' },
    { key: 'notes', label: 'Notes' },
    { key: 'videos', label: 'Videos' },
    { key: 'syllabus', label: 'Syllabus' },
    { key: 'quickNotes', label: 'Quick notes' },
    { key: 'store', label: 'Store' },
    { key: 'seniors', label: 'Seniors' },
    { key: 'resources', label: 'Resources' },
    { key: 'groups', label: 'Groups' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'lostFound', label: 'Lost & found' },
];

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
        sections: DEFAULT_SECTIONS,
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
                sections: college.sections
                    ? {
                          ...ALL_SECTIONS_ENABLED,
                          ...college.sections,
                      }
                    : ALL_SECTIONS_ENABLED,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                location: '',
                slug: '',
                status: true,
                sections: DEFAULT_SECTIONS,
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
            // Only a new college gets its slug from the name. Renaming an
            // existing one must not quietly change its public URL.
            slug: college ? prev.slug : generateSlug(name),
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

    const handleSectionToggle = (sectionKey) => {
        setFormData((prev) => ({
            ...prev,
            sections: {
                ...prev.sections,
                [sectionKey]: !prev.sections?.[sectionKey],
            },
        }));
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

    const disabled = loading || readOnly;
    const inputClass = (hasError) =>
        `w-full px-3 py-2 rounded-lg border bg-sheet text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-sunken disabled:text-ink-2 ${
            hasError ? 'border-bad' : 'border-line-strong'
        }`;
    const fieldError = (key) =>
        errors[key] && (
            <p id={`${key}-error`} className='text-[12.5px] text-bad-ink'>
                {errors[key]}
            </p>
        );

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={loading}
            size='md'
            title={readOnly ? 'College details' : 'Edit college'}
            description={
                readOnly
                    ? undefined
                    : 'Changes show on the student site straight away.'
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        {readOnly ? 'Close' : 'Cancel'}
                    </Button>
                    {!readOnly && (
                        <Button
                            type='submit'
                            form='edit-college-form'
                            variant='primary'
                            disabled={loading}
                        >
                            {loading && (
                                <Loader2
                                    className='w-4 h-4 animate-spin'
                                    aria-hidden='true'
                                />
                            )}
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                    )}
                </>
            }
        >
            <form
                id='edit-college-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <div className='flex flex-col gap-1.5'>
                    <label
                        htmlFor='college-name'
                        className='text-[13px] font-medium text-ink'
                    >
                        Name
                    </label>
                    <input
                        id='college-name'
                        name='name'
                        type='text'
                        value={formData.name}
                        onChange={handleNameChange}
                        placeholder='Integral University'
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                            errors.name ? 'name-error' : undefined
                        }
                        className={inputClass(errors.name)}
                        disabled={disabled}
                    />
                    {fieldError('name')}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='flex flex-col gap-1.5'>
                        <label
                            htmlFor='college-location'
                            className='text-[13px] font-medium text-ink'
                        >
                            Location
                        </label>
                        <input
                            id='college-location'
                            name='location'
                            type='text'
                            value={formData.location}
                            onChange={handleChange}
                            placeholder='Lucknow, Uttar Pradesh'
                            aria-invalid={Boolean(errors.location)}
                            aria-describedby={
                                errors.location ? 'location-error' : undefined
                            }
                            className={inputClass(errors.location)}
                            disabled={disabled}
                        />
                        {fieldError('location')}
                    </div>
                    <div className='flex flex-col gap-1.5'>
                        <label
                            htmlFor='college-slug'
                            className='text-[13px] font-medium text-ink'
                        >
                            Slug
                        </label>
                        <input
                            id='college-slug'
                            name='slug'
                            type='text'
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder='integral-university'
                            aria-invalid={Boolean(errors.slug)}
                            aria-describedby={
                                errors.slug ? 'slug-error' : 'slug-hint'
                            }
                            className={`${inputClass(errors.slug)} font-mono text-[13px]`}
                            disabled={disabled}
                        />
                        {fieldError('slug') || (
                            <p
                                id='slug-hint'
                                className='text-[12.5px] text-muted'
                            >
                                studentsenior.com/{formData.slug || 'slug'}
                                {college && ' · changing it breaks old links'}
                            </p>
                        )}
                    </div>
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label
                        htmlFor='college-description'
                        className='text-[13px] font-medium text-ink'
                    >
                        Description
                    </label>
                    <textarea
                        id='college-description'
                        name='description'
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder='A line or two students see on the college page'
                        aria-invalid={Boolean(errors.description)}
                        aria-describedby={
                            errors.description ? 'description-error' : undefined
                        }
                        className={`${inputClass(errors.description)} resize-none`}
                        disabled={disabled}
                    />
                    {fieldError('description')}
                </div>

                <label className='flex items-start gap-3 p-3 rounded-lg border border-line'>
                    <input
                        type='checkbox'
                        name='status'
                        checked={formData.status}
                        onChange={handleChange}
                        className='mt-0.5 w-4 h-4 accent-brand'
                        disabled={disabled}
                    />
                    <span className='flex flex-col gap-0.5'>
                        <span className='text-[13.5px] font-medium text-ink'>
                            Active
                        </span>
                        <span className='text-[12.5px] text-muted'>
                            Inactive colleges are hidden from students.
                        </span>
                    </span>
                </label>

                <fieldset className='flex flex-col gap-2'>
                    <legend className='text-[13px] font-medium text-ink mb-2'>
                        Sections students can see
                    </legend>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                        {SECTION_OPTIONS.map((section) => (
                            <label
                                key={section.key}
                                className='flex items-center gap-2 h-9 px-2.5 rounded-lg border border-line text-[13px] text-ink-2 has-[:checked]:border-brand/40 has-[:checked]:bg-brand-soft has-[:checked]:text-brand-ink'
                            >
                                <input
                                    type='checkbox'
                                    checked={
                                        formData.sections?.[section.key] ||
                                        false
                                    }
                                    onChange={() =>
                                        handleSectionToggle(section.key)
                                    }
                                    className='w-4 h-4 accent-brand'
                                    disabled={disabled}
                                />
                                {section.label}
                            </label>
                        ))}
                    </div>
                </fieldset>
            </form>
        </Dialog>
    );
};

export default EditCollegeModal;
