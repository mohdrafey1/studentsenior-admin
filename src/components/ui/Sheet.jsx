import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/**
 * Panel that slides in from the right, for creating or editing something
 * while the list stays visible. Same props as Dialog.
 */
export default function Sheet({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    busy = false,
    width = 'max-w-[480px]',
}) {
    const titleId = useId();

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
            className='fixed inset-0 z-[100] flex justify-end bg-black/30'
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose?.();
            }}
        >
            <div
                role='dialog'
                aria-modal='true'
                aria-labelledby={titleId}
                className={`w-full ${width} h-full flex flex-col bg-sheet text-ink border-l border-line shadow-[0_0_48px_rgba(20,19,17,0.2)]`}
            >
                <div className='flex items-start gap-3 px-6 pt-5 pb-4 border-b border-line-soft'>
                    <div className='flex-1 min-w-0 flex flex-col gap-1'>
                        <h2
                            id={titleId}
                            className='font-serif font-bold text-[22px] leading-tight'
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className='text-[13.5px] text-ink-2'>
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
                <div className='flex-1 overflow-y-auto px-6 py-5'>
                    {children}
                </div>
                {footer && (
                    <div className='flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-line-soft bg-sunken'>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
