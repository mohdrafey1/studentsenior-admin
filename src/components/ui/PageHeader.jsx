/**
 * Title block at the top of every page: optional eyebrow (with a status
 * badge beside it on detail pages), a serif title, one line of context and
 * the page's actions on the right.
 */
export default function PageHeader({
    eyebrow,
    badge,
    title,
    description,
    meta,
    actions,
    className = '',
}) {
    return (
        <div className={`flex flex-wrap items-end gap-3 mb-6 ${className}`}>
            <div className='flex-1 min-w-[240px] flex flex-col gap-1.5'>
                {(eyebrow || badge) && (
                    <div className='flex flex-wrap items-center gap-2.5'>
                        {eyebrow && <span className='eyebrow'>{eyebrow}</span>}
                        {badge}
                    </div>
                )}
                <h1 className='font-serif font-bold text-[26px] sm:text-[32px] leading-[1.15] tracking-[-0.4px] text-ink break-words'>
                    {title}
                </h1>
                {description && (
                    <p className='text-sm text-ink-2'>{description}</p>
                )}
                {meta}
            </div>
            {actions && (
                <div className='flex flex-wrap items-center gap-2'>
                    {actions}
                </div>
            )}
        </div>
    );
}
