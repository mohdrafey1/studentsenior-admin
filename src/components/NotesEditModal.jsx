import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea } from './ui';
import { formatINR, pointsToRupees } from '../utils/format';

const NotesEditModal = ({ isOpen, onClose, note, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        submissionStatus: 'pending',
        slug: '',
        isPaid: false,
        price: 0,
        rejectionReason: '',
        isDownloadable: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (note && isOpen) {
            setFormData({
                title: note.title || '',
                description: note.description || '',
                submissionStatus: note.submissionStatus || 'pending',
                slug: note.slug || '',
                isPaid: note.isPaid || false,
                price: note.price || 0,
                rejectionReason: note.rejectionReason || '',
                isDownloadable: note.isDownloadable ?? true,
            });
            setErrors({});
        }
    }, [note, isOpen]);

    const validateForm = () => {
        const newErrors = {};
        const title = formData.title?.trim() || '';
        const description = formData.description?.trim() || '';

        if (!title) {
            newErrors.title = 'Enter a title';
        } else if (title.length < 3) {
            newErrors.title = 'Use at least 3 characters';
        } else if (title.length > 100) {
            newErrors.title = 'Keep it under 100 characters';
        }

        if (!description) {
            newErrors.description = 'Enter a description';
        } else if (description.length < 10) {
            newErrors.description = 'Use at least 10 characters';
        } else if (description.length > 500) {
            newErrors.description = 'Keep it under 500 characters';
        }

        if (
            formData.slug.trim() &&
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())
        ) {
            newErrors.slug =
                'Only lowercase letters, numbers and single hyphens';
        }

        if (formData.isPaid) {
            const price = Number(formData.price);
            if (!formData.price || isNaN(price) || price <= 0) {
                newErrors.price = 'Enter a price of at least 1 point';
            } else if (price > 1000) {
                newErrors.price = 'Price can’t be more than 1,000 points';
            }
        }

        if (formData.submissionStatus === 'rejected') {
            const reason = formData.rejectionReason?.trim() || '';
            if (!reason) {
                newErrors.rejectionReason =
                    'Add a reason so the uploader knows what to fix';
            } else if (reason.length < 10) {
                newErrors.rejectionReason = 'Use at least 10 characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            };

            // Rejected notes keep a "-rejected" slug so the link is freed up.
            if (name === 'submissionStatus') {
                const baseSlug = (prev.slug || '').replace(/-rejected$/, '');
                newData.slug =
                    value === 'rejected' ? `${baseSlug}-rejected` : baseSlug;
            }

            // Free notes have no price.
            if (name === 'isPaid' && !checked) newData.price = 0;

            return newData;
        });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Check the highlighted fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                submissionStatus: formData.submissionStatus,
                slug: formData.slug.trim() || undefined,
                isPaid: formData.isPaid,
                price: formData.isPaid ? Number(formData.price) : 0,
                rejectionReason:
                    formData.submissionStatus === 'rejected'
                        ? formData.rejectionReason.trim()
                        : undefined,
                isDownloadable: formData.isDownloadable,
            };

            const response = await api.put(
                `/notes/edit/${note._id}`,
                updateData,
            );

            if (response.data.success) {
                toast.success('Note saved');
                onClose();
                onSuccess?.(response.data.data.updatedNotes);
            }
        } catch (error) {
            console.error('Error updating note:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the note. Try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const price = Number(formData.price);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={isSubmitting}
            title='Edit note'
            description={note?.subject?.subjectName}
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='note-edit-form'
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
                id='note-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Title' required error={errors.title}>
                    <Input
                        name='title'
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder='Operating Systems — Unit 3 notes'
                        maxLength={100}
                    />
                </Field>

                <Field
                    label='Description'
                    required
                    error={errors.description}
                    hint={`${formData.description.trim().length}/500 characters`}
                >
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder='What the notes cover'
                    />
                </Field>

                <Field
                    label='Slug'
                    error={errors.slug}
                    hint='Lowercase letters, numbers and hyphens. Part of the note’s link.'
                >
                    <Input
                        name='slug'
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder='operating-systems-unit-3-notes'
                        className='font-mono text-[13px]'
                    />
                </Field>

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

                {formData.submissionStatus === 'rejected' && (
                    <Field
                        label='Reason for the uploader'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder='What should the uploader fix?'
                        />
                    </Field>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <Checkbox
                        bordered
                        name='isPaid'
                        checked={formData.isPaid}
                        onChange={handleInputChange}
                        label='Paid note'
                        description='Students unlock it with points.'
                    />
                    <Checkbox
                        bordered
                        name='isDownloadable'
                        checked={formData.isDownloadable}
                        onChange={handleInputChange}
                        label='Allow download'
                        description='Otherwise students can only view it.'
                    />
                </div>

                {formData.isPaid && (
                    <Field
                        label='Price in points'
                        required
                        error={errors.price}
                        hint={
                            price > 0
                                ? `Students pay ${formatINR(pointsToRupees(price))} (5 points = ₹1).`
                                : '5 points = ₹1.'
                        }
                    >
                        <Input
                            type='number'
                            name='price'
                            min='1'
                            max='1000'
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder='50'
                            className='font-mono'
                        />
                    </Field>
                )}
            </form>
        </Dialog>
    );
};

export default NotesEditModal;
