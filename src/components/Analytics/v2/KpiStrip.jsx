import OverviewStats from '../OverviewStats';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { number } from './data';
import QueryPanel from './QueryPanel';

export default function KpiStrip({ query, metrics, compare = true }) {
    const data = query.data;
    const items = metrics.map(({ key, label, format = number, note }) => ({
        label,
        value: format(data?.current?.[key] || 0),
        sparkline: data?.series?.some((row) => Number.isFinite(row[key])) ? (
            <div className='h-7 w-full' aria-hidden='true'>
                <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={data.series}>
                        <Line
                            dataKey={key}
                            type='monotone'
                            stroke='var(--ss-chart-1)'
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        ) : undefined,
        delta:
            compare && Number.isFinite(data?.deltaPercent?.[key])
                ? Math.round(data.deltaPercent[key])
                : undefined,
        note:
            note ||
            (compare
                ? data?.deltaPercent?.[key] === null
                    ? 'No previous baseline'
                    : 'vs previous period'
                : undefined),
    }));
    if ((query.loading && !data) || query.error)
        return <QueryPanel title='Key metrics' query={query} />;
    return <OverviewStats items={items} />;
}
