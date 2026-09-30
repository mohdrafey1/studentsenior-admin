/**
 * Dark bar above a table while rows are selected. Put the bulk actions in
 * children, using BulkButton from this file.
 */
export default function BulkBar({ count, onClear, children }) {
    if (!count) return null;
    return (
        <div
            role='region'
            aria-label='Bulk actions'
            className='flex flex-wrap items-center gap-2 min-h-12 px-4 py-2 bg-inverse text-on-inverse'
        >
            <span className='flex-1 text-[13.5px] font-medium'>
                {count.toLocaleString('en-IN')} selected
            </span>
            {children}
            <button
                type='button'
                onClick={onClear}
                className='h-8 px-2.5 rounded-[7px] text-[13px] opacity-75 hover:opacity-100 cursor-pointer'
            >
                Clear
            </button>
        </div>
    );
}

/** Button styled for the dark bulk bar. */
export function BulkButton({
    primary = false,
    icon: Icon,
    className = '',
    children,
    ...rest
}) {
    return (
        <button
            type='button'
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                primary
                    ? 'bg-brand text-white hover:bg-brand-hover'
                    : 'border border-white/25 hover:bg-white/10'
            } ${className}`}
            {...rest}
        >
            {Icon && <Icon className='w-[15px] h-[15px]' aria-hidden='true' />}
            {children}
        </button>
    );
}
