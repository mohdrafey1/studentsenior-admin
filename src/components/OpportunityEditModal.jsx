import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import { Button, Dialog, Field, Input, Select, Textarea } from './ui';

const EMPTY_FORM = {
    name: '',
    description: '',
    email: '',
    whatsapp: '',
    link: '',
    submissionStatus: 'pending',
    rejectionReason: '',
};

const isValidUrl = (value) => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

const OpportunityEditModal = ({ isOpen, onClose, opportunity, onSuccess }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(
            opportunity
                ? {
                      name: opportunity.name || '',
                      description: opportunity.description || '',
                      email: opportunity.email || '',
                      whatsapp: opportunity.whatsapp || '',
                      link: opportunity.link || '',
                      submissionStatus:
                          opportunity.submissionStatus || 'pending',
                      rejectionReason: opportunity.rejectionReason || '',
                  }
                : EMPTY_FORM,
        );
        setErrors({});
    }, [opportunity]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const next = {};
        if (!formData.name.trim()) next.name = 'Add a title';
        if (!formData.description.trim())
            next.description = 'Add a description';
        if (!formData.email.trim()) {
            next.email = 'Add a contact email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            next.email = 'Enter an email like name@example.com';
        }
        if (formData.link && !isValidUrl(formData.link)) {
            next.link = 'Enter a full link, starting with https://';
        }
        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason.trim()
        ) {
            next.rejectionReason =
                'Add a reason so the poster knows what to fix';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Check the highlighted fields');
            return;
        }

        setLoading(true);
        try {
            if (opportunity) {
                await api.put(`/opportunity/edit/${opportunity._id}`, formData);
                toast.success('Opportunity saved');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving opportunity:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the opportunity. Try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={loading}
            title='Edit opportunity'
            description={opportunity?.name}
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='opportunity-edit-form'
                        variant='primary'
                        disabled={loading}
                        icon={loading ? Loader2 : undefined}
                        className={loading ? '[&>svg]:animate-spin' : ''}
                    >
                        {loading ? 'Saving…' : 'Save changes'}
                    </Button>
                </>
            }
        >
            <form
                id='opportunity-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Title' required error={errors.name}>
                    <Input
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Software engineering internship'
                    />
                </Field>

                <Field label='Description' required error={errors.description}>
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder='What the role is, who can apply and what they get'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Email' required error={errors.email}>
                        <Input
                            type='email'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                            placeholder='careers@company.com'
                        />
                    </Field>
                    <Field label='WhatsApp' hint='10-digit number'>
                        <Input
                            type='tel'
                            name='whatsapp'
                            value={formData.whatsapp}
                            onChange={handleChange}
                            placeholder='9876543210'
                            className='font-mono'
                        />
                    </Field>
                </div>

                <Field label='Application link' error={errors.link}>
                    <Input
                        type='url'
                        name='link'
                        value={formData.link}
                        onChange={handleChange}
                        placeholder='https://company.com/apply'
                        className='font-mono text-[13px]'
                    />
                </Field>

                <Field label='Status' required>
                    <Select
                        name='submissionStatus'
                        value={formData.submissionStatus}
                        onChange={handleChange}
                        options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'approved', label: 'Approved' },
                            { value: 'rejected', label: 'Rejected' },
                        ]}
                    />
                </Field>

                {formData.submissionStatus === 'rejected' && (
                    <Field
                        label='Reason for the poster'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleChange}
                            rows={3}
                            placeholder='What should the poster fix?'
                        />
                    </Field>
                )}
            </form>
        </Dialog>
    );
};

export default OpportunityEditModal;
