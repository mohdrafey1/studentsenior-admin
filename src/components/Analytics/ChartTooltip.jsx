import { formatNumber } from '../../utils/format';

/**
 * Hover card for recharts charts: pass it as
 * `<Tooltip content={<ChartTooltip unit='posts' formatLabel={…} />} />`.
 * Recharts fills in `active`, `payload` and `label`.
 */
export default function ChartTooltip({
    active,
    payload,
    label,
    unit,
    formatLabel,
    formatValue = formatNumber,
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className='min-w-[120px] px-2.5 py-2 rounded-lg bg-sheet border border-line text-xs text-ink leading-snug shadow-[0_4px_12px_rgba(28,27,24,0.12)]'>
            <div className='text-muted mb-0.5'>
                {formatLabel ? formatLabel(label) : label}
            </div>
            {payload.map((item) => (
                <div
                    key={item.dataKey || item.name}
                    className='flex items-center gap-1.5'
                >
                    {payload.length > 1 && (
                        <span
                            aria-hidden='true'
                            className='w-2 h-2 rounded-full shrink-0'
                            style={{ background: item.color }}
                        />
                    )}
                    <span className='font-mono font-medium'>
                        {payload.length > 1 && (
                            <span className='font-sans font-normal text-ink-2'>
                                {item.name || item.dataKey}:{' '}
                            </span>
                        )}
                        {item.value == null ? '—' : formatValue(item.value)}
                    </span>
                    {unit && <span className='text-ink-2'>{unit}</span>}
                </div>
            ))}
        </div>
    );
}
