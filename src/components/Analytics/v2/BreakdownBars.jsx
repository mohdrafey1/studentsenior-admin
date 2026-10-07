import { CHART_COLORS, number } from './data';

export default function BreakdownBars({
    rows = [],
    valueKey = 'value',
    labelKey = 'label',
    formatValue = number,
}) {
    const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
    return (
        <ul className='p-5 space-y-4'>
            {rows.map((row, index) => (
                <li key={row.key || row[labelKey] || index}>
                    <div className='flex items-start justify-between gap-4 text-[13px] mb-1.5'>
                        <span className='text-ink-2 break-all'>
                            {row[labelKey] || 'Unknown'}
                        </span>
                        <span className='font-mono text-ink shrink-0'>
                            {formatValue(row[valueKey])}
                        </span>
                    </div>
                    <div
                        className='h-1.5 rounded-full bg-line-soft overflow-hidden'
                        aria-hidden='true'
                    >
                        <div
                            className='h-full rounded-full'
                            style={{
                                width: `${(Math.max(0, Number(row[valueKey]) || 0) / max) * 100}%`,
                                background: CHART_COLORS[index % 6],
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
