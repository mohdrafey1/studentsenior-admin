import useAnalyticsFilters from '../../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../../hooks/useAnalyticsQuery';
import { Table, Td, Th, Tr } from '../../ui';
import DateRangeBar from './DateRangeBar';
import QueryPanel from './QueryPanel';
import TimeSeriesChart from './TimeSeriesChart';
import { duration, hasValues } from './data';

export default function UserActivity({ userId }) {
    const controls = useAnalyticsFilters(90);
    const query = useAnalyticsQuery(
        `/analytics/v2/users/${userId}/activity`,
        controls.params,
        { enabled: !controls.error },
    );
    const data = query.data;
    return (
        <section
            aria-label='User analytics activity'
            className='my-6 space-y-5'
        >
            <h2 className='font-serif text-2xl font-bold text-ink'>Activity</h2>
            <DateRangeBar {...controls} comparison={false} />
            {!controls.error && (
                <>
                    <div className='grid xl:grid-cols-2 gap-5'>
                        <QueryPanel
                            title='Daily activity'
                            query={query}
                            empty={
                                !hasValues(data?.series, [
                                    'screenViews',
                                    'contentViews',
                                ])
                            }
                        >
                            <TimeSeriesChart
                                data={data?.series}
                                metrics={[
                                    {
                                        key: 'screenViews',
                                        label: 'Screen views',
                                    },
                                    {
                                        key: 'contentViews',
                                        label: 'Content views',
                                    },
                                ]}
                            />
                        </QueryPanel>
                        <QueryPanel
                            title='Time spent'
                            query={query}
                            empty={!hasValues(data?.series, ['activeSec'])}
                        >
                            <TimeSeriesChart
                                data={data?.series}
                                metrics={[
                                    {
                                        key: 'activeSec',
                                        label: 'Foreground time',
                                    },
                                ]}
                                formatValue={duration}
                                area
                            />
                        </QueryPanel>
                    </div>
                    <QueryPanel
                        title='Recent events'
                        query={query}
                        empty={!data?.recentEvents?.length}
                        note='Up to 100 events. Raw events are retained for 30 days; daily activity can cover up to 90 days. Anonymous history before login is not linked.'
                    >
                        <Table minWidth={620}>
                            <thead>
                                <tr>
                                    <Th>Time · IST</Th>
                                    <Th>Event</Th>
                                    <Th>Platform</Th>
                                    <Th>Screen template</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recentEvents || []).map(
                                    (event, index) => (
                                        <Tr key={`${event.ts}:${index}`}>
                                            <Td mono>
                                                {new Date(
                                                    event.ts,
                                                ).toLocaleString('en-IN', {
                                                    timeZone: 'Asia/Kolkata',
                                                })}
                                            </Td>
                                            <Td>{event.name}</Td>
                                            <Td>{event.platform}</Td>
                                            <Td className='font-mono text-xs break-all'>
                                                {event.screen || '—'}
                                            </Td>
                                        </Tr>
                                    ),
                                )}
                            </tbody>
                        </Table>
                    </QueryPanel>
                </>
            )}
        </section>
    );
}
