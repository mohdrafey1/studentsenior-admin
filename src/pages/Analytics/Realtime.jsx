import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useRealtimeAnalytics from '../../hooks/useRealtimeAnalytics';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import BreakdownBars from '../../components/Analytics/v2/BreakdownBars';
import ContentTable from '../../components/Analytics/v2/ContentTable';
import { Button } from '../../components/ui';
import { number } from '../../components/Analytics/v2/data';

export default function Realtime() {
    const controls = useAnalyticsFilters(366, { realtime: true });
    const query = useRealtimeAnalytics(controls);
    const data = query.data;
    return (
        <ReportLayout
            title='Realtime'
            description='Activity in the last 30 minutes, before rollup validation and session-view deduplication.'
            controls={controls}
            realtime
        >
            <QueryPanel
                title='Active actors · last 30 minutes'
                query={query}
                emptyWindow='last 30 minutes'
                empty={!data?.activeActors}
                action={
                    <Button
                        size='sm'
                        onClick={query.refresh}
                        disabled={!query.visible || query.loading}
                    >
                        Refresh
                    </Button>
                }
                note={`${query.visible ? 'Refreshes every 15 seconds while visible.' : 'Updates paused while this tab is hidden.'}${data?.meta?.to ? ` Last updated ${new Date(data.meta.to).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.` : ''}`}
            >
                <div className='p-6 font-serif text-5xl'>
                    {number(data?.activeActors)}
                </div>
            </QueryPanel>
            <QueryPanel
                title='Active screens'
                query={query}
                emptyWindow='last 30 minutes'
                empty={!data?.screens?.length}
            >
                <BreakdownBars
                    rows={(data?.screens || []).map((row) => ({
                        label: row._id || 'Unknown screen',
                        value: row.views,
                    }))}
                />
            </QueryPanel>
            <QueryPanel
                title='Viewed content'
                query={query}
                emptyWindow='last 30 minutes'
                empty={!data?.content?.length}
                note='Provisional raw content_view events; final view counts may be lower.'
            >
                <ContentTable rows={data?.content} realtime />
            </QueryPanel>
        </ReportLayout>
    );
}
