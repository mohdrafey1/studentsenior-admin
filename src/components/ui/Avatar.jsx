import { personInitials } from '../../utils/initials';

const SIZES = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-14 h-14 text-lg',
};

/** Round photo, or initials on a tinted circle when there is no photo. */
export default function Avatar({ name, src, size = 'md', className = '' }) {
    const classes = `${SIZES[size]} rounded-full shrink-0 ${className}`;
    if (src) {
        return (
            <img
                src={src}
                alt=''
                className={`${classes} object-cover bg-sunken`}
            />
        );
    }
    return (
        <span
            aria-hidden='true'
            className={`${classes} flex items-center justify-center bg-brand-soft text-brand-ink font-semibold`}
        >
            {personInitials(name || '?')}
        </span>
    );
}
