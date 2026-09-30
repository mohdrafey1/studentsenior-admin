/**
 * Underline tabs with an optional count, used to filter a list by status.
 * items: [{ value, label, count?, attention? }]
 */
export default function Tabs({
    items,
    value,
    onChange,
    label,
    className = '',
}) {
    return (
        <div
            role='tablist'
            aria-label={label}
            className={`flex gap-6 border-b border-line-soft overflow-x-auto ${className}`}
        >
            {items.map((item) => {
                const selected = item.value === value;
                return (
                    <button
                        key={item.value}
                        type='button'
                        role='tab'
                        aria-selected={selected}
                        onClick={() => onChange(item.value)}
                        className={`inline-flex items-center gap-2 h-10 px-0.5 -mb-px border-b-2 text-[13.5px] whitespace-nowrap cursor-pointer transition-colors ${
                            selected
                                ? 'border-ink text-ink font-medium'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        {item.attention && (
                            <span
                                className='w-[7px] h-[7px] rounded-full bg-warn'
                                aria-hidden='true'
                            />
                        )}
                        {item.label}
                        {item.count !== undefined && item.count !== null && (
                            <span className='font-mono text-[11.5px] px-1.5 py-px rounded-full bg-ground text-ink-2'>
                                {typeof item.count === 'number'
                                    ? item.count.toLocaleString('en-IN')
                                    : item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
