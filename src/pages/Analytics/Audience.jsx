import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import TimeSeriesChart from '../../components/Analytics/v2/TimeSeriesChart';
import BreakdownBars from '../../components/Analytics/v2/BreakdownBars';
import RetentionGrid from '../../components/Analytics/v2/RetentionGrid';
import {
    duration,
    hasValues,
    number,
    retentionCurve,
} from '../../components/Analytics/v2/data';

const buckets = {
    0: 'Under 30 sec',
    30: '30–59 sec',
    60: '1–3 min',
    180: '3–10 min',
    600: '10–30 min',
    1800: '30–60 min',
    '3600+': '60+ min',
};

export default function Audience() {
    const controls = useAnalyticsFilters();
    const query = useAnalyticsQuery('/analytics/v2/audience', controls.params, {
        enabled: !controls.error,
    });
    const data = query.data;
    const retention = retentionCurve(data?.retention, controls.filters.to);
    return (
        <ReportLayout
            title='Audience'
            description='Who returns, where they arrive and how much foreground time they spend.'
            controls={controls}
        >
            <KpiStrip
                query={query}
                compare={controls.filters.compare}
                metrics={[
                    {
                        key: 'dau',
                        label: 'DAU',
                        note: 'Final day of the range',
                    },
                    { key: 'wau', label: 'WAU', note: 'Final 7 days' },
                    { key: 'mau', label: 'MAU', note: 'Final 30 days' },
                    {
                        key: 'avgSessionLengthSec',
                        label: 'Average session',
                        format: duration,
                    },
                ]}
            />
            <div className='grid lg:grid-cols-2 gap-5'>
                <QueryPanel
                    title='New and returning actors'
                    query={query}
                    empty={!data?.current?.activeUsers}
                    note='New means first observed in analytics, rather than newly registered.'
                >
                    <BreakdownBars
                        rows={[
                            { label: 'New actors', value: data?.newActors },
                            {
                                label: 'Returning actors',
                                value: data?.returningActors,
                            },
                        ]}
                    />
                </QueryPanel>
                <QueryPanel
                    title='Time spent per day'
                    query={query}
                    empty={!hasValues(data?.series, ['activeSec'])}
                    note='Foreground time from heartbeats; idle background time is excluded.'
                >
                    <TimeSeriesChart
                        data={data?.series}
                        metrics={[{ key: 'activeSec', label: 'Active time' }]}
                        formatValue={duration}
                        area
                    />
                </QueryPanel>
            </div>
            <div className='grid xl:grid-cols-3 gap-5'>
                {[
                    ['platforms', 'Platforms'],
                    ['versions', 'App versions'],
                    ['designs', 'Designs'],
                ].map(([key, title]) => (
                    <QueryPanel
                        key={key}
                        title={title}
                        query={query}
                        empty={!data?.[key]?.length}
                        note='Distinct actors in each segment; segments may overlap.'
                    >
                        <BreakdownBars
                            rows={(data?.[key] || []).map((row) => ({
                                label: row._id || 'Unknown',
                                value: row.activeUsers,
                            }))}
                        />
                    </QueryPanel>
                ))}
            </div>
            <QueryPanel
                title='First-week retention'
                query={query}
                empty={!data?.retention?.length}
                note='Each day uses only cohorts old enough to reach that offset. Rates are weighted by eligible cohort size.'
            >
                <TimeSeriesChart
                    data={retention}
                    metrics={[{ key: 'percent', label: 'Retained actors' }]}
                    granularity={false}
                    yDomain={[0, 100]}
                    formatValue={(value) => `${number(value)}%`}
                />
            </QueryPanel>
            <QueryPanel
                title='Weekly cohorts'
                query={query}
                empty={!data?.cohorts?.length}
                note='Cohorts begin on Monday. W0 is the first 7 elapsed days since first observation. * marks an incomplete interval; — marks a future interval.'
            >
                <RetentionGrid
                    rows={data?.cohorts || []}
                    endDay={controls.filters.to}
                />
            </QueryPanel>
            <QueryPanel
                title='Session length distribution'
                query={query}
                empty={!data?.sessionLengthDistribution?.length}
            >
                <BreakdownBars
                    rows={(data?.sessionLengthDistribution || []).map(
                        (row) => ({
                            label: buckets[row._id] || row._id,
                            value: row.sessions,
                        }),
                    )}
                />
            </QueryPanel>
        </ReportLayout>
    );
}
