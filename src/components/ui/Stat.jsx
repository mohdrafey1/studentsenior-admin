import { Link } from 'react-router-dom';

/**
 * Headline number tile. `attention` adds the amber dot used for anything
 * that is waiting on a person. Renders as a link when `to` is set.
 */
export default function Stat({
    label,
    value,
    note,
    attention = false,
    to,
    loading = false,
    className = '',
}) {
    // PT Serif has no ₹ glyph, so a leading rupee sign is set in the UI font.
    const shown =
        typeof value === 'string' && value.startsWith('₹') ? (
            <>
                <span className='font-sans font-semibold'>₹</span>
                {value.slice(1)}
            </>
        ) : (
            value
        );

    const body = (
        <>
            <span className='flex items-center gap-2 text-[13px] text-ink-2'>
                {attention && (
                    <span
                        className='w-2 h-2 rounded-full bg-warn'
                        aria-hidden='true'
                    />
                )}
                {label}
            </span>
            {loading ? (
                <span className='h-8 w-24 rounded-md bg-line-soft animate-pulse' />
            ) : (
                <span className='font-serif font-bold text-[28px] sm:text-[32px] leading-none text-ink'>
                    {shown}
                </span>
            )}
            {note && <span className='text-[12.5px] text-muted'>{note}</span>}
        </>
    );

    const classes = `flex flex-col gap-2.5 p-[18px] sm:px-5 bg-sheet border border-line rounded-xl ${className}`;

    if (to) {
        return (
            <Link
                to={to}
                className={`${classes} hover:border-line-strong transition-colors`}
            >
                {body}
            </Link>
        );
    }
    return <div className={classes}>{body}</div>;
}
