/**
 * Bordered white card. Give it a `title` (and optional `action`) for a
 * header row, or leave both off for a plain container.
 */
export default function Panel({
    as = 'section',
    title,
    titleId,
    action,
    children,
    className = '',
    bodyClassName = '',
}) {
    const Tag = as;
    return (
        <Tag
            aria-labelledby={title && titleId ? titleId : undefined}
            className={`bg-sheet border border-line rounded-xl overflow-hidden ${className}`}
        >
            {(title || action) && (
                <div className='flex flex-wrap items-center gap-3 px-5 py-4 border-b border-line-soft'>
                    {title && (
                        <h2
                            id={titleId}
                            className='flex-1 text-[15px] font-semibold text-ink'
                        >
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </Tag>
    );
}
