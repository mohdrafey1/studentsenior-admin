import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Download, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { downloadCsv } from '../../utils/csv';
import { formatNumber } from '../../utils/format';
import Loader from '../../components/Common/Loader';
import {
    Alert,
    Button,
    Input,
    PageHeader,
    Panel,
    Segmented,
} from '../../components/ui';
import OverviewStats from '../../components/Analytics/OverviewStats';
import ContentCard from '../../components/Analytics/ContentCard';
import ChartTooltip from '../../components/Analytics/ChartTooltip';
import {
    AXIS_PROPS,
    BAR_CURSOR,
    BAR_RADIUS,
    GRID_PROPS,
    LINE_CURSOR,
    dayLabel,
    fullDayLabel,
    monthLabel,
    monthRange,
    monthTick,
    monthYearTick,
} from '../../components/Analytics/analyticsData';
import { blogEndpoints } from './blogApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
// Weekdays listed Monday first; values are the API's $dayOfWeek (1 = Sunday).
const WEEK_ORDER = [2, 3, 4, 5, 6, 7, 1];

// <input type='date'> works in local "YYYY-MM-DD"; keep dates local so the
// range means the same days the admin picked.
const toInputValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fromInputValue = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const utcKey = (date) => date.toISOString().slice(0, 10);

function AnalyticsOverview() {
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date('2024-01-01'));
    const [endDate, setEndDate] = useState(new Date());
    const [grain, setGrain] = useState('month');

    useEffect(() => {
        const controller = new AbortController();
        const fetchReport = async () => {
            setLoading(true);
            setError('');
            try {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                const response = await api.get(blogEndpoints.analytics, {
                    signal: controller.signal,
                    params: {
                        start: startDate.toISOString(),
                        end: end.toISOString(),
                    },
                });
                setReport(response.data.data);
            } catch (err) {
                if (!controller.signal.aborted)
                    setError(
                        err.response?.data?.message ||
                            'Couldn’t load blog analytics. Check your connection and try again.',
                    );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void fetchReport();
        return () => controller.abort();
    }, [startDate, endDate, revision]);

    const totalBlogs = report?.totals?.[0]?.count || 0;
    const totalReads = report?.totals?.[0]?.reads || 0;
    const avgReads = totalBlogs ? (totalReads / totalBlogs).toFixed(2) : 0;
    const monthlyUploads = Object.fromEntries(
        (report?.months || []).map((row) => [row._id, row.count]),
    );
    const dailyActivity = Object.fromEntries(
        (report?.days || []).map((row) => [row._id, row.count]),
    );
    const dayFrequency = Object.fromEntries(
        (report?.weekdays || []).map((row) => [row._id, row.count]),
    );
    const sortedAuthors = (report?.authors || []).map((row) => [
        row._id || 'Unknown',
        { blogs: row.blogs, reads: row.reads },
    ]);
    const topBlogs = report?.topBlogs || [];

    // Growth compares the two latest months that have posts.
    const months = Object.keys(monthlyUploads).sort();
    const lastMonth = months.at(-1);
    const prevMonth = months.at(-2);
    const growthRate =
        lastMonth && prevMonth
            ? ((monthlyUploads[lastMonth] - monthlyUploads[prevMonth]) /
                  monthlyUploads[prevMonth]) *
              100
            : null;

    const bestDay = Object.entries(dayFrequency).sort((a, b) => b[1] - a[1])[0];

    // Series with the empty months and days filled in, so gaps read as zero.
    const monthSeries = useMemo(
        () =>
            monthRange(
                toInputValue(startDate).slice(0, 7),
                toInputValue(endDate).slice(0, 7),
            ).map((key) => ({ key, value: monthlyUploads[key] || 0 })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [report, startDate, endDate],
    );
    const daySeries = useMemo(() => {
        const points = [];
        const first = new Date(
            Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
            ),
        );
        const last = new Date(
            Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate(),
            ),
        );
        for (let t = first.getTime(); t <= last.getTime(); t += 864e5) {
            const key = utcKey(new Date(t));
            points.push({ key, value: dailyActivity[key] || 0 });
        }
        return points;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [report, startDate, endDate]);

    // Export CSV
    const exportCSV = () =>
        downloadCsv(
            'blog-analytics.csv',
            [
                { label: 'totalBlogs', value: () => totalBlogs },
                { label: 'totalReads', value: () => totalReads },
                { label: 'averageReads', value: () => avgReads },
                { label: 'start', value: () => startDate.toISOString() },
                { label: 'end', value: () => endDate.toISOString() },
            ],
            [{}],
        );

    if (loading && !report && !error) return <Loader />;

    const weekdayTotal = Object.values(dayFrequency).reduce(
        (sum, n) => sum + n,
        0,
    );
    const weekdayMax = Math.max(0, ...Object.values(dayFrequency));
    const authorMax = sortedAuthors[0]?.[1].reads || 0;

    return (
        <div>
            <PageHeader
                title='Blog analytics'
                description='Posts and reads on blog.studentsenior.com, for posts created in the dates you pick.'
                actions={
                    <>
                        <div className='flex items-center gap-2'>
                            <label
                                htmlFor='blog-from'
                                className='text-[13px] text-muted'
                            >
                                From
                            </label>
                            <Input
                                id='blog-from'
                                type='date'
                                value={toInputValue(startDate)}
                                max={toInputValue(endDate)}
                                onChange={(e) =>
                                    e.target.value &&
                                    setStartDate(fromInputValue(e.target.value))
                                }
                                className='w-auto'
                            />
                            <label
                                htmlFor='blog-to'
                                className='text-[13px] text-muted'
                            >
                                to
                            </label>
                            <Input
                                id='blog-to'
                                type='date'
                                value={toInputValue(endDate)}
                                min={toInputValue(startDate)}
                                onChange={(e) =>
                                    e.target.value &&
                                    setEndDate(fromInputValue(e.target.value))
                                }
                                className='w-auto'
                            />
                        </div>
                        <Button
                            icon={Download}
                            onClick={exportCSV}
                            disabled={!report}
                        >
                            Export CSV
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-6'
                    action={
                        <Button
                            size='sm'
                            onClick={() => setRevision((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {report && (
                <div
                    className={`flex flex-col gap-6 transition-opacity ${
                        loading ? 'opacity-60' : ''
                    }`}
                    aria-busy={loading}
                >
                    <OverviewStats
                        items={[
                            {
                                label: 'Posts',
                                value: formatNumber(totalBlogs),
                                delta:
                                    growthRate === null
                                        ? undefined
                                        : Math.round(growthRate),
                                note:
                                    growthRate === null
                                        ? 'Created in this range'
                                        : `${monthLabel(lastMonth)} against ${monthLabel(prevMonth)}`,
                            },
                            {
                                label: 'Reads',
                                value: formatNumber(totalReads),
                                note: 'Across these posts',
                            },
                            {
                                label: 'Average reads per post',
                                value: Number(avgReads).toLocaleString(
                                    'en-IN',
                                    { maximumFractionDigits: 1 },
                                ),
                                note: 'Drafts included',
                            },
                            {
                                label: 'Busiest weekday',
                                value: bestDay
                                    ? DAY_NAMES[bestDay[0] - 1]
                                    : '—',
                                note: bestDay
                                    ? `${Math.round((bestDay[1] / weekdayTotal) * 100)}% of posts were created then`
                                    : 'No posts in this range',
                            },
                        ]}
                    />

                    <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-5 items-stretch'>
                        <Panel
                            title={
                                grain === 'month'
                                    ? 'Posts per month'
                                    : 'Posts per day'
                            }
                            titleId='posts-title'
                            action={
                                <Segmented
                                    label='Group posts by'
                                    value={grain}
                                    onChange={setGrain}
                                    options={[
                                        { value: 'month', label: 'Month' },
                                        { value: 'day', label: 'Day' },
                                    ]}
                                />
                            }
                            className='flex flex-col'
                            bodyClassName='relative flex-1 min-h-[264px]'
                        >
                            {totalBlogs === 0 ? (
                                <p className='absolute inset-0 flex items-center justify-center px-6 text-center text-[13.5px] text-muted'>
                                    No posts were created in this range.
                                </p>
                            ) : (
                                <figure
                                    className='absolute inset-x-3 top-4 bottom-3 m-0'
                                    aria-label={`${grain === 'month' ? 'Bar' : 'Line'} chart of posts created per ${grain}, ${formatNumber(totalBlogs)} in total.`}
                                >
                                    <ResponsiveContainer
                                        width='100%'
                                        height='100%'
                                    >
                                        {grain === 'month' ? (
                                            <BarChart
                                                data={monthSeries}
                                                margin={{
                                                    top: 8,
                                                    right: 12,
                                                    bottom: 0,
                                                    left: 0,
                                                }}
                                            >
                                                <CartesianGrid
                                                    {...GRID_PROPS}
                                                />
                                                <XAxis
                                                    {...AXIS_PROPS}
                                                    dataKey='key'
                                                    tickFormatter={
                                                        monthSeries.length > 12
                                                            ? monthYearTick
                                                            : monthTick
                                                    }
                                                    minTickGap={16}
                                                    tickMargin={8}
                                                />
                                                <YAxis
                                                    {...AXIS_PROPS}
                                                    axisLine={false}
                                                    allowDecimals={false}
                                                    width={36}
                                                />
                                                <Tooltip
                                                    cursor={BAR_CURSOR}
                                                    content={
                                                        <ChartTooltip
                                                            unit='posts'
                                                            formatLabel={
                                                                monthLabel
                                                            }
                                                        />
                                                    }
                                                />
                                                <Bar
                                                    dataKey='value'
                                                    name='Posts'
                                                    fill='var(--ss-brand)'
                                                    radius={BAR_RADIUS}
                                                    maxBarSize={34}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        ) : (
                                            <LineChart
                                                data={daySeries}
                                                margin={{
                                                    top: 8,
                                                    right: 20,
                                                    bottom: 0,
                                                    left: 0,
                                                }}
                                            >
                                                <CartesianGrid
                                                    {...GRID_PROPS}
                                                />
                                                <XAxis
                                                    {...AXIS_PROPS}
                                                    dataKey='key'
                                                    tickFormatter={dayLabel}
                                                    minTickGap={32}
                                                    tickMargin={8}
                                                />
                                                <YAxis
                                                    {...AXIS_PROPS}
                                                    axisLine={false}
                                                    allowDecimals={false}
                                                    width={36}
                                                />
                                                <Tooltip
                                                    cursor={LINE_CURSOR}
                                                    content={
                                                        <ChartTooltip
                                                            unit='posts'
                                                            formatLabel={
                                                                fullDayLabel
                                                            }
                                                        />
                                                    }
                                                />
                                                <Line
                                                    type='linear'
                                                    dataKey='value'
                                                    name='Posts'
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
                                        )}
                                    </ResponsiveContainer>
                                </figure>
                            )}
                        </Panel>

                        <Panel
                            title='Posts by weekday'
                            titleId='weekday-title'
                            action={
                                <span className='text-[12.5px] text-muted'>
                                    Day created
                                </span>
                            }
                            bodyClassName='px-5 py-4'
                        >
                            {weekdayTotal === 0 ? (
                                <p className='py-8 text-center text-[13.5px] text-muted'>
                                    No posts in this range.
                                </p>
                            ) : (
                                <ul className='flex flex-col gap-3'>
                                    {WEEK_ORDER.map((day) => {
                                        const count = dayFrequency[day] || 0;
                                        return (
                                            <ContentCard
                                                key={day}
                                                label={DAYS[day - 1]}
                                                value={formatNumber(count)}
                                                share={`${Math.round((count / weekdayTotal) * 100)}%`}
                                                pct={
                                                    weekdayMax
                                                        ? (count / weekdayMax) *
                                                          100
                                                        : 0
                                                }
                                            />
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'>
                        <Panel
                            title='Most read posts'
                            titleId='top-posts-title'
                        >
                            {topBlogs.length === 0 ? (
                                <p className='px-5 py-8 text-center text-[13.5px] text-muted'>
                                    No posts in this range.
                                </p>
                            ) : (
                                <ol>
                                    {topBlogs.map((b, index) => (
                                        <li
                                            key={b._id}
                                            className='border-b border-line-soft last:border-b-0'
                                        >
                                            <a
                                                href={`https://blog.studentsenior.com/blog/post/${b.slug}`}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='group flex items-center gap-3.5 px-5 py-3 hover:bg-sunken transition-colors'
                                            >
                                                <span className='w-4 font-mono text-xs text-muted'>
                                                    {index + 1}
                                                </span>
                                                <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                                    <span className='truncate text-[13.5px] font-medium text-ink group-hover:underline'>
                                                        {b.title}
                                                    </span>
                                                    {b.author && (
                                                        <span className='text-xs text-muted'>
                                                            {b.author}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className='font-mono text-[13px] text-ink'>
                                                    {formatNumber(
                                                        b.total_reads,
                                                    )}
                                                </span>
                                                <ExternalLink
                                                    className='w-3.5 h-3.5 text-muted shrink-0'
                                                    aria-hidden='true'
                                                />
                                                <span className='sr-only'>
                                                    (opens in a new tab)
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </Panel>

                        <Panel
                            title='Authors by reads'
                            titleId='authors-title'
                            action={
                                <span className='text-[12.5px] text-muted'>
                                    Posts · reads
                                </span>
                            }
                            bodyClassName='px-5 py-4'
                        >
                            {sortedAuthors.length === 0 ? (
                                <p className='py-8 text-center text-[13.5px] text-muted'>
                                    No posts in this range.
                                </p>
                            ) : (
                                <ul className='flex flex-col gap-3.5'>
                                    {sortedAuthors.map(([author, data]) => (
                                        <ContentCard
                                            key={author}
                                            label={author}
                                            extra={`${formatNumber(data.blogs)} ${data.blogs === 1 ? 'post' : 'posts'}`}
                                            value={formatNumber(data.reads)}
                                            pct={
                                                authorMax
                                                    ? (data.reads / authorMax) *
                                                      100
                                                    : 0
                                            }
                                        />
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalyticsOverview;
