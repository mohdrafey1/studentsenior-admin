/**
 * Checkbox with a label and optional description. `bordered` draws it as a
 * card row, for settings that deserve their own line in a form.
 */
export default function Checkbox({
    label,
    description,
    bordered = false,
    className = '',
    ...rest
}) {
    return (
        <label
            className={`flex items-start gap-3 cursor-pointer ${
                bordered ? 'p-3 rounded-lg border border-line' : ''
            } ${className}`}
        >
            <input
                type='checkbox'
                className='mt-0.5 w-4 h-4 accent-brand shrink-0 cursor-pointer disabled:cursor-not-allowed'
                {...rest}
            />
            <span className='flex flex-col gap-0.5'>
                <span className='text-[13.5px] font-medium text-ink'>
                    {label}
                </span>
                {description && (
                    <span className='text-[12.5px] text-muted'>
                        {description}
                    </span>
                )}
            </span>
        </label>
    );
}
