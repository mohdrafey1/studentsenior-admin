import React from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

// Irreversible actions get the solid red button; everything else is blue.
const CONFIRM_VARIANT = {
    danger: 'danger-solid',
    warning: 'dark',
    info: 'primary',
    success: 'primary',
};

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // "danger" | "warning" | "info" | "success"
}) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title={title}
            size='sm'
            role={variant === 'danger' ? 'alertdialog' : 'dialog'}
            footer={
                <>
                    <Button onClick={onClose}>{cancelText}</Button>
                    <Button
                        variant={CONFIRM_VARIANT[variant] || 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className='text-sm leading-relaxed text-ink-2'>{message}</p>
        </Dialog>
    );
};

export default ConfirmModal;
