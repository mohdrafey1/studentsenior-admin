import { useMemo } from 'react';
import useAnalyticsFilters from '../../hooks/useAnalyticsFilters';
import useAnalyticsQuery from '../../hooks/useAnalyticsQuery';
import ReportLayout from '../../components/Analytics/v2/ReportLayout';
import QueryPanel from '../../components/Analytics/v2/QueryPanel';
import KpiStrip from '../../components/Analytics/v2/KpiStrip';
import BreakdownBars from '../../components/Analytics/v2/BreakdownBars';
import TimeSeriesChart from '../../components/Analytics/v2/TimeSeriesChart';
import FollowTree from '../../components/Analytics/v2/FollowTree';
import {
    hasValues,
    number,
    percent,
    reportParams,
    reportReady,
} from '../../components/Analytics/v2/data';
import {
    FOLLOW_CONTENT,
    NEEDS_CONTENT_MIN_STUDENTS,
    alertRows,
    demandRows,
    followKpis,
    followTree,
    picksSeries,
} from '../../components/Analytics/v2/follows';
import { Table, Td, Th, Tr } from '../../components/ui';
import { formatDate } from '../../utils/format';

function Note({ children }) {
    return (
        <p className='px-5 py-8 text-center text-sm text-muted'>{children}</p>
    );
}

export default function Branches() {
    const controls = useAnalyticsFilters();
    // Follows come from accounts, so the platform filter never applies.
    const query = useAnalyticsQuery(
        '/analytics/v2/follows',
        reportParams(controls.requestFilters, 'follows'),
        { enabled: reportReady(controls, 'follows') },
    );
    const data = query.data;
    const totals = data?.totals || {};
    const tree = useMemo(() => followTree(data?.rows), [data]);
    const demand = useMemo(() => demandRows(tree), [tree]);
    const alerts = data?.alerts || {};
    const performance = alertRows(alerts.byBranch);
    const series = picksSeries(data?.series);
    const kpiQuery = { ...query, data: data && followKpis(totals) };

    return (
        <ReportLayout
            title='Students & branches'
            description='Which college, course, branch and semester students follow in the app, their alert settings, and how new-content alerts perform.'
            controls={controls}
            platform={false}
            comparison={false}
        >
            <KpiStrip
                query={kpiQuery}
                compare={false}
                metrics={[
                    {
                        key: 'students',
                        label: 'Students with a branch',
                        note: 'Picked “Your branch” in the app',
                    },
                    {
                        key: 'alertsOnRate',
                        label: 'Alerts on',
                        format: percent,
                        note: `${number(totals.alertsOn)} of ${number(totals.students)} students`,
                    },
                    {
                        key: 'reachable',
                        label: 'Reachable devices',
                        note: 'Alerts on, with a phone that takes pushes',
                    },
                    {
                        key: 'alertsOff',
                        label: 'Opted out',
                        increaseIsBad: true,
                        note: 'Turned new-upload alerts off',
                    },
                ]}
            />

            <QueryPanel
                title='Followers by branch'
                query={query}
                note={`Everyone’s current pick, whatever the dates above. Content is approved items per branch${data?.meta?.inventoryDay ? ` from the ${formatDate(data.meta.inventoryDay)} inventory snapshot` : ''}; semesters share their branch’s content. “High demand” means at least ${NEEDS_CONTENT_MIN_STUDENTS} students and fewer items than students.`}
            >
                {tree.length ? (
                    <FollowTree
                        key={`${data?.meta?.college || ''}:${tree.length}`}
                        tree={tree}
                    />
                ) : (
                    <Note>No student has picked a branch yet.</Note>
                )}
            </QueryPanel>

            <div className='grid xl:grid-cols-2 gap-5'>
                <QueryPanel
                    title='Branches that need content'
                    query={query}
                    note='Most followers per approved item first. Upload or approve PYQs, notes and quick notes for these.'
                >
                    {demand.length ? (
                        <Table minWidth={520}>
                            <thead>
                                <tr>
                                    <Th>Branch</Th>
                                    <Th align='right'>Students</Th>
                                    <Th align='right'>Items</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {demand.map((row) => (
                                    <Tr key={row.key}>
                                        <Td>
                                            <div className='flex flex-col gap-0.5'>
                                                <span className='text-ink'>
                                                    {row.label}
                                                </span>
                                                <span className='text-xs text-muted'>
                                                    {row.course} · {row.college}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td align='right' mono>
                                            {number(row.students)}
                                        </Td>
                                        <Td align='right'>
                                            <span className='font-mono text-[13px] text-warn-ink'>
                                                {number(row.items)}
                                            </span>
                                            <span className='block text-xs text-muted whitespace-nowrap'>
                                                {FOLLOW_CONTENT.map(
                                                    ([type, label]) =>
                                                        `${number(row.content?.[type])} ${label}`,
                                                ).join(' · ')}
                                            </span>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Note>
                            Every followed branch has at least as many items as
                            students.
                        </Note>
                    )}
                </QueryPanel>

                <QueryPanel
                    title='Alert settings'
                    query={query}
                    note='Missing settings count as on: everyone who picks a branch is enrolled until they opt out.'
                >
                    <h3 className='eyebrow px-5 pt-4'>Types turned off</h3>
                    <BreakdownBars
                        rows={FOLLOW_CONTENT.map(([type, label]) => ({
                            key: type,
                            label,
                            value: totals.typesOff?.[type] || 0,
                        }))}
                    />
                    <h3 className='eyebrow px-5 pt-4 border-t border-line-soft'>
                        Alert scope
                    </h3>
                    <BreakdownBars
                        rows={[
                            {
                                key: 'semester',
                                label: 'Only my semester',
                                value: totals.scope?.semester || 0,
                            },
                            {
                                key: 'branch',
                                label: 'Whole branch',
                                value: totals.scope?.branch || 0,
                            },
                        ]}
                    />
                </QueryPanel>
            </div>

            <QueryPanel
                title='Branch picks per day'
                query={query}
                empty={!hasValues(series, ['picks'])}
                note='When students last saved “Your branch” in the app; changing it later moves their pick to that day.'
            >
                <TimeSeriesChart
                    data={series}
                    metrics={[{ key: 'picks', label: 'Branch picks' }]}
                />
            </QueryPanel>

            <QueryPanel
                title='New-content alerts'
                query={query}
                empty={!alerts.sent}
                note='Opens are unique students who tapped an alert (app events are kept for 30 days). Top 20 branches by delivered.'
            >
                <dl className='grid grid-cols-2 sm:grid-cols-4 gap-px bg-line-soft border-b border-line-soft'>
                    {[
                        ['Alerts sent', number(alerts.sent)],
                        ['Delivered', number(alerts.delivered)],
                        ['Opens', number(alerts.opens)],
                        ['Open rate', percent(alerts.openRate)],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className='bg-sheet px-5 py-3 flex flex-col gap-1'
                        >
                            <dt className='text-[12.5px] text-ink-2'>
                                {label}
                            </dt>
                            <dd className='font-serif font-bold text-2xl leading-none text-ink'>
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <Table minWidth={640}>
                    <thead>
                        <tr>
                            <Th>Branch</Th>
                            <Th align='right'>Alerts</Th>
                            <Th align='right'>Delivered</Th>
                            <Th align='right'>Opens</Th>
                            <Th align='right'>Open rate</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {performance.map((row) => (
                            <Tr key={`${row.college}:${row.label}`}>
                                <Td>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='text-ink'>
                                            {row.label || 'Unknown branch'}
                                        </span>
                                        <span className='text-xs text-muted'>
                                            {row.college}
                                        </span>
                                    </div>
                                </Td>
                                <Td align='right' mono>
                                    {number(row.alerts)}
                                </Td>
                                <Td align='right' mono>
                                    {number(row.delivered)}
                                </Td>
                                <Td align='right' mono>
                                    {number(row.opens)}
                                </Td>
                                <Td align='right' mono>
                                    {percent(row.openRate)}
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
            </QueryPanel>
        </ReportLayout>
    );
}
