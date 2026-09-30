import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatNumber } from '../../utils/format';
import { Panel } from '../ui';
import ChartTooltip from './ChartTooltip';
import {
    AXIS_PROPS,
    GRID_PROPS,
    LINE_CURSOR,
    dayLabel,
    fullDayLabel,
    monthLabel,
    monthTick,
    monthYearTick,
} from './analyticsData';

/** Line chart of new content (every type added together) over the range. */
function SubmissionsChart({ timeline, rangeText }) {
    const { unit, points } = timeline;
    const daily = unit === 'day';
    const total = points.reduce((sum, p) => sum + p.value, 0);
    const peak = points.reduce(
        (best, p) => (p.value > (best?.value ?? -1) ? p : best),
        null,
    );
    const describe = daily ? fullDayLabel : monthLabel;

    return (
        <Panel
            title={daily ? 'New content per day' : 'New content per month'}
            titleId='timeline-title'
            action={
                <span className='text-[12.5px] text-muted'>
                    All types · {rangeText}
                </span>
            }
            className='flex flex-col'
            bodyClassName='relative flex-1 min-h-[264px]'
        >
            {total === 0 ? (
                <p className='absolute inset-0 flex items-center justify-center text-[13.5px] text-muted text-center px-6'>
                    Nothing was added in this period.
                </p>
            ) : (
                <figure
                    className='absolute inset-x-3 top-4 bottom-3 m-0'
                    aria-label={`Line chart of new content per ${unit}, ${formatNumber(total)} in total. Peak of ${formatNumber(peak.value)} in ${describe(peak.key)}.`}
                >
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart
                            data={points}
                            margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
                        >
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis
                                {...AXIS_PROPS}
                                dataKey='key'
                                tickFormatter={
                                    daily
                                        ? dayLabel
                                        : points.length > 12
                                          ? monthYearTick
                                          : monthTick
                                }
                                minTickGap={24}
                                tickMargin={8}
                            />
                            <YAxis
                                {...AXIS_PROPS}
                                axisLine={false}
                                allowDecimals={false}
                                width={40}
                                tickFormatter={formatNumber}
                            />
                            <Tooltip
                                cursor={LINE_CURSOR}
                                content={
                                    <ChartTooltip
                                        unit='new items'
                                        formatLabel={describe}
                                    />
                                }
                            />
                            <Line
                                type='monotone'
                                dataKey='value'
                                name='New items'
                                stroke='var(--ss-brand)'
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: 'var(--ss-brand)',
                                    stroke: 'var(--ss-sheet)',
                                    strokeWidth: 2,
                                }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </figure>
            )}
        </Panel>
    );
}

export default SubmissionsChart;
