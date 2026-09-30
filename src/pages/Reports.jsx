import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import DeltaBadge from '../components/DeltaBadge';
import { useStatsWithDelta } from '../hooks/useStatsWithDelta';
import api from '../utils/api';
import { formatINR, formatNumber } from '../utils/format';
import Loader from '../components/Common/Loader';
import { Alert, Button, PageHeader, Skeleton } from '../components/ui';

// Report groups. `statKey` is the /stats/stats field shown as the row's
// number; rows without one are links only (the API has no total for them).
const GROUPS = [
    {
        title: 'Money',
        rows: [
            {
                label: 'Payments',
                desc: 'Razorpay payments from students',
                href: '/reports/payments',
                statKey: 'totalPayments',
            },
            {
                label: 'Transactions',
                desc: 'Every points credit and debit',
                href: '/reports/transactions',
                statKey: 'totalTransactions',
            },
            {
                label: 'Orders',
                desc: 'PYQ, note and points top-up orders',
                href: '/reports/orders',
                statKey: 'totalOrders',
            },
            {
                label: 'Refund requests',
                desc: 'Reviewed before Razorpay refunds',
                href: '/reports/refunds',
            },
            {
                label: 'Redemptions',
                desc: 'Points withdrawn over UPI',
                href: '/reports/redemptions',
                statKey: 'totalRedemptionRequest',
            },
            {
                label: 'Subscriptions',
                desc: 'Premium plans, trials and churn',
                href: '/reports/subscriptions',
                statKey: 'totalSubscriptions',
            },
            {
                label: 'Content purchases',
                desc: 'In-app purchases of PYQs and notes',
                href: '/reports/content-purchases',
            },
        ],
    },
    {
        title: 'People & support',
        rows: [
            {
                label: 'Users',
                desc: 'Students with an account',
                href: '/reports/clients',
                statKey: 'totalClient',
            },
            {
                label: 'Contact requests',
                desc: 'Messages sent from the website',
                href: '/reports/contacts',
                statKey: 'totalContactUs',
            },
            {
                label: 'Admin team',
                desc: 'People who can open this console',
                href: '/reports/dashboard-users',
                statKey: 'totalDashboardUsers',
            },
            {
                label: 'Affiliate products',
                desc: 'Recommended products and their clicks',
                href: '/affiliate-products',
                statKey: 'totalAffiliateProduct',
            },
        ],
    },
    {
        title: 'Catalog',
        rows: [
            {
                label: 'Courses',
                desc: 'Degrees such as B.Tech and BCA',
                href: '/reports/courses',
                statKey: 'totalCourse',
            },
            {
                label: 'Branches',
                desc: 'Specialisations within a course',
                href: '/reports/branches',
                statKey: 'totalBranch',
            },
            {
                label: 'Subjects',
                desc: 'With syllabus and quick notes',
                href: '/reports/subjects',
                statKey: 'totalSubjects',
            },
        ],
    },
];

// A failed or forbidden request (moderators can't read money endpoints)
// becomes null, so that tile is left out instead of failing the page.
const settle = (request) =>
    request.then((response) => response.data?.data ?? null).catch(() => null);

/** Counts of things waiting on a person, from the same queries as Home. */
function useWaitingCounts() {
    const [state, setState] = useState({ loading: true });

    useEffect(() => {
        let cancelled = false;
        const tz = new Date().getTimezoneOffset();
        Promise.all([
            settle(
                api.get('/refunds', {
                    params: { status: 'requested', limit: 1 },
                }),
            ),
            settle(
                api.get('/refunds', {
                    params: { status: 'reviewing', limit: 1 },
                }),
            ),
            settle(
                api.get('/transactions/redemption-requests', {
                    params: {
                        status: 'pending',
                        page: 1,
                        pageSize: 1,
                        timezoneOffset: tz,
                    },
                }),
            ),
            settle(api.get('/stats/contact-us')),
            settle(
                api.get('/community-chat/reports', {
                    params: { status: 'open' },
                }),
            ),
        ]).then(([requested, reviewing, redemptions, contacts, reports]) => {
            if (cancelled) return;
            const tiles = [];
            if (requested || reviewing) {
                const count =
                    (requested?.pagination?.totalItems || 0) +
                    (reviewing?.pagination?.totalItems || 0);
                tiles.push({
                    label: 'Refund requests',
                    value: count,
                    note: count
                        ? 'Waiting for a decision'
                        : 'No refunds waiting',
                    href: '/reports/refunds',
                });
            }
            if (redemptions) {
                const count = redemptions.pagination?.total || 0;
                tiles.push({
                    label: 'UPI redemptions',
                    value: count,
                    note: count
                        ? `${formatINR(redemptions.totals?.rupees)} to pay out`
                        : 'No payouts waiting',
                    href: '/reports/redemptions',
                });
            }
            if (Array.isArray(contacts)) {
                const count = contacts.filter(
                    (c) => (c.status || 'pending') === 'pending',
                ).length;
                tiles.push({
                    label: 'Contact requests',
                    value: count,
                    note: count ? 'Not answered yet' : 'Every message answered',
                    href: '/reports/contacts',
                });
            }
            if (reports) {
                const count = (reports.reports || []).length;
                tiles.push({
                    label: 'Community reports',
                    value: count,
                    note: count
                        ? 'Messages flagged in group chats'
                        : 'No flagged messages',
                    href: '/community',
                });
            }
            setState({ loading: false, tiles });
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}

function WaitingTile({ label, value, note, href }) {
    const waiting = value > 0;
    return (
        <Link
            to={href}
            className={`flex flex-col gap-2 px-[18px] py-4 rounded-xl border transition-colors ${
                waiting
                    ? 'bg-warn-soft border-warn/30 hover:border-warn/60'
                    : 'bg-sheet border-line hover:border-line-strong'
            }`}
        >
            <span className='flex items-center gap-2'>
                <span className='flex-1 text-[13.5px] font-medium text-ink'>
                    {label}
                </span>
                <ChevronRight
                    className={`w-3.5 h-3.5 ${waiting ? 'text-warn-ink' : 'text-muted'}`}
                    aria-hidden='true'
                />
            </span>
            <span className='font-serif font-bold text-[28px] leading-none text-ink'>
                {formatNumber(value)}
            </span>
            <span
                className={`text-[12.5px] ${waiting ? 'text-warn-ink' : 'text-muted'}`}
            >
                {note}
            </span>
        </Link>
    );
}

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { deltaStats, lastViewedAt, setStats, acknowledgeStat } =
        useStatsWithDelta();
    const waiting = useWaitingCounts();

    const fetchReportStats = async () => {
        try {
            setError(null);
            const response = await api.get('/stats/stats');
            const statsData = response.data.data;
            setData(statsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError(
                'Couldn’t load the report totals. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return <Loader />;
    }

    const attention = (waiting.tiles || []).some((tile) => tile.value > 0);

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Reports'
                description='Every platform total, grouped by what you’d do next.'
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-6'
                    action={
                        <Button size='sm' onClick={fetchReportStats}>
                            Try again
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {(waiting.loading || waiting.tiles.length > 0) && (
                <section
                    aria-labelledby='waiting-title'
                    className='flex flex-col gap-3 mb-7'
                >
                    <h2
                        id='waiting-title'
                        className='flex items-center gap-2 text-[15px] font-semibold text-ink'
                    >
                        <span
                            aria-hidden='true'
                            className={`w-2 h-2 rounded-full ${
                                attention ? 'bg-warn' : 'bg-ok'
                            }`}
                        />
                        Needs action
                    </h2>
                    <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5'>
                        {waiting.loading
                            ? Array.from({ length: 4 }, (_, i) => (
                                  <div
                                      key={i}
                                      className='flex flex-col gap-3 px-[18px] py-4 rounded-xl border border-line bg-sheet'
                                  >
                                      <Skeleton className='h-3 w-28' />
                                      <Skeleton className='h-7 w-12' />
                                      <Skeleton className='h-3 w-36' />
                                  </div>
                              ))
                            : waiting.tiles.map((tile) => (
                                  <WaitingTile key={tile.label} {...tile} />
                              ))}
                    </div>
                </section>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 items-start'>
                {GROUPS.map((group) => (
                    <section
                        key={group.title}
                        aria-labelledby={`group-${group.title}`}
                        className='bg-sheet border border-line rounded-xl overflow-hidden'
                    >
                        <div className='flex items-center gap-3 px-5 py-4 border-b border-line-soft'>
                            <h2
                                id={`group-${group.title}`}
                                className='flex-1 text-[15px] font-semibold text-ink'
                            >
                                {group.title}
                            </h2>
                            <span className='eyebrow'>
                                {group.rows.length} reports
                            </span>
                        </div>
                        <ul>
                            {group.rows.map((row) => {
                                const value = row.statKey
                                    ? data?.[row.statKey]
                                    : undefined;
                                const delta = row.statKey
                                    ? deltaStats[row.statKey]
                                    : undefined;
                                return (
                                    <li
                                        key={row.label}
                                        className='border-b border-line-soft last:border-b-0'
                                    >
                                        <Link
                                            to={row.href}
                                            onClick={() => {
                                                if (row.statKey) {
                                                    acknowledgeStat(
                                                        row.statKey,
                                                    );
                                                }
                                            }}
                                            className='flex items-center gap-3 px-5 py-3 hover:bg-sunken transition-colors'
                                        >
                                            <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                                <span className='text-[13.5px] font-medium text-ink'>
                                                    {row.label}
                                                </span>
                                                <span className='text-[12.5px] text-muted'>
                                                    {row.desc}
                                                </span>
                                            </span>
                                            <span className='flex flex-col items-end gap-1'>
                                                {value !== undefined && (
                                                    <span className='font-mono text-[13px] text-ink'>
                                                        {formatNumber(value)}
                                                    </span>
                                                )}
                                                {delta !== undefined && (
                                                    <DeltaBadge
                                                        value={delta}
                                                        lastViewedAt={
                                                            lastViewedAt
                                                        }
                                                    />
                                                )}
                                            </span>
                                            <ChevronRight
                                                className='w-3.5 h-3.5 text-muted shrink-0'
                                                aria-hidden='true'
                                            />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Reports;
