import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    CalendarDays,
    Crown,
    Gift,
    GraduationCap,
    Mail,
    Phone,
    ShieldBan,
    ShieldCheck,
    UserX,
} from 'lucide-react';
import api from '../../utils/api';
import UserActivity from '../../components/Analytics/v2/UserActivity';
import AnalyticsAccess from '../../components/Analytics/v2/AnalyticsAccess';
import { useColleges } from '../../context/CollegeContext';
import {
    formatDate,
    formatDateTime,
    formatNumber,
    formatShortDateTime,
} from '../../utils/format';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Common/Loader';
import {
    Avatar,
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    SkeletonRows,
    StatusBadge,
    Tabs,
} from '../../components/ui';
import { BonusDialog, PremiumDialog } from './UserActionDialogs';
import {
    CONTENT_TABS,
    EMPTY_CONTENT,
    TRANSACTION_LABELS,
    describeItem,
    itemViews,
    pointsWorth,
} from './userDetailHelpers';

const WalletCell = ({ label, points, note, className = '' }) => (
    <div className={`flex flex-col gap-2 px-5 py-[18px] ${className}`}>
        <span className='text-[13px] text-ink-2'>{label}</span>
        <span className='font-serif font-bold text-[28px] leading-none text-ink'>
            {formatNumber(points)}{' '}
            <span className='font-sans text-sm font-medium text-muted'>
                pts
            </span>
        </span>
        <span className='text-[12.5px] text-muted'>{note}</span>
    </div>
);

const UserDetail = () => {
    const { userId } = useParams();
    const { colleges } = useColleges();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userContent, setUserContent] = useState(EMPTY_CONTENT);
    const [contentLoading, setContentLoading] = useState(true);
    const [contentError, setContentError] = useState(false);
    const [tab, setTab] = useState('notes');
    const [activity, setActivity] = useState({
        loading: true,
        error: false,
        items: [],
    });
    const [dialog, setDialog] = useState(null); // 'bonus' | 'premium'
    const [confirm, setConfirm] = useState(null);
    const [showRawData, setShowRawData] = useState(false);

    const fetchUser = async () => {
        try {
            setLoading(true);
            // There is no single-user endpoint; find the user in the full list.
            const response = await api.get(`/user/users`);
            const foundUser = response.data.data.find((u) => u._id === userId);
            if (foundUser) {
                setUser(foundUser);
                setError(null);
            } else {
                setError('This user doesn’t exist or was deleted.');
            }
        } catch (e) {
            console.error('Error fetching user:', e);
            setError(
                'Couldn’t load this user. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchUserContent = async () => {
        try {
            setContentLoading(true);
            setContentError(false);
            const response = await api.get(`/user/content/${user._id}`);
            const data = { ...EMPTY_CONTENT, ...(response.data.data || {}) };
            setUserContent(data);
            // Open the first tab that has something in it.
            const first = CONTENT_TABS.find((t) => data[t.key]?.length);
            setTab(first ? first.key : 'notes');
        } catch (e) {
            console.error('Error fetching user content:', e);
            setContentError(true);
        } finally {
            setContentLoading(false);
        }
    };

    // Recent wallet transactions. The transactions list searches by username,
    // so keep only rows that belong to this user.
    const fetchActivity = async () => {
        setActivity((prev) => ({ ...prev, loading: true, error: false }));
        try {
            const response = await api.get('/transactions/all', {
                params: {
                    search: user.username,
                    pageSize: 50,
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                },
            });
            const items = (response.data.data?.items || []).filter(
                (t) => (t.user?._id || t.user) === user._id,
            );
            setActivity({ loading: false, error: false, items });
        } catch (e) {
            console.error('Error fetching transactions:', e);
            setActivity({ loading: false, error: true, items: [] });
        }
    };

    useEffect(() => {
        fetchUser();
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (user?._id) {
            fetchUserContent();
            fetchActivity();
        }
    }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) return <Loader />;

    if (error || !user) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={UserX}
                        tone='error'
                        title='User not found'
                        description={error}
                        action={
                            <div className='flex gap-2'>
                                <Button onClick={fetchUser}>Try again</Button>
                                <Button to='/users'>Back to users</Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const handle = `@${user.username}`;

    const askBlock = () =>
        setConfirm({
            title: `Block ${handle}?`,
            message:
                'They can’t use their StudentSenior account until you unblock them.',
            confirmText: 'Block user',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    const response = await api.patch(
                        `/user/users/${user._id}/block`,
                    );
                    setUser(response.data.data);
                    toast.success('User blocked');
                } catch (e) {
                    console.error('Error blocking user:', e);
                    toast.error('Couldn’t block the user. Try again.');
                }
            },
        });

    const askUnblock = () =>
        setConfirm({
            title: `Unblock ${handle}?`,
            message: 'They can use their account again straight away.',
            confirmText: 'Unblock user',
            variant: 'info',
            onConfirm: async () => {
                try {
                    const response = await api.patch(
                        `/user/users/${user._id}/unblock`,
                    );
                    setUser(response.data.data);
                    toast.success('User unblocked');
                } catch (e) {
                    console.error('Error unblocking user:', e);
                    toast.error('Couldn’t unblock the user. Try again.');
                }
            },
        });

    const premiumEnd = user.premiumExpiryDate
        ? new Date(user.premiumExpiryDate)
        : null;
    const premiumActive =
        user.isPremium && premiumEnd && premiumEnd > new Date();

    const balance = Number(user.wallet?.currentBalance || 0);
    const earned = Number(user.wallet?.totalEarning || 0);
    const withdrawn = Number(user.wallet?.totalWithdrawal || 0);

    // Contribution totals across every kind of upload.
    const allItems = CONTENT_TABS.flatMap((t) => userContent[t.key] || []);
    const byStatus = allItems.reduce(
        (acc, item) => {
            const status = item.submissionStatus || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { approved: 0, pending: 0, rejected: 0 },
    );
    const totalViews = allItems.reduce((sum, item) => sum + itemViews(item), 0);

    const collegeSlug = (id) => colleges.find((c) => c._id === id)?.slug;
    const activeTab =
        CONTENT_TABS.find((t) => t.key === tab) || CONTENT_TABS[0];
    const tabItems = userContent[activeTab.key] || [];

    const academic = user.academicDetails || {};

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <div className='flex items-start gap-4 sm:gap-5'>
                <Avatar
                    name={user.username}
                    src={user.profilePicture}
                    size='lg'
                    className='mt-1 font-serif'
                />
                <div className='flex-1 min-w-0'>
                    <PageHeader
                        eyebrow='Student'
                        badge={
                            <>
                                {user.blocked ? (
                                    <StatusBadge tone='bad'>
                                        Blocked
                                    </StatusBadge>
                                ) : (
                                    <StatusBadge tone='ok'>Active</StatusBadge>
                                )}
                                {premiumActive && (
                                    <StatusBadge tone='info'>
                                        Premium until {formatDate(premiumEnd)}
                                    </StatusBadge>
                                )}
                                {user.isPremium && !premiumActive && (
                                    <StatusBadge tone='neutral'>
                                        Premium ended
                                        {premiumEnd
                                            ? ` ${formatDate(premiumEnd)}`
                                            : ''}
                                    </StatusBadge>
                                )}
                            </>
                        }
                        title={user.username}
                        meta={
                            <ul className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-2'>
                                <li className='inline-flex items-center gap-1.5 min-w-0'>
                                    <Mail
                                        className='w-[15px] h-[15px] text-muted shrink-0'
                                        aria-hidden='true'
                                    />
                                    <span className='sr-only'>Email: </span>
                                    <span className='truncate'>
                                        {user.email}
                                    </span>
                                </li>
                                <li className='inline-flex items-center gap-1.5'>
                                    <Phone
                                        className='w-[15px] h-[15px] text-muted'
                                        aria-hidden='true'
                                    />
                                    <span className='sr-only'>Phone: </span>
                                    {user.phone || 'No phone number'}
                                </li>
                                <li className='inline-flex items-center gap-1.5'>
                                    <GraduationCap
                                        className='w-[15px] h-[15px] text-muted'
                                        aria-hidden='true'
                                    />
                                    <span className='sr-only'>College: </span>
                                    {user.college || 'No college given'}
                                </li>
                                <li className='inline-flex items-center gap-1.5'>
                                    <CalendarDays
                                        className='w-[15px] h-[15px] text-muted'
                                        aria-hidden='true'
                                    />
                                    Joined {formatDate(user.createdAt)}
                                </li>
                            </ul>
                        }
                        actions={
                            <>
                                <Button
                                    icon={Gift}
                                    onClick={() => setDialog('bonus')}
                                >
                                    Give bonus points
                                </Button>
                                <Button
                                    icon={Crown}
                                    onClick={() => setDialog('premium')}
                                >
                                    Grant premium
                                </Button>
                                {user.blocked ? (
                                    <Button
                                        icon={ShieldCheck}
                                        onClick={askUnblock}
                                    >
                                        Unblock
                                    </Button>
                                ) : (
                                    <Button
                                        variant='danger'
                                        icon={ShieldBan}
                                        onClick={askBlock}
                                    >
                                        Block
                                    </Button>
                                )}
                            </>
                        }
                    />
                </div>
            </div>

            <AnalyticsAccess silent>
                <UserActivity userId={userId} />
            </AnalyticsAccess>

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 mb-5'>
                <Panel
                    title='Wallet'
                    titleId='wallet-title'
                    action={
                        <span className='text-[12.5px] text-muted'>
                            5 pts = ₹1
                        </span>
                    }
                    bodyClassName='grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line-soft'
                >
                    <WalletCell
                        label='Current balance'
                        points={balance}
                        note={`Worth ${pointsWorth(balance)}`}
                    />
                    <WalletCell
                        label='Total earned'
                        points={earned}
                        note={`Worth ${pointsWorth(earned)}`}
                    />
                    <WalletCell
                        label='Spent or redeemed'
                        points={withdrawn}
                        note={`Worth ${pointsWorth(withdrawn)}`}
                    />
                </Panel>

                <Panel
                    title='Contributions'
                    titleId='contrib-title'
                    bodyClassName='px-5 py-4'
                >
                    {contentLoading ? (
                        <SkeletonRows rows={2} className='-mx-5 -my-4' />
                    ) : contentError ? (
                        <p className='text-[13.5px] text-muted'>
                            Couldn’t load uploads.
                        </p>
                    ) : allItems.length === 0 ? (
                        <p className='text-[13.5px] text-muted'>
                            {handle} hasn’t uploaded anything yet.
                        </p>
                    ) : (
                        <div className='flex flex-col gap-3.5'>
                            <div
                                className='flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-line-soft'
                                aria-hidden='true'
                            >
                                <span
                                    className='bg-ok'
                                    style={{ flexGrow: byStatus.approved }}
                                />
                                <span
                                    className='bg-warn'
                                    style={{ flexGrow: byStatus.pending }}
                                />
                                <span
                                    className='bg-bad'
                                    style={{ flexGrow: byStatus.rejected }}
                                />
                            </div>
                            <dl className='grid grid-cols-2 gap-y-2.5 gap-x-3 text-[13px]'>
                                {[
                                    ['Approved', byStatus.approved, 'bg-ok'],
                                    ['Pending', byStatus.pending, 'bg-warn'],
                                    ['Rejected', byStatus.rejected, 'bg-bad'],
                                ].map(([label, count, dot]) => (
                                    <div
                                        key={label}
                                        className='flex items-center gap-2'
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${dot}`}
                                            aria-hidden='true'
                                        />
                                        <dt>{label}</dt>
                                        <dd className='font-mono text-[12.5px] font-semibold'>
                                            {formatNumber(count)}
                                        </dd>
                                    </div>
                                ))}
                                <div className='flex items-center gap-2 text-ink-2'>
                                    <dt>Total views</dt>
                                    <dd className='font-mono text-[12.5px] font-semibold text-ink'>
                                        {formatNumber(totalViews)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 items-start'>
                <section
                    aria-labelledby='uploads-title'
                    className='bg-sheet border border-line rounded-xl overflow-hidden'
                >
                    <h2
                        id='uploads-title'
                        className='px-5 pt-4 pb-1 text-[15px] font-semibold text-ink'
                    >
                        Uploads
                    </h2>
                    <Tabs
                        label='Upload type'
                        className='px-5'
                        value={tab}
                        onChange={setTab}
                        items={CONTENT_TABS.map((t) => ({
                            value: t.key,
                            label: t.label,
                            count: contentLoading
                                ? undefined
                                : (userContent[t.key] || []).length,
                        }))}
                    />
                    {contentLoading ? (
                        <SkeletonRows rows={4} />
                    ) : contentError ? (
                        <EmptyState
                            tone='error'
                            title='Couldn’t load uploads'
                            description='Check your connection and try again.'
                            action={
                                <Button size='sm' onClick={fetchUserContent}>
                                    Try again
                                </Button>
                            }
                        />
                    ) : tabItems.length === 0 ? (
                        <div className='flex flex-col items-center gap-1.5 px-5 py-10 text-center'>
                            <span className='text-[13.5px] font-medium text-ink'>
                                Nothing here yet
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                {handle} hasn’t posted any {activeTab.noun}.
                            </span>
                        </div>
                    ) : (
                        <ul>
                            {tabItems.map((item) => {
                                const { title, meta } = describeItem(
                                    activeTab.key,
                                    item,
                                );
                                const slug = collegeSlug(item.college);
                                const views = itemViews(item);
                                return (
                                    <li
                                        key={item._id}
                                        className='flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 px-5 py-3 border-b border-line-soft last:border-b-0'
                                    >
                                        <div className='flex-1 basis-full sm:basis-auto min-w-0 flex flex-col gap-0.5'>
                                            {slug ? (
                                                <Link
                                                    to={`/${slug}/${activeTab.path}/${item._id}`}
                                                    className='text-[13.5px] font-medium text-ink hover:underline truncate'
                                                >
                                                    {title}
                                                </Link>
                                            ) : (
                                                <span className='text-[13.5px] font-medium text-ink truncate'>
                                                    {title}
                                                </span>
                                            )}
                                            <span className='text-[12.5px] text-muted truncate'>
                                                {meta}
                                            </span>
                                        </div>
                                        <span className='sm:w-24 sm:text-right font-mono text-[12.5px] text-ink-2 whitespace-nowrap'>
                                            {views
                                                ? `${formatNumber(views)} views`
                                                : 'No views'}
                                        </span>
                                        <span className='flex gap-1 sm:w-[104px]'>
                                            <StatusBadge
                                                status={item.submissionStatus}
                                            />
                                            {item.deleted && (
                                                <StatusBadge tone='outline'>
                                                    Deleted
                                                </StatusBadge>
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <div className='flex flex-col gap-5 min-w-0'>
                    <Panel
                        title='Points activity'
                        titleId='points-title'
                        action={
                            <Link
                                to={`/reports/transactions?search=${encodeURIComponent(user.username)}`}
                                className='text-[13px] font-medium text-link hover:underline'
                            >
                                All transactions
                            </Link>
                        }
                        bodyClassName='px-5'
                    >
                        {activity.loading ? (
                            <SkeletonRows rows={3} className='-mx-5' />
                        ) : activity.error ? (
                            <p className='py-4 text-[13.5px] text-muted'>
                                Couldn’t load points activity.{' '}
                                <button
                                    type='button'
                                    onClick={fetchActivity}
                                    className='font-medium text-link hover:underline cursor-pointer'
                                >
                                    Try again
                                </button>
                            </p>
                        ) : activity.items.length === 0 ? (
                            <p className='py-4 text-[13.5px] text-muted'>
                                No points earned or spent yet.
                            </p>
                        ) : (
                            <ul>
                                {activity.items.slice(0, 6).map((t) => {
                                    const points = Number(t.points || 0);
                                    return (
                                        <li
                                            key={t._id}
                                            className='flex items-center gap-3 py-2.5 border-b border-line-soft last:border-b-0'
                                        >
                                            <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                                <span className='text-[13px] text-ink truncate'>
                                                    {t.description ||
                                                        TRANSACTION_LABELS[
                                                            t.type
                                                        ] ||
                                                        t.type}
                                                </span>
                                                <span className='text-xs text-muted'>
                                                    {TRANSACTION_LABELS[
                                                        t.type
                                                    ] || t.type}{' '}
                                                    ·{' '}
                                                    {formatShortDateTime(
                                                        t.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                            <span
                                                className={`font-mono text-[13px] font-medium whitespace-nowrap ${
                                                    points < 0
                                                        ? 'text-bad-ink'
                                                        : 'text-ok-ink'
                                                }`}
                                            >
                                                {points < 0 ? '−' : '+'}
                                                {formatNumber(Math.abs(points))}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    <Panel
                        title='Details'
                        titleId='details-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <MetaList
                            labelWidth={104}
                            items={[
                                { label: 'Course', value: academic.course },
                                { label: 'Branch', value: academic.branch },
                                { label: 'Semester', value: academic.semester },
                                {
                                    label: 'Premium',
                                    value: premiumActive
                                        ? `Until ${formatDate(premiumEnd)}`
                                        : 'No',
                                },
                                user.trialClaimedAt && {
                                    label: 'Trial claimed',
                                    value: formatDate(user.trialClaimedAt),
                                },
                                {
                                    label: 'Joined',
                                    value: formatDateTime(user.createdAt),
                                },
                                {
                                    label: 'Updated',
                                    value: formatDateTime(user.updatedAt),
                                },
                                { label: 'ID', value: user._id, mono: true },
                            ]}
                        />
                        <button
                            type='button'
                            aria-expanded={showRawData}
                            onClick={() => setShowRawData((v) => !v)}
                            className='self-start text-[13px] font-medium text-link hover:underline cursor-pointer'
                        >
                            {showRawData ? 'Hide raw data' : 'Show raw data'}
                        </button>
                        {showRawData && (
                            <pre className='max-h-80 overflow-auto p-3 rounded-lg bg-sunken font-mono text-[11.5px] leading-relaxed text-ink-2'>
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        )}
                    </Panel>
                </div>
            </div>

            {dialog === 'bonus' && (
                <BonusDialog
                    user={user}
                    onClose={() => setDialog(null)}
                    onGiven={(updated) => {
                        if (updated) setUser(updated);
                        setDialog(null);
                        fetchActivity();
                    }}
                />
            )}
            {dialog === 'premium' && (
                <PremiumDialog
                    user={user}
                    onClose={() => setDialog(null)}
                    onGranted={(updated) => {
                        if (updated) setUser(updated);
                        setDialog(null);
                    }}
                />
            )}

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant={confirm?.variant}
            />
        </div>
    );
};

export default UserDetail;
