import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button, Dialog, Field, Input, Select, Textarea } from './ui';

// Invite links, optionally with the query string WhatsApp now appends
// (e.g. "?mode=ems_copy_t").
const isValidWhatsAppLink = (url) =>
    /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+(\?\S*)?$/.test(url);

const GroupEditModal = ({ isOpen, onClose, group, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        info: '',
        link: '',
        domain: '',
        submissionStatus: 'pending',
        rejectionReason: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (group && isOpen) {
            setFormData({
                title: group.title || '',
                info: group.info || '',
                link: group.link || '',
                domain: group.domain || '',
                submissionStatus: group.submissionStatus || 'pending',
                rejectionReason: group.rejectionReason || '',
            });
            setErrors({});
        }
    }, [group, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Enter a group name';
        }

        if (!formData.info.trim()) {
            newErrors.info = 'Enter a description';
        }

        if (!formData.link.trim()) {
            // The API requires a link.
            newErrors.link = 'Enter the invite link';
        } else if (!isValidWhatsAppLink(formData.link.trim())) {
            newErrors.link =
                'Use a WhatsApp invite link, like https://chat.whatsapp.com/AbC123';
        }

        if (!formData.domain.trim()) {
            newErrors.domain = 'Enter a domain';
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason.trim()
        ) {
            newErrors.rejectionReason = 'Add a reason for the student';
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
            const updatedGroup = {
                title: formData.title.trim(),
                info: formData.info.trim(),
                link: formData.link.trim(),
                domain: formData.domain.trim(),
                submissionStatus: formData.submissionStatus,
                rejectionReason: formData.rejectionReason.trim() || undefined,
            };

            await api.put(`/group/edit/${group._id}`, updatedGroup);
            toast.success('Group saved');
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the group. Try again.',
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
            title='Edit WhatsApp group'
            description={group?.college?.collegeName || group?.title}
            footer={
                <>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='group-edit-form'
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
                id='group-edit-form'
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
                        label='Reason for the student'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder='What should the student fix?'
                        />
                    </Field>
                )}

                <Field label='Group name' required error={errors.title}>
                    <Input
                        name='title'
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder='B.Tech CSE 2nd year'
                    />
                </Field>

                <Field label='Description' required error={errors.info}>
                    <Textarea
                        name='info'
                        value={formData.info}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder='What the group is for'
                    />
                </Field>

                <Field label='Invite link' required error={errors.link}>
                    <Input
                        type='url'
                        name='link'
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder='https://chat.whatsapp.com/…'
                        className='font-mono text-[13px]'
                    />
                </Field>

                <Field label='Domain' required error={errors.domain}>
                    <Input
                        name='domain'
                        value={formData.domain}
                        onChange={handleInputChange}
                        placeholder='Placements, CSE, General'
                    />
                </Field>
            </form>
        </Dialog>
    );
};

export default GroupEditModal;
