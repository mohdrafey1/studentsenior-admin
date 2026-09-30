import { describeStatus } from './statusMeta';

const TONE_CLASSES = {
    warn: 'bg-warn-soft text-warn-ink',
    ok: 'bg-ok-soft text-ok-ink',
    bad: 'bg-bad-soft text-bad-ink',
    info: 'bg-brand-soft text-brand-ink',
    neutral: 'bg-neutral-soft text-neutral-ink',
    outline: 'bg-sheet text-neutral-ink ring-1 ring-inset ring-line-strong',
};

const DOT_CLASSES = {
    warn: 'bg-warn',
    ok: 'bg-ok',
    bad: 'bg-bad',
    info: 'bg-brand',
    neutral: 'bg-neutral',
    outline: 'bg-neutral',
};

/**
 * Pill with a dot and a word, so status is never shown by colour alone.
 * Pass `status` for API values, or `tone` plus children for anything else.
 */
export default function StatusBadge({
    status,
    tone,
    children,
    className = '',
}) {
    const described = describeStatus(status);
    const finalTone = tone || described.tone;
    const label = children ?? described.label;

    return (
        <span
            className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-xs font-medium whitespace-nowrap ${TONE_CLASSES[finalTone]} ${className}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_CLASSES[finalTone]}`}
                aria-hidden='true'
            />
            {label}
        </span>
    );
}
