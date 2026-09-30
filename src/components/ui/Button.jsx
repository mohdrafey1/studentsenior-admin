import { Link } from 'react-router-dom';

const VARIANTS = {
    // The one main action on a screen.
    primary:
        'bg-brand text-white border border-transparent hover:bg-brand-hover',
    secondary: 'bg-sheet text-ink border border-line-strong hover:bg-sunken',
    // Confirming inside a panel or dialog.
    dark: 'bg-inverse text-on-inverse border border-transparent hover:opacity-90',
    danger: 'bg-sheet text-bad-ink border border-bad-line hover:bg-bad-soft',
    // Only for irreversible actions.
    'danger-solid':
        'bg-bad-strong text-white border border-transparent hover:opacity-90',
    ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-sunken hover:text-ink',
    link: 'bg-transparent text-link border border-transparent hover:underline !px-0',
};

const SIZES = {
    sm: 'h-8 px-2.5 text-[13px] gap-1.5 rounded-[7px]',
    md: 'h-9 px-3 text-[13.5px] gap-2 rounded-lg',
    lg: 'h-11 px-4 text-[14.5px] gap-2 rounded-[9px]',
};

const ICON_ONLY_SIZES = {
    sm: 'w-8 h-8 rounded-[7px]',
    md: 'w-9 h-9 rounded-lg',
    lg: 'w-11 h-11 rounded-[9px]',
};

/**
 * Buttons for the whole console. Renders a router <Link> when `to` is set,
 * an <a> when `href` is set, and a <button> otherwise. Icon-only buttons
 * must be given an `aria-label`.
 */
export default function Button({
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconOnly = false,
    to,
    href,
    type = 'button',
    className = '',
    children,
    ...rest
}) {
    const classes = [
        'inline-flex items-center justify-center font-medium whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.secondary,
        iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
        className,
    ].join(' ');

    const content = (
        <>
            {Icon && (
                <Icon
                    className={
                        iconOnly ? 'w-4 h-4' : 'w-[15px] h-[15px] shrink-0'
                    }
                    aria-hidden='true'
                />
            )}
            {children}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classes} {...rest}>
                {content}
            </Link>
        );
    }
    if (href) {
        return (
            <a href={href} className={classes} {...rest}>
                {content}
            </a>
        );
    }
    return (
        <button type={type} className={classes} {...rest}>
            {content}
        </button>
    );
}
