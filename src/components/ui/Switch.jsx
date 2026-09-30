import { useId } from 'react';

/** On/off switch for a setting that takes effect straight away. */
export default function Switch({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className = '',
}) {
    const labelId = useId();
    const descriptionId = useId();
    const toggle = () => !disabled && onChange?.(!checked);

    return (
        <div
            className={`flex items-center gap-3 ${disabled ? 'opacity-60' : ''} ${className}`}
        >
            <span
                className={`flex-1 flex flex-col gap-0.5 ${disabled ? '' : 'cursor-pointer'}`}
                onClick={toggle}
            >
                <span
                    id={labelId}
                    className='text-[13.5px] font-medium text-ink'
                >
                    {label}
                </span>
                {description && (
                    <span
                        id={descriptionId}
                        className='text-[12.5px] text-muted'
                    >
                        {description}
                    </span>
                )}
            </span>
            <button
                type='button'
                role='switch'
                aria-checked={Boolean(checked)}
                aria-labelledby={labelId}
                aria-describedby={description ? descriptionId : undefined}
                disabled={disabled}
                onClick={toggle}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    checked ? 'bg-brand' : 'bg-line-strong'
                }`}
            >
                <span
                    aria-hidden='true'
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-4' : ''
                    }`}
                />
            </button>
        </div>
    );
}
