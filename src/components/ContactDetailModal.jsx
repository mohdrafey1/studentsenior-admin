import React, { useId, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Mail, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { formatDateTime } from '../utils/format';
import { Button, Dialog, Field, StatusBadge, Textarea } from './ui';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', dot: 'bg-warn' },
    { value: 'in-progress', label: 'In progress', dot: 'bg-brand' },
    { value: 'resolved', label: 'Resolved', dot: 'bg-ok' },
];

const replyHref = (contact) =>
    `mailto:${contact.email}?subject=${encodeURIComponent(
        `Re: ${contact.subject || 'Your message to StudentSenior'}`,
    )}`;

/**
 * Status switch, resolution note and Save button for one contact request.
 * Give it a `key` that changes with the contact so it starts from the saved values.
 */
export function ContactStatusForm({ contact, onStatusUpdate, className = '' }) {
    const groupId = useId();
    const savedStatus = contact.status || 'pending';
    const [status, setStatus] = useState(savedStatus);
    const [resolvedDescription, setResolvedDescription] = useState(
        contact.resolvedDescription || '',
    );
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const unchanged =
        status === savedStatus &&
        resolvedDescription === (contact.resolvedDescription || '');

    const handleUpdateStatus = async (event) => {
        event.preventDefault();
        if (status === 'resolved' && !resolvedDescription.trim()) {
            setError('Say how it was resolved before saving.');
            return;
        }

        setIsUpdating(true);
        try {
            const response = await api.patch(
                `/stats/contact-us/${contact._id}/status`,
                {
                    status,
                    resolvedDescription:
                        status === 'resolved' ? resolvedDescription : undefined,
                },
            );
            toast.success('Status saved');
            if (onStatusUpdate) onStatusUpdate(response.data.data);
        } catch (e) {
            console.error('Error updating status:', e);
            toast.error('Couldn’t save the status. Try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <form
            onSubmit={handleUpdateStatus}
            noValidate
            className={`flex flex-col gap-3.5 ${className}`}
        >
            <div className='flex flex-wrap items-center gap-3'>
                <span id={groupId} className='text-[13px] font-medium text-ink'>
                    Status
                </span>
                <div
                    role='radiogroup'
                    aria-labelledby={groupId}
                    className='inline-flex flex-wrap p-[3px] rounded-[9px] bg-ground'
                >
                    {STATUS_OPTIONS.map((option) => (
                        <label key={option.value} className='relative'>
                            <input
                                type='radio'
                                name={`status-${contact._id}`}
                                value={option.value}
                                checked={status === option.value}
                                onChange={() => {
                                    setStatus(option.value);
                                    setError('');
                                }}
                                className='peer sr-only'
                            />
                            <span className='inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-[13px] text-ink-2 cursor-pointer transition-colors hover:text-ink peer-checked:bg-sheet peer-checked:text-ink peer-checked:font-medium peer-checked:shadow-[0_1px_2px_rgba(28,27,24,0.08)] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40'>
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${option.dot}`}
                                    aria-hidden='true'
                                />
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {status === 'resolved' && (
                <Field label='How it was resolved' required error={error}>
                    <Textarea
                        rows={3}
                        value={resolvedDescription}
                        onChange={(e) => {
                            setResolvedDescription(e.target.value);
                            setError('');
                        }}
                        placeholder='e.g. Changed the college on their account and replied by email.'
                    />
                </Field>
            )}

            {contact.resolvedDescription &&
                savedStatus === 'resolved' &&
                status !== 'resolved' && (
                    <p className='text-[13px] text-ink-2'>
                        <span className='font-medium text-ink'>
                            Earlier resolution:
                        </span>{' '}
                        {contact.resolvedDescription}
                    </p>
                )}

            <div className='flex justify-end'>
                <Button
                    type='submit'
                    variant='dark'
                    disabled={isUpdating || unchanged}
                    icon={isUpdating ? Loader2 : undefined}
                    className={isUpdating ? '[&>svg]:animate-spin' : ''}
                >
                    {isUpdating ? 'Saving…' : 'Save status'}
                </Button>
            </div>
        </form>
    );
}

/** The selected message in the inbox layout used on wide screens. */
export function ContactPane({ contact, onStatusUpdate, onDelete }) {
    return (
        <section
            aria-label='Selected message'
            className='flex flex-col h-full min-w-0'
        >
            <div className='flex flex-wrap items-start gap-3 px-7 py-5 border-b border-line-soft'>
                <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h2 className='font-serif font-bold text-2xl leading-tight text-ink break-words'>
                            {contact.subject || 'No subject'}
                        </h2>
                        <StatusBadge status={contact.status || 'pending'} />
                    </div>
                    <span className='text-[13px] text-muted'>
                        From{' '}
                        <span className='font-medium text-ink break-all'>
                            {contact.email || 'unknown sender'}
                        </span>{' '}
                        · {formatDateTime(contact.createdAt)}
                    </span>
                </div>
                {contact.email && (
                    <Button icon={Mail} href={replyHref(contact)}>
                        Reply by email
                    </Button>
                )}
                {onDelete && (
                    <Button
                        variant='danger'
                        iconOnly
                        icon={Trash2}
                        aria-label='Delete message'
                        onClick={() => onDelete(contact)}
                    />
                )}
            </div>
            <div className='flex-1 px-7 py-6'>
                <p className='max-w-[680px] text-[14.5px] leading-[1.7] text-ink whitespace-pre-wrap break-words'>
                    {contact.description || contact.message || 'No message'}
                </p>
            </div>
            <ContactStatusForm
                key={`${contact._id}-${contact.updatedAt}`}
                contact={contact}
                onStatusUpdate={onStatusUpdate}
                className='px-7 pt-5 pb-6 border-t border-line-soft bg-sunken'
            />
        </section>
    );
}

/** The same message in a dialog, used on narrow screens. */
const ContactDetailModal = ({
    isOpen,
    onClose,
    contact,
    onStatusUpdate,
    onDelete,
}) => {
    if (!isOpen || !contact) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            size='lg'
            title={contact.subject || 'No subject'}
            description={`From ${contact.email || 'unknown sender'} · ${formatDateTime(contact.createdAt)}`}
            footer={
                <>
                    {onDelete && (
                        <Button
                            variant='danger'
                            icon={Trash2}
                            className='mr-auto'
                            onClick={() => onDelete(contact)}
                        >
                            Delete
                        </Button>
                    )}
                    {contact.email && (
                        <Button icon={Mail} href={replyHref(contact)}>
                            Reply by email
                        </Button>
                    )}
                    <Button onClick={onClose}>Close</Button>
                </>
            }
        >
            <div className='flex flex-col gap-5'>
                <div className='flex items-center gap-2'>
                    <StatusBadge status={contact.status || 'pending'} />
                </div>
                <p className='max-h-72 overflow-y-auto text-[14px] leading-relaxed text-ink whitespace-pre-wrap break-words'>
                    {contact.description || contact.message || 'No message'}
                </p>
                <ContactStatusForm
                    key={`${contact._id}-${contact.updatedAt}`}
                    contact={contact}
                    onStatusUpdate={onStatusUpdate}
                    className='pt-4 border-t border-line-soft'
                />
            </div>
        </Dialog>
    );
};

export default ContactDetailModal;
