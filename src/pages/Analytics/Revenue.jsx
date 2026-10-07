import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import TimeSeriesChart from '../../components/Analytics/v2/TimeSeriesChart';
import { hasValues, money } from '../../components/Analytics/v2/data';

const metrics = [
    { key: 'capturedINR', label: 'Captured', format: money },
    {
        key: 'refundsINR',
        label: 'Refunded',
        format: money,
        increaseIsBad: true,
    },
    { key: 'netRevenueINR', label: 'Net revenue', format: money },
];
export default function Revenue() {
    const controls = useAnalyticsFilters(366, { revenue: true });
    const query = useAnalyticsQuery('/analytics/v2/revenue', controls.params, {
        enabled: controls.ready,
    });
    return (
        <ReportLayout
            title='Revenue'
            description='Confirmed cash captures and refunds, dated by their server-recorded events.'
            controls={controls}
            revenue
        >
            <KpiStrip
                query={query}
                compare={controls.filters.compare}
                metrics={metrics}
            />
            <QueryPanel
                title='Revenue in INR'
                query={query}
                empty={
                    !hasValues(
                        query.data?.series,
                        metrics.map((metric) => metric.key),
                    )
                }
                note='Captured INR less confirmed cash refunds. Points and subscription receipts without verified amounts are excluded. History begins at analytics launch.'
            >
                <TimeSeriesChart
                    data={query.data?.series}
                    metrics={metrics}
                    formatValue={money}
                />
            </QueryPanel>
        </ReportLayout>
    );
}
