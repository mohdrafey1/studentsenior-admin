/**
 * Two-column label/value list for detail pages.
 * items: [{ label, value, mono? }] — items with an empty value are skipped.
 */
export default function MetaList({ items, labelWidth = 96, className = '' }) {
    const shown = items.filter(
        (item) =>
            item &&
            item.value !== undefined &&
            item.value !== null &&
            item.value !== '',
    );
    return (
        <dl
            className={`grid gap-x-3 gap-y-2.5 text-[13.5px] ${className}`}
            style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` }}
        >
            {shown.map((item) => (
                <div key={item.label} className='contents'>
                    <dt className='text-muted'>{item.label}</dt>
                    <dd
                        className={`m-0 min-w-0 break-words ${
                            item.mono
                                ? 'font-mono text-xs text-ink-2 break-all'
                                : 'text-ink'
                        }`}
                    >
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
