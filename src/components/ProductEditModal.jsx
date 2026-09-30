import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea } from './ui';

const ProductEditModal = ({ isOpen, onClose, product, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        image: '',
        submissionStatus: 'pending',
        rejectionReason: '',
        slug: '',
        available: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                image: product.image || '',
                submissionStatus:
                    product.submissionStatus === true
                        ? 'approved'
                        : product.submissionStatus === false
                          ? 'pending'
                          : product.submissionStatus || 'pending',
                rejectionReason: product.rejectionReason || '',
                slug: product.slug || '',
                available:
                    product.available !== undefined ? product.available : true,
            });
            setErrors({});
        }
    }, [product, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Enter a name';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Use at least 2 characters';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Keep the name under 200 characters';
        }

        if (!formData.description?.trim()) {
            newErrors.description = 'Enter a description';
        } else if (formData.description.trim().length > 1000) {
            newErrors.description =
                'Keep the description under 1,000 characters';
        }

        if (formData.price < 0) {
            newErrors.price = 'Price can’t be negative';
        } else if (formData.price > 100000) {
            newErrors.price = 'Price can’t be more than ₹1,00,000';
        }

        if (formData.slug && formData.slug.trim()) {
            const slugPattern = /^[a-z0-9-]+$/;
            if (!slugPattern.test(formData.slug.trim())) {
                newErrors.slug =
                    'Use only lowercase letters, numbers and hyphens';
            }
        }

        if (formData.image && formData.image.trim()) {
            try {
                new URL(formData.image);
            } catch {
                newErrors.image = 'Enter a full image link, starting https://';
            }
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason?.trim()
        ) {
            newErrors.rejectionReason = 'Add a reason for the seller';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]:
                    type === 'checkbox'
                        ? checked
                        : type === 'number'
                          ? Number(value)
                          : value,
            };

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
            toast.error('Check the highlighted fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                image: formData.image.trim() || undefined,
                submissionStatus: formData.submissionStatus,
                rejectionReason:
                    formData.submissionStatus === 'rejected'
                        ? formData.rejectionReason.trim()
                        : undefined,
                slug: formData.slug.trim() || undefined,
                available: formData.available,
            };

            await api.put(`/store/edit/${product._id}`, updateData);
            toast.success('Listing saved');
            onClose();
            onSuccess && onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the listing. Try again.',
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
            title='Edit listing'
            description={
                product?.owner?.username
                    ? `Listed by @${product.owner.username}`
                    : undefined
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='product-edit-form'
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
                id='product-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
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
                        label='Reason for the seller'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder='What should the seller fix?'
                        />
                    </Field>
                )}

                <Field label='Name' required error={errors.name}>
                    <Input
                        name='name'
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder='Casio fx-82MS scientific calculator'
                    />
                </Field>

                <Field label='Description' required error={errors.description}>
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder='Condition, what’s included and where to pick it up'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field
                        label='Price in rupees'
                        required
                        error={errors.price}
                        hint='In rupees, not points.'
                    >
                        <Input
                            type='number'
                            name='price'
                            value={formData.price}
                            onChange={handleInputChange}
                            min='0'
                            max='100000'
                            placeholder='0'
                            className='font-mono'
                        />
                    </Field>
                    <Field label='Slug' error={errors.slug}>
                        <Input
                            name='slug'
                            value={formData.slug}
                            onChange={handleInputChange}
                            placeholder='casio-fx-82ms-calculator'
                            className='font-mono text-[13px]'
                        />
                    </Field>
                </div>

                <Field label='Photo link' error={errors.image}>
                    <Input
                        type='url'
                        name='image'
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder='https://…/photo.jpg'
                        className='font-mono text-[13px]'
                    />
                </Field>

                <Checkbox
                    name='available'
                    checked={formData.available}
                    onChange={handleInputChange}
                    label='Available'
                    description='Turn off when it has been sold.'
                    bordered
                />
            </form>
        </Dialog>
    );
};

export default ProductEditModal;
