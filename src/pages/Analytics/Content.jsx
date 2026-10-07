import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import { EmptyState, Tabs } from '../../components/ui';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import TimeSeriesChart from '../../components/Analytics/v2/TimeSeriesChart';
import BreakdownBars from '../../components/Analytics/v2/BreakdownBars';
import ContentTable from '../../components/Analytics/v2/ContentTable';
import {
    CONTENT_TYPES,
    hasValues,
    analyticsLink,
} from '../../components/Analytics/v2/data';

export default function Content() {
    const { type = 'all' } = useParams();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    const controls = useAnalyticsFilters();
    const validType =
        type === 'all' || CONTENT_TYPES.some((item) => item.value === type);
    const query = useAnalyticsQuery(
        '/analytics/v2/content',
        { ...controls.params, ...(type !== 'all' ? { type } : {}) },
        { enabled: controls.ready && validType },
    );
    const data = query.data;
    return (
        <ReportLayout
            title='Content'
            description='Views, downloads and unlocks, measured across each kind of contribution.'
            controls={controls}
        >
            <Tabs
                label='Content type'
                value={type}
                items={[
                    { value: 'all', label: 'All content' },
                    ...CONTENT_TYPES,
                ]}
                onChange={(value) =>
                    navigate(
                        analyticsLink(
                            `/analytics/content/${value}`,
                            search,
                            pathname,
                        ),
                    )
                }
            />
            {!validType ? (
                <EmptyState
                    title='Unknown content type'
                    description='Choose a content tab to view a supported report.'
                />
            ) : (
                <>
                    <KpiStrip
                        query={query}
                        compare={controls.filters.compare}
                        metrics={[
                            { key: 'views', label: 'Views' },
                            { key: 'uniqueViewers', label: 'Unique viewers' },
                            { key: 'downloads', label: 'Downloads' },
                            { key: 'unlocks', label: 'Unlocks' },
                        ]}
                    />
                    <QueryPanel
                        title='Content engagement'
                        query={query}
                        empty={
                            !hasValues(data?.series, [
                                'views',
                                'downloads',
                                'unlocks',
                            ])
                        }
                    >
                        <TimeSeriesChart
                            data={data?.series}
                            metrics={[
                                { key: 'views', label: 'Views' },
                                { key: 'downloads', label: 'Downloads' },
                                { key: 'unlocks', label: 'Unlocks' },
                            ]}
                        />
                    </QueryPanel>
                    <div className='grid lg:grid-cols-2 gap-5'>
                        <QueryPanel
                            title='Current status counts'
                            query={query}
                            empty={!data?.status?.length}
                            note={`Latest inventory snapshot${data?.meta?.inventoryDay ? `: ${data.meta.inventoryDay}` : ''}, across all platforms. This is not status at the selected end date.`}
                        >
                            <BreakdownBars
                                rows={(data?.status || []).map((row) => ({
                                    label: row._id || 'Unknown',
                                    value: row.count,
                                }))}
                            />
                        </QueryPanel>
                        <QueryPanel
                            title='Upload velocity'
                            query={query}
                            empty={!hasValues(data?.uploadVelocity, ['count'])}
                            note='Recorded content submissions in the selected period.'
                        >
                            <TimeSeriesChart
                                data={data?.uploadVelocity}
                                metrics={[
                                    { key: 'count', label: 'Submissions' },
                                ]}
                                area
                            />
                        </QueryPanel>
                    </div>
                    <QueryPanel
                        title='Top 20 content items'
                        query={query}
                        empty={!data?.top?.length}
                        note='Ranked by views in this period. 7-day, 30-day and since-launch counts end on the selected end date.'
                    >
                        <ContentTable rows={data?.top} />
                    </QueryPanel>
                </>
            )}
        </ReportLayout>
    );
}
