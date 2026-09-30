import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const TONES = {
    info: ['bg-brand-soft text-brand-ink', Info],
    warn: ['bg-warn-soft text-warn-ink', AlertTriangle],
    bad: ['bg-bad-soft text-bad-ink', XCircle],
    ok: ['bg-ok-soft text-ok-ink', CheckCircle2],
    neutral: ['bg-line-soft text-ink-2', Info],
};

/** Inline notice: a coloured band with an icon, text and optional action. */
export default function Alert({
    tone = 'info',
    title,
    children,
    action,
    className = '',
}) {
    const [classes, Icon] = TONES[tone] || TONES.info;
    return (
        <div
            role={tone === 'bad' ? 'alert' : undefined}
            className={`flex flex-wrap items-start gap-3 px-4 py-3 rounded-xl text-[13.5px] ${classes} ${className}`}
        >
            <Icon className='w-4 h-4 mt-0.5 shrink-0' aria-hidden='true' />
            <div className='flex-1 min-w-[200px] flex flex-col gap-0.5'>
                {title && <span className='font-semibold'>{title}</span>}
                {children && (
                    <span className='leading-relaxed'>{children}</span>
                )}
            </div>
            {action}
        </div>
    );
}
