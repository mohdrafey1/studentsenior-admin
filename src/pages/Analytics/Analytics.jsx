import { Link } from 'react-router-dom';
import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import useRealtimeAnalytics from '../../hooks/useRealtimeAnalytics';
import { useColleges } from '../../context/CollegeContext';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import TimeSeriesChart from '../../components/Analytics/v2/TimeSeriesChart';
import BreakdownBars from '../../components/Analytics/v2/BreakdownBars';
import ContentTypeBreakdown from '../../components/Analytics/v2/ContentTypeBreakdown';
import ContentTable from '../../components/Analytics/v2/ContentTable';
import {
    duration,
    hasValues,
    number,
    reportParams,
} from '../../components/Analytics/v2/data';

export default function Analytics() {
    const controls = useAnalyticsFilters();
    const { params, filters, error } = controls;
    const options = { enabled: !error };
    const overview = useAnalyticsQuery(
        '/analytics/v2/overview',
        params,
        options,
    );
    const audience = useAnalyticsQuery(
        '/analytics/v2/audience',
        params,
        options,
    );
    const content = useAnalyticsQuery('/analytics/v2/content', params, options);
    const growth = useAnalyticsQuery(
        '/analytics/v2/growth',
        reportParams(filters, 'growth'),
        options,
    );
    const realtime = useRealtimeAnalytics(filters);
    const { colleges } = useColleges();
    const growthSeries = (growth.data?.series || []).map((row) => ({
        day: row.day,
        ...row.counts,
    }));
    const growthMetrics = [
        { key: 'users', label: 'Students' },
        { key: 'pyqs', label: 'PYQs' },
        { key: 'notes', label: 'Notes' },
        { key: 'premiumUsers', label: 'Premium students' },
    ];
    return (
        <ReportLayout
            title='Overview'
            description='Student activity, content engagement and the growth of the community.'
            controls={controls}
        >
            <KpiStrip
                query={overview}
                compare={filters.compare}
                metrics={[
                    { key: 'activeUsers', label: 'Active actors' },
                    { key: 'views', label: 'Content views' },
                    { key: 'newUsers', label: 'New accounts' },
                    { key: 'activeSec', label: 'Time spent', format: duration },
                ]}
            />
            <QueryPanel
                title='Active actors'
                query={overview}
                empty={!hasValues(overview.data?.series, ['activeUsers'])}
                note='Unique actors per day. Weekly points show the average daily audience; they are not weekly unique users.'
            >
                <TimeSeriesChart
                    data={overview.data?.series}
                    metrics={[
                        { key: 'activeUsers', label: 'Daily active actors' },
                    ]}
                    area
                    weeklyMode='average'
                />
            </QueryPanel>
            <div className='grid xl:grid-cols-2 gap-5'>
                <ContentTypeBreakdown params={params} overview={overview} />
                <QueryPanel
                    title='Growth of totals'
                    query={growth}
                    empty={!growthSeries.length}
                    note='Observed inventory snapshots across all platforms. Missing snapshots remain absent; content totals include approved items.'
                >
                    <TimeSeriesChart
                        data={growthSeries}
                        metrics={growthMetrics}
                        weeklyMode='last'
                    />
                </QueryPanel>
            </div>
            <QueryPanel
                title='Top content this period'
                query={content}
                empty={!content.data?.top?.length}
                note='7-day and 30-day views end on the selected end date. Since launch excludes legacy counters.'
            >
                <ContentTable rows={content.data?.top} />
            </QueryPanel>
            <div className='grid xl:grid-cols-2 gap-5'>
                <QueryPanel
                    title='Top colleges'
                    query={audience}
                    empty={!audience.data?.colleges?.length}
                    note='Ranked by distinct active actors; an actor may appear in multiple colleges.'
                >
                    <BreakdownBars
                        rows={(audience.data?.colleges || []).map((row) => ({
                            label:
                                colleges.find(
                                    (college) => college.slug === row._id,
                                )?.name ||
                                row._id ||
                                'Unassigned',
                            value: row.activeUsers,
                        }))}
                    />
                </QueryPanel>
                <QueryPanel
                    title='Right now'
                    query={realtime}
                    empty={!realtime.data?.activeActors}
                    action={
                        <Link
                            to='/analytics/realtime'
                            className='text-sm text-link'
                        >
                            Open realtime
                        </Link>
                    }
                    note='Last 30 minutes · provisional raw events · refreshes every 15 seconds while visible.'
                >
                    <div className='p-6 space-y-3'>
                        <div className='font-serif text-4xl text-ink'>
                            {number(realtime.data?.activeActors)}
                        </div>
                        <p className='text-sm text-muted'>
                            active actors in the last 30 minutes
                        </p>
                        <p className='text-xs text-muted'>
                            {realtime.data?.screens?.length || 0} active screens
                            · {realtime.data?.content?.length || 0} content
                            items in the top lists
                        </p>
                    </div>
                </QueryPanel>
            </div>
        </ReportLayout>
    );
}
