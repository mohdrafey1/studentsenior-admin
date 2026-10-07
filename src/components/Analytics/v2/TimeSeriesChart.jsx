import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Segmented } from '../../ui';
import ChartTooltip from '../ChartTooltip';
import { AXIS_PROPS, GRID_PROPS } from '../analyticsData';
import { CHART_COLORS, number, weeklySeries } from './data';

export default function TimeSeriesChart({
    data = [],
    metrics,
    area = false,
    weeklyMode = 'sum',
    formatValue = number,
    granularity = true,
    yDomain,
    caption,
}) {
    const [unit, setUnit] = useState('daily');
    const points =
        unit === 'weekly' && granularity
            ? weeklySeries(
                  data,
                  metrics.map((metric) => metric.key),
                  weeklyMode,
              )
            : data;
    const Chart = area ? AreaChart : LineChart;
    const Series = area ? Area : Line;
    return (
        <div className='px-2 sm:px-4 pt-3 pb-4'>
            {granularity && (
                <div className='flex flex-wrap items-center justify-end gap-3 mb-3 px-1'>
                    {unit === 'weekly' && (
                        <span className='text-xs text-muted'>
                            {weeklyMode === 'average'
                                ? 'Average of daily values · partial weeks included'
                                : weeklyMode === 'last'
                                  ? 'Last observation each week'
                                  : 'Monday–Sunday · partial weeks included'}
                        </span>
                    )}
                    <Segmented
                        label='Chart granularity'
                        value={unit}
                        onChange={setUnit}
                        options={[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                        ]}
                    />
                </div>
            )}
            <div
                className='h-64 w-full min-w-0'
                role='img'
                aria-label={
                    metrics.map((metric) => metric.label).join(', ') +
                    ' over time'
                }
            >
                <ResponsiveContainer width='100%' height='100%'>
                    <Chart
                        data={points}
                        margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
                        accessibilityLayer
                    >
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis
                            dataKey='day'
                            {...AXIS_PROPS}
                            minTickGap={35}
                            tickFormatter={(value) =>
                                value.startsWith('Day') ? value : value.slice(5)
                            }
                        />
                        <YAxis
                            {...AXIS_PROPS}
                            width={64}
                            tickFormatter={formatValue}
                            domain={yDomain}
                        />
                        <Tooltip
                            filterNull={false}
                            content={<ChartTooltip formatValue={formatValue} />}
                        />
                        {metrics.length > 1 && (
                            <Legend
                                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            />
                        )}
                        {metrics.map((metric, index) => (
                            <Series
                                key={metric.key}
                                type='monotone'
                                dataKey={metric.key}
                                name={metric.label}
                                stroke={CHART_COLORS[index % 6]}
                                fill={CHART_COLORS[index % 6]}
                                fillOpacity={0.12}
                                strokeWidth={2}
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </Chart>
                </ResponsiveContainer>
            </div>
            {caption && (
                <p className='text-xs text-muted px-3 mt-2'>{caption}</p>
            )}
        </div>
    );
}
