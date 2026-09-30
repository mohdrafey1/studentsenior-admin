import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import { Button, Dialog, Field, Input, Select, Textarea } from './ui';

// yyyy-mm-dd in the admin's own timezone; toISOString would give the UTC
// day, which is the previous day for dates saved at IST midnight.
const localDateInput = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const blankForm = () => ({
    title: '',
    description: '',
    type: 'lost',
    location: '',
    date: localDateInput(new Date()),
    currentStatus: 'open',
    imageUrl: '',
    whatsapp: '',
    submissionStatus: 'pending',
    rejectionReason: '',
});

const LostFoundEditModal = ({ isOpen, onClose, item, onSuccess }) => {
    const [formData, setFormData] = useState(blankForm);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(
            item
                ? {
                      title: item.title || '',
                      description: item.description || '',
                      type: item.type || 'lost',
                      location: item.location || '',
                      date: item.date
                          ? localDateInput(new Date(item.date))
                          : '',
                      currentStatus: item.currentStatus || 'open',
                      imageUrl: item.imageUrl || '',
                      whatsapp: item.whatsapp || '',
                      submissionStatus: item.submissionStatus || 'pending',
                      rejectionReason: item.rejectionReason || '',
                  }
                : blankForm(),
        );
        setErrors({});
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const next = {};
        if (!formData.title.trim()) next.title = 'Add a title';
        if (!formData.description.trim())
            next.description = 'Add a description';
        if (!formData.location.trim()) next.location = 'Add where it happened';
        if (!formData.date) next.date = 'Pick a date';
        if (!formData.whatsapp.trim()) next.whatsapp = 'Add a WhatsApp number';
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
            if (item) {
                await api.put(`/lostandfound/edit/${item._id}`, formData);
                toast.success('Item saved');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving item:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the item. Try again.',
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
            title='Edit lost & found item'
            description={item?.title}
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='lostfound-edit-form'
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
                id='lostfound-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Title' required error={errors.title}>
                    <Input
                        name='title'
                        value={formData.title}
                        onChange={handleChange}
                        placeholder='Black backpack, blue water bottle'
                    />
                </Field>

                <Field label='Description' required error={errors.description}>
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder='What it looks like and anything that helps identify it'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Type' required>
                        <Select
                            name='type'
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { value: 'lost', label: 'Lost' },
                                { value: 'found', label: 'Found' },
                            ]}
                        />
                    </Field>
                    <Field label='Item state'>
                        <Select
                            name='currentStatus'
                            value={formData.currentStatus}
                            onChange={handleChange}
                            options={[
                                { value: 'open', label: 'Open' },
                                { value: 'closed', label: 'Closed' },
                            ]}
                        />
                    </Field>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field label='Place' required error={errors.location}>
                        <Input
                            name='location'
                            value={formData.location}
                            onChange={handleChange}
                            placeholder='Library, 2nd floor'
                        />
                    </Field>
                    <Field label='Date' required error={errors.date}>
                        <Input
                            type='date'
                            name='date'
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </Field>
                </div>

                <Field label='WhatsApp' required error={errors.whatsapp}>
                    <Input
                        type='tel'
                        name='whatsapp'
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder='9876543210'
                        className='font-mono'
                    />
                </Field>

                <Field label='Photo link'>
                    <Input
                        type='url'
                        name='imageUrl'
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder='https://…/photo.jpg'
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

export default LostFoundEditModal;
