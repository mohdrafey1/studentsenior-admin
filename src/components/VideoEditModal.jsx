import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Button, Dialog, Field, Input, Select, Textarea } from './ui';
import { youtubeThumb } from '../pages/Videos/videoUtils';

const EMPTY_FORM = {
    title: '',
    description: '',
    videoUrl: '',
    subjectCode: '',
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

const VideoEditModal = ({ isOpen, onClose, video, onSuccess }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [thumbFailed, setThumbFailed] = useState(false);

    const originalCode = video?.subject?.subjectCode || '';

    useEffect(() => {
        if (video && isOpen) {
            setFormData({
                title: video.title || '',
                description: video.description || '',
                videoUrl: video.videoUrl || '',
                subjectCode: video.subject?.subjectCode || '',
                submissionStatus: video.submissionStatus || 'pending',
                rejectionReason: video.rejectionReason || '',
            });
            setErrors({});
        }
    }, [video, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === 'videoUrl') setThumbFailed(false);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        const title = formData.title.trim();

        if (!title) {
            newErrors.title = 'Enter a title';
        } else if (title.length < 3) {
            newErrors.title = 'Use at least 3 characters';
        } else if (title.length > 200) {
            newErrors.title = 'Keep it under 200 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Enter a description';
        } else if (formData.description.trim().length > 1000) {
            newErrors.description = 'Keep it under 1,000 characters';
        }

        if (!formData.videoUrl.trim()) {
            newErrors.videoUrl = 'Enter the video link';
        } else if (!isValidUrl(formData.videoUrl.trim())) {
            newErrors.videoUrl = 'Enter a full link, starting with https://';
        }

        const code = formData.subjectCode.trim();
        if (!code) {
            newErrors.subjectCode = 'Enter the subject code';
        } else if (code.length < 2 || code.length > 20) {
            newErrors.subjectCode = 'Subject codes are 2 to 20 characters';
        }

        if (
            formData.submissionStatus === 'rejected' &&
            !formData.rejectionReason?.trim()
        ) {
            newErrors.rejectionReason =
                'Add a reason so the person who shared it knows what to fix';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Check the highlighted fields');
            return;
        }

        setLoading(true);
        try {
            const code = formData.subjectCode.trim();
            // The API looks subjects up by code across every college, so only
            // send the code when it changed.
            const apiData = {
                title: formData.title.trim(),
                videoUrl: formData.videoUrl.trim(),
                description: formData.description.trim(),
                submissionStatus: formData.submissionStatus,
                ...(code !== originalCode && { subjectCode: code }),
                ...(formData.submissionStatus === 'rejected' && {
                    rejectionReason: formData.rejectionReason.trim(),
                }),
            };

            const response = await api.put(`/video/edit/${video._id}`, apiData);
            toast.success('Video saved');
            onSuccess(response.data.data);
        } catch (error) {
            console.error('Error saving video:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t save the video. Try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    const thumb = youtubeThumb(formData.videoUrl);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={loading}
            title='Edit video'
            description={video?.subject?.subjectName}
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        form='video-edit-form'
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
                id='video-edit-form'
                onSubmit={handleSubmit}
                noValidate
                className='flex flex-col gap-4'
            >
                <Field label='Title' required error={errors.title}>
                    <Input
                        name='title'
                        value={formData.title}
                        onChange={handleChange}
                        placeholder='Process synchronization in one shot'
                        maxLength={200}
                    />
                </Field>

                <Field
                    label='Video link'
                    required
                    error={errors.videoUrl}
                    hint='YouTube links show a preview; other links open in a new tab.'
                >
                    <Input
                        type='url'
                        name='videoUrl'
                        value={formData.videoUrl}
                        onChange={handleChange}
                        placeholder='https://www.youtube.com/watch?v=…'
                        className='font-mono text-[13px]'
                    />
                </Field>

                {thumb && !thumbFailed && (
                    <img
                        src={thumb}
                        alt='Thumbnail of the linked video'
                        onError={() => setThumbFailed(true)}
                        className='w-40 aspect-video rounded-lg object-cover border border-line bg-sunken'
                    />
                )}

                <Field label='Description' required error={errors.description}>
                    <Textarea
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder='What the video covers'
                    />
                </Field>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <Field
                        label='Subject code'
                        required
                        error={errors.subjectCode}
                        hint={
                            video?.subject?.subjectName &&
                            `Now: ${video.subject.subjectName}`
                        }
                    >
                        <Input
                            name='subjectCode'
                            value={formData.subjectCode}
                            onChange={handleChange}
                            placeholder='KCS401'
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
                </div>

                {formData.submissionStatus === 'rejected' && (
                    <Field
                        label='Reason for the person who shared it'
                        required
                        error={errors.rejectionReason}
                    >
                        <Textarea
                            name='rejectionReason'
                            value={formData.rejectionReason}
                            onChange={handleChange}
                            rows={3}
                            placeholder='e.g. The video is private or has been removed'
                        />
                    </Field>
                )}
            </form>
        </Dialog>
    );
};

export default VideoEditModal;
