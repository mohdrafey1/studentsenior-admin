import { CHART_COLORS, number, typeBreakdown } from './data';
import QueryPanel from './QueryPanel';

export default function ContentTypeBreakdown({ overview, compare = true }) {
    const rows = typeBreakdown(overview.data?.viewsByType);
    const total = rows.reduce((sum, row) => sum + row.current, 0);
    return (
        <QueryPanel
            title='Views by content type'
            query={overview}
            empty={!total && !rows.some((row) => row.previous)}
        >
            <ul className='grid sm:grid-cols-2 gap-x-6 gap-y-4 p-5'>
                {rows.map((row, index) => (
                    <li key={row.type} className='space-y-1.5'>
                        <div className='flex justify-between gap-3 text-sm'>
                            <span className='text-ink-2'>{row.label}</span>
                            <span className='font-mono'>
                                {number(row.current)}
                            </span>
                        </div>
                        {compare && (
                            <div className='text-xs text-muted'>
                                Previous period: {number(row.previous)}
                            </div>
                        )}
                        <div
                            className='h-1.5 bg-line-soft rounded-full overflow-hidden'
                            aria-hidden='true'
                        >
                            <div
                                className='h-full rounded-full'
                                style={{
                                    background: CHART_COLORS[index % 6],
                                    width: `${total ? (row.current / total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </QueryPanel>
    );
}
