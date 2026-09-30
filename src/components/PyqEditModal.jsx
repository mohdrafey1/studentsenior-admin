import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea } from './ui';
import { formatINR, pointsToRupees } from '../utils/format';
import { EXAM_TYPES } from '../utils/labels';

const PyqEditModal = ({ isOpen, onClose, pyq, onUpdate }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        year: '',
        examType: '',
        submissionStatus: 'pending',
        rejectionReason: '',
        slug: '',
        price: 0,
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

    const examTypes = EXAM_TYPES;

    useEffect(() => {
        if (pyq && isOpen) {
            setFormData({
                year: pyq.year || '',
                examType: pyq.examType || '',
                submissionStatus: pyq.submissionStatus || 'pending',
                rejectionReason: pyq.rejectionReason || '',
                slug: pyq.slug || '',
                price: pyq.price || 0,
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
                newErrors.price = 'Enter a price in points';
            } else if (isNaN(price) || price <= 0) {
                newErrors.price = 'Price must be more than 0 points';
            } else if (price > 1000) {
                newErrors.price = 'Price can’t be more than 1,000 points';
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
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            };

            // Automatically manage slug suffix based on submission status
            if (name === 'submissionStatus') {
                const currentSlug = prev.slug || '';
                const baseSlug = currentSlug.replace(/-rejected$/, ''); // Remove existing -rejected suffix

                if (value === 'rejected') {
                    // Add -rejected suffix if not already present
                    newData.slug = baseSlug + '-rejected';
                } else {
                    // Remove -rejected suffix for approved/pending
                    newData.slug = baseSlug;
                }
            }

            return newData;
        });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }

        // Reset price when switching from paid to free
        if (name === 'isPaid' && !checked) {
            setFormData((prev) => ({ ...prev, price: 0 }));
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
            toast.success('PYQ saved');
            onUpdate && onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || 'Couldn’t save the PYQ',
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
            title='Edit PYQ'
            description={pyq?.subject?.subjectName}
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='pyq-edit-form'
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
                id='pyq-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Year' required error={errors.year}>
                        <Select
                            name='year'
                            value={formData.year}
                            onChange={handleInputChange}
                            placeholder='Choose a year'
                            options={[
                                ...academicYears.map((y) => ({
                                    value: y,
                                    label: y,
                                })),
                                // Keep an older value selectable.
                                ...(formData.year &&
                                !academicYears.includes(formData.year)
                                    ? [
                                          {
                                              value: formData.year,
                                              label: formData.year,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    </Field>
                    <Field label='Exam type' required error={errors.examType}>
                        <Select
                            name='examType'
                            value={formData.examType}
                            onChange={handleInputChange}
                            placeholder='Choose an exam type'
                            options={examTypes}
                        />
                    </Field>
                </div>

                <Field
                    label='Slug'
                    required
                    error={errors.slug}
                    hint='Lowercase letters, numbers and hyphens. Part of the paper’s link.'
                >
                    <Input
                        name='slug'
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder='data-structures-endsem-2024'
                        className='font-mono text-[13px]'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field
                        label='Status'
                        required
                        error={errors.submissionStatus}
                    >
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
                    <div className='flex items-end pb-1.5'>
                        <Checkbox
                            name='isPaid'
                            checked={formData.isPaid}
                            onChange={handleInputChange}
                            label='Paid PYQ'
                            description='Students unlock it with points.'
                        />
                    </div>
                </div>

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

                {formData.isPaid && (
                    <Field
                        label='Price in points'
                        required
                        error={errors.price}
                        hint={
                            Number(formData.price) > 0
                                ? `Students pay ${formatINR(pointsToRupees(formData.price))} (5 points = ₹1).`
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

export default PyqEditModal;
