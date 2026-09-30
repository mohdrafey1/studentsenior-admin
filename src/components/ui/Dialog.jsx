import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

const WIDTHS = {
    sm: 'max-w-md',
    md: 'max-w-[540px]',
    lg: 'max-w-3xl',
};

/**
 * Modal dialog: serif title, optional description, body and a footer row for
 * the buttons. Escape and a click on the backdrop close it unless `busy`.
 */
export default function Dialog({
    open,
    onClose,
    title,
    description,
    icon,
    children,
    footer,
    size = 'md',
    busy = false,
    role = 'dialog',
}) {
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
            if (event.key === 'Escape' && !busy) onClose?.();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, busy, onClose]);

    if (!open) return null;

    return (
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40'
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose?.();
            }}
        >
            <div
                role={role}
                aria-modal='true'
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={`w-full ${WIDTHS[size]} max-h-[90vh] flex flex-col bg-sheet text-ink border border-line rounded-2xl shadow-[0_24px_64px_rgba(20,19,17,0.28)]`}
            >
                <div className='flex items-start gap-3 px-6 pt-5'>
                    {icon}
                    <div className='flex-1 min-w-0 flex flex-col gap-1'>
                        <h2
                            id={titleId}
                            className='font-serif font-bold text-[22px] leading-tight'
                        >
                            {title}
                        </h2>
                        {description && (
                            <p
                                id={descriptionId}
                                className='text-[13.5px] text-ink-2'
                            >
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={busy}
                        aria-label='Close'
                        className='w-8 h-8 -mr-2 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-sunken cursor-pointer disabled:opacity-50'
                    >
                        <X className='w-4 h-4' aria-hidden='true' />
                    </button>
                </div>
                <div className='px-6 py-4 overflow-y-auto'>{children}</div>
                {footer && (
                    <div className='flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-line-soft bg-sunken rounded-b-2xl'>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
