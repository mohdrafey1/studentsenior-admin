import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Item',
    message = 'Are you sure you want to delete this item?',
    itemName = '',
    loading = false,
}) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            busy={loading}
            role='alertdialog'
            size='sm'
            title={title}
            icon={
                <span className='w-10 h-10 rounded-xl bg-bad-soft text-bad-ink flex items-center justify-center shrink-0'>
                    <AlertTriangle className='w-5 h-5' aria-hidden='true' />
                </span>
            }
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant='danger-solid'
                        onClick={onConfirm}
                        disabled={loading}
                        icon={loading ? Loader2 : Trash2}
                        className={loading ? '[&>svg]:animate-spin' : ''}
                    >
                        {loading ? 'Deleting…' : 'Delete'}
                    </Button>
                </>
            }
        >
            <div className='flex flex-col gap-3'>
                <p className='text-sm leading-relaxed text-ink-2'>{message}</p>
                {itemName && (
                    <p className='px-3 py-2.5 rounded-lg bg-sunken border border-line-soft text-sm font-medium'>
                        {itemName}
                    </p>
                )}
                <p className='px-3 py-2.5 rounded-lg bg-bad-soft text-[13px] text-bad-ink'>
                    This can’t be undone.
                </p>
            </div>
        </Dialog>
    );
};

export default DeleteConfirmationModal;
