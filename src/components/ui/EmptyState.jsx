/**
 * Centered message for an empty list, a cleared queue or a failed load.
 * tone: 'neutral' | 'done' | 'error'
 */
const ICON_TONES = {
    neutral: 'bg-ground text-muted',
    done: 'bg-ok-soft text-ok-ink rounded-full',
    error: 'bg-bad-soft text-bad-ink',
};

export default function EmptyState({
    icon: Icon,
    tone = 'neutral',
    title,
    description,
    action,
    className = '',
}) {
    return (
        <div
            role={tone === 'error' ? 'alert' : undefined}
            className={`flex flex-col items-center justify-center gap-2.5 text-center px-6 py-12 ${className}`}
        >
            {Icon && (
                <span
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${ICON_TONES[tone]}`}
                >
                    <Icon className='w-5 h-5' aria-hidden='true' />
                </span>
            )}
            <span className='text-[15px] font-semibold text-ink'>{title}</span>
            {description && (
                <span className='text-[13.5px] text-ink-2 max-w-sm'>
                    {description}
                </span>
            )}
            {action && <div className='mt-1'>{action}</div>}
        </div>
    );
}
