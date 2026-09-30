import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatNumber } from '../../utils/format';
import { Panel } from '../ui';
import ChartTooltip from './ChartTooltip';
import ContentCard from './ContentCard';
import {
    AXIS_PROPS,
    BAR_CURSOR,
    BAR_RADIUS,
    GRID_PROPS,
    dayLabel,
    fullDayLabel,
    lastDays,
} from './analyticsData';

const RESOURCE_LABELS = {
    pyq: 'PYQs',
    pyqs: 'PYQs',
    note: 'Notes',
    notes: 'Notes',
    syllabus: 'Syllabus',
    video: 'Videos',
    videos: 'Videos',
};

const resourceLabel = (type) =>
    RESOURCE_LABELS[String(type).toLowerCase()] ||
    String(type || 'Other').replace(/^\w/, (c) => c.toUpperCase());

function MiniStat({ label, value, note }) {
    return (
        <div className='flex flex-col gap-2 px-[18px] py-3.5 rounded-xl bg-sunken border border-line-soft'>
            <span className='text-[12.5px] text-ink-2'>{label}</span>
            <span className='font-serif font-bold text-2xl leading-none text-ink'>
                {value}
            </span>
            {note && <span className='text-xs text-muted'>{note}</span>}
        </div>
    );
}

function BarListPanel({ title, titleId, note, rows, empty }) {
    const max = rows[0]?.count || 0;
    return (
        <Panel
            title={title}
            titleId={titleId}
            action={
                note && <span className='text-[12.5px] text-muted'>{note}</span>
            }
            bodyClassName='px-5 py-4'
        >
            {rows.length === 0 ? (
                <p className='py-6 text-center text-[13.5px] text-muted'>
                    {empty}
                </p>
            ) : (
                <ul className='flex flex-col gap-3'>
                    {rows.map((row) => (
                        <ContentCard
                            key={row.key}
                            label={row.label}
                            sublabel={row.sublabel}
                            value={formatNumber(row.count)}
                            share={row.share}
                            pct={max ? (row.count / max) * 100 : 0}
                        />
                    ))}
                </ul>
            )}
        </Panel>
    );
}

/** The in-app study assistant: who uses it and what they ask about. */
function ChatbotAnalytics({ chatbotData }) {
    if (!chatbotData) return null;

    const resources = [...(chatbotData.resourceStats || [])].sort(
        (a, b) => b.count - a.count,
    );
    const resourcesTotal = resources.reduce((sum, r) => sum + r.count, 0);
    const daily = lastDays(chatbotData.dailyUsers, 30);
    const peak = Math.max(0, ...daily.map((d) => d.value));

    return (
        <section
            aria-labelledby='assistant-title'
            className='flex flex-col gap-4 pt-2'
        >
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                <h2
                    id='assistant-title'
                    className='font-serif font-bold text-[22px] text-ink'
                >
                    Study assistant
                </h2>
                <span className='text-[13px] text-muted'>
                    The in-app chatbot · all time
                </span>
            </div>

            <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5'>
                <MiniStat
                    label='Users'
                    value={formatNumber(chatbotData.totalUsers)}
                    note={`${formatNumber(chatbotData.guestUsers)} guests · ${formatNumber(chatbotData.registeredUsers)} signed in`}
                />
                <MiniStat
                    label='Sessions'
                    value={formatNumber(chatbotData.totalSessions)}
                />
                <MiniStat
                    label='Messages per session'
                    value={Number(
                        chatbotData.averageInteractionsPerSession || 0,
                    ).toFixed(1)}
                    note='On average'
                />
                <MiniStat
                    label='Resources opened'
                    value={formatNumber(resourcesTotal)}
                    note='From links in the chat'
                />
            </div>

            <Panel
                title='Daily active users'
                titleId='dau-title'
                action={
                    <span className='text-[12.5px] text-muted'>
                        Last 30 days
                        {peak > 0 && ` · peak ${formatNumber(peak)}`}
                    </span>
                }
                bodyClassName='px-3 pt-4 pb-3'
            >
                {peak === 0 ? (
                    <p className='h-[180px] flex items-center justify-center text-[13.5px] text-muted'>
                        No one used the assistant in the last 30 days.
                    </p>
                ) : (
                    <figure
                        className='m-0 h-[180px]'
                        aria-label={`Bar chart of daily assistant users over the last 30 days, peaking at ${formatNumber(peak)}.`}
                    >
                        <ResponsiveContainer width='100%' height='100%'>
                            <BarChart
                                data={daily}
                                margin={{
                                    top: 8,
                                    right: 12,
                                    bottom: 0,
                                    left: 0,
                                }}
                            >
                                <CartesianGrid {...GRID_PROPS} />
                                <XAxis
                                    {...AXIS_PROPS}
                                    dataKey='key'
                                    tickFormatter={dayLabel}
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
                                    cursor={BAR_CURSOR}
                                    content={
                                        <ChartTooltip
                                            unit='users'
                                            formatLabel={fullDayLabel}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey='value'
                                    name='Users'
                                    fill='var(--ss-brand)'
                                    radius={BAR_RADIUS}
                                    maxBarSize={24}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </figure>
                )}
            </Panel>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 items-start'>
                <BarListPanel
                    title='Colleges asked about'
                    titleId='assistant-colleges'
                    note='Searches'
                    empty='No college searches yet.'
                    rows={(chatbotData.popularColleges || []).map(
                        (college, i) => ({
                            key: college._id || i,
                            label: college.name,
                            count: college.count,
                        }),
                    )}
                />
                <BarListPanel
                    title='Subjects asked about'
                    titleId='assistant-subjects'
                    note='Searches'
                    empty='No subject searches yet.'
                    rows={(chatbotData.popularSubjects || []).map(
                        (subject, i) => ({
                            key: subject._id || i,
                            label: subject.name,
                            sublabel: subject.code,
                            count: subject.count,
                        }),
                    )}
                />
                <BarListPanel
                    title='Resources opened'
                    titleId='assistant-resources'
                    empty='No resources opened from the chat yet.'
                    rows={resources.map((resource) => ({
                        key: resource._id,
                        label: resourceLabel(resource._id),
                        count: resource.count,
                        share: resourcesTotal
                            ? `${Math.round((resource.count / resourcesTotal) * 100)}%`
                            : undefined,
                    }))}
                />
            </div>
        </section>
    );
}

export default ChatbotAnalytics;
