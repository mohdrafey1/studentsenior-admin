import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flag, MessagesSquare, Trash2, Users } from 'lucide-react';
import api from '../../utils/api';
import {
    formatNumber,
    formatShortDate,
    formatShortDateTime,
} from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import {
    Alert,
    Button,
    EmptyState,
    SkeletonRows,
    PageHeader,
    StatusBadge,
    Table,
    Tabs,
    Td,
    Th,
    Tr,
} from '../../components/ui';

const GROUPS_PER_PAGE = 20;

// Report statuses from the API: open → reviewed (kept) or actioned (message deleted).
const REPORT_STATUS = {
    open: { tone: 'warn', label: 'Open' },
    reviewed: { tone: 'outline', label: 'Kept' },
    actioned: { tone: 'bad', label: 'Message deleted' },
};

const ReportStatus = ({ status }) => {
    const meta = REPORT_STATUS[status] || REPORT_STATUS.open;
    return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
};

const Eyebrow = ({ children }) => <span className='eyebrow'>{children}</span>;

const CommunityModeration = () => {
    const [tab, setTab] = useState('reports');
    const [groups, setGroups] = useState([]);
    const [groupsTotal, setGroupsTotal] = useState(null);
    const [groupsPage, setGroupsPage] = useState(1);
    const [reports, setReports] = useState([]);
    const [handled, setHandled] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [busyId, setBusyId] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const fetchGroups = async (page = groupsPage) => {
        setGroupsLoading(true);
        try {
            const res = await api.get('/community-chat/groups', {
                params: { page, limit: GROUPS_PER_PAGE },
            });
            if (res.data.success) {
                setGroups(res.data.data.groups || []);
                setGroupsTotal(
                    res.data.data.pagination?.totalItems ??
                        (res.data.data.groups || []).length,
                );
            }
            setErrors((prev) => ({ ...prev, groups: false }));
        } catch {
            setErrors((prev) => ({ ...prev, groups: true }));
        } finally {
            setGroupsLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/community-chat/reports?status=open');
            if (res.data.success) setReports(res.data.data.reports || []);
            setErrors((prev) => ({ ...prev, reports: false }));
        } catch {
            setErrors((prev) => ({ ...prev, reports: true }));
        }
    };

    // Reviewed and actioned reports, for the "Recently handled" list.
    const fetchHandled = async () => {
        try {
            const res = await api.get('/community-chat/reports?status=all');
            if (res.data.success) {
                setHandled(
                    (res.data.data.reports || [])
                        .filter((r) => r.status !== 'open')
                        .sort(
                            (a, b) =>
                                new Date(b.updatedAt || b.createdAt) -
                                new Date(a.updatedAt || a.createdAt),
                        )
                        .slice(0, 10),
                );
            }
        } catch {
            // Optional history; the open reports still work without it.
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchGroups(1), fetchReports(), fetchHandled()]).finally(
            () => setLoading(false),
        );
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const deleteGroup = (group) =>
        setConfirm({
            title: `Delete ${group.name}?`,
            message:
                'Members lose access to the group and its messages straight away. This can’t be undone.',
            confirmText: 'Delete group',
            onConfirm: async () => {
                try {
                    await api.delete(`/community-chat/groups/${group._id}`);
                    toast.success('Group deleted');
                    setGroups((prev) =>
                        prev.filter((g) => g._id !== group._id),
                    );
                    setGroupsTotal((n) => (n ? n - 1 : n));
                } catch {
                    toast.error('Couldn’t delete the group. Try again.');
                }
            },
        });

    const deleteMessage = (report) =>
        setConfirm({
            title: 'Delete this message?',
            message:
                'It disappears from the group for everyone, and every report about it is closed.',
            confirmText: 'Delete message',
            onConfirm: async () => {
                setBusyId(report._id);
                try {
                    await api.delete(
                        `/community-chat/messages/${report.message._id}`,
                    );
                    toast.success('Message deleted');
                    await Promise.all([fetchReports(), fetchHandled()]);
                } catch {
                    toast.error('Couldn’t delete the message. Try again.');
                } finally {
                    setBusyId(null);
                }
            },
        });

    const resolveReport = async (report) => {
        setBusyId(report._id);
        try {
            await api.patch(`/community-chat/reports/${report._id}/resolve`);
            toast.success('Report closed, message kept');
            setReports((prev) => prev.filter((r) => r._id !== report._id));
            fetchHandled();
        } catch {
            toast.error('Couldn’t close the report. Try again.');
        } finally {
            setBusyId(null);
        }
    };

    const tabs = [
        {
            value: 'reports',
            label: 'Open reports',
            count: loading ? undefined : reports.length,
            attention: reports.length > 0,
        },
        {
            value: 'groups',
            label: 'Groups',
            count: groupsTotal ?? undefined,
        },
    ];

    const reportCard = (r) => {
        const message = r.message;
        const senderId = message?.sender?._id || message?.sender;
        const busy = busyId === r._id;
        return (
            <article
                key={r._id}
                className='bg-sheet border border-line rounded-xl overflow-hidden'
            >
                <div className='flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-line-soft'>
                    <span
                        className='w-9 h-9 rounded-[10px] bg-ground text-ink-2 flex items-center justify-center shrink-0'
                        aria-hidden='true'
                    >
                        <MessagesSquare className='w-4 h-4' />
                    </span>
                    <span className='flex-1 min-w-[160px] text-[14.5px] font-semibold text-ink'>
                        {r.group?.name || 'Deleted group'}
                    </span>
                    <ReportStatus status={r.status} />
                    <span className='text-[12.5px] text-muted'>
                        Reported {relativeTime(r.createdAt)}
                    </span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 p-5'>
                    <div className='flex flex-col gap-2.5 min-w-0'>
                        <Eyebrow>Flagged message</Eyebrow>
                        <div className='flex gap-3 px-4 py-3.5 rounded-xl bg-sunken border border-line-soft'>
                            <div className='flex flex-col gap-1 min-w-0'>
                                <span className='text-[13px] text-muted'>
                                    <span className='font-semibold text-ink'>
                                        {message?.isAnonymous
                                            ? 'Anonymous member'
                                            : 'Member'}
                                    </span>
                                    {message?.createdAt &&
                                        ` · ${formatShortDateTime(message.createdAt)}`}
                                </span>
                                <p className='text-sm leading-relaxed text-ink break-words'>
                                    {message?.content ||
                                        'This message is no longer available.'}
                                </p>
                            </div>
                        </div>
                        {message?.deleted && (
                            <span className='text-[12.5px] text-muted'>
                                The message was already deleted.
                            </span>
                        )}
                        {senderId && !message?.isAnonymous && (
                            <Link
                                to={`/users/${senderId}`}
                                className='self-start text-[12.5px] font-medium text-link hover:underline'
                            >
                                View sender
                            </Link>
                        )}
                    </div>
                    <div className='flex flex-col gap-2.5 min-w-0'>
                        <Eyebrow>Reported by</Eyebrow>
                        <div className='flex flex-col gap-1 text-[13.5px]'>
                            {r.reporter?._id ? (
                                <Link
                                    to={`/users/${r.reporter._id}`}
                                    className='self-start font-semibold text-ink hover:underline'
                                >
                                    @{r.reporter.username || 'student'}
                                </Link>
                            ) : (
                                <span className='font-semibold text-ink'>
                                    @{r.reporter?.username || 'unknown'}
                                </span>
                            )}
                            <span className='text-ink-2 break-words'>
                                “{r.reason}”
                            </span>
                        </div>
                        <div className='flex flex-col gap-2 mt-auto pt-3'>
                            {message && !message.deleted && (
                                <Button
                                    variant='danger-solid'
                                    icon={Trash2}
                                    disabled={busy}
                                    onClick={() => deleteMessage(r)}
                                >
                                    Delete message
                                </Button>
                            )}
                            <Button
                                disabled={busy}
                                onClick={() => resolveReport(r)}
                            >
                                {message && !message.deleted
                                    ? 'Keep message'
                                    : 'Close report'}
                            </Button>
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Community'
                description='Group chats inside the app. Reports come from students who flag a message.'
            />

            <Tabs
                label='Community view'
                className='mb-5'
                value={tab}
                onChange={setTab}
                items={tabs}
            />

            {tab === 'reports' && (
                <div className='flex flex-col gap-4'>
                    {errors.reports && (
                        <Alert
                            tone='bad'
                            action={
                                <Button size='sm' onClick={fetchReports}>
                                    Try again
                                </Button>
                            }
                        >
                            Couldn’t load reports. Check your connection and try
                            again.
                        </Alert>
                    )}
                    {loading ? (
                        <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                            <SkeletonRows rows={4} />
                        </div>
                    ) : reports.length === 0 ? (
                        !errors.reports && (
                            <div className='bg-sheet border border-line rounded-xl'>
                                <EmptyState
                                    icon={Flag}
                                    tone='done'
                                    title='No open reports'
                                    description='Messages students flag in group chats appear here.'
                                />
                            </div>
                        )
                    ) : (
                        reports.map(reportCard)
                    )}

                    {handled.length > 0 && (
                        <section
                            aria-labelledby='handled-title'
                            className='flex flex-col gap-2.5 mt-2'
                        >
                            <h2
                                id='handled-title'
                                className='text-[14.5px] font-semibold text-ink-2'
                            >
                                Recently handled
                            </h2>
                            <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                                <Table minWidth={720}>
                                    <thead>
                                        <tr>
                                            <Th>Group</Th>
                                            <Th>Message · reason</Th>
                                            <Th>Outcome</Th>
                                            <Th>Handled</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {handled.map((r) => (
                                            <Tr key={r._id}>
                                                <Td className='font-medium whitespace-nowrap'>
                                                    {r.group?.name ||
                                                        'Deleted group'}
                                                </Td>
                                                <Td className='max-w-[420px]'>
                                                    <span className='block truncate text-ink-2'>
                                                        {r.message?.content
                                                            ? `“${r.message.content}”`
                                                            : 'Message unavailable'}{' '}
                                                        · {r.reason}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <ReportStatus
                                                        status={r.status}
                                                    />
                                                </Td>
                                                <Td className='whitespace-nowrap text-[13px] text-muted'>
                                                    {formatShortDate(
                                                        r.updatedAt ||
                                                            r.createdAt,
                                                    )}
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {tab === 'groups' && (
                <div className='flex flex-col gap-4'>
                    {errors.groups && (
                        <Alert
                            tone='bad'
                            action={
                                <Button
                                    size='sm'
                                    onClick={() => fetchGroups(groupsPage)}
                                >
                                    Try again
                                </Button>
                            }
                        >
                            Couldn’t load groups. Check your connection and try
                            again.
                        </Alert>
                    )}
                    <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                        {loading || groupsLoading ? (
                            <SkeletonRows rows={6} />
                        ) : groups.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title='No groups yet'
                                description='Group chats students create in the app appear here.'
                            />
                        ) : (
                            <Table minWidth={820}>
                                <thead>
                                    <tr>
                                        <Th>Group</Th>
                                        <Th>College</Th>
                                        <Th align='right'>Members</Th>
                                        <Th>Created by</Th>
                                        <Th>Last message</Th>
                                        <Th>
                                            <span className='sr-only'>
                                                Actions
                                            </span>
                                        </Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((g) => (
                                        <Tr key={g._id}>
                                            <Td className='font-medium max-w-[280px]'>
                                                <span className='block truncate'>
                                                    {g.name}
                                                </span>
                                            </Td>
                                            <Td className='text-ink-2'>
                                                {g.college?.name || '—'}
                                            </Td>
                                            <Td align='right' mono>
                                                {formatNumber(g.memberCount)}
                                            </Td>
                                            <Td className='text-ink-2'>
                                                {g.creator?._id ? (
                                                    <Link
                                                        to={`/users/${g.creator._id}`}
                                                        className='hover:underline'
                                                    >
                                                        @
                                                        {g.creator.username ||
                                                            'student'}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </Td>
                                            <Td className='whitespace-nowrap text-[13px] text-ink-2'>
                                                {g.lastMessageAt
                                                    ? relativeTime(
                                                          g.lastMessageAt,
                                                      )
                                                    : 'No messages yet'}
                                            </Td>
                                            <Td align='right'>
                                                <Button
                                                    variant='danger'
                                                    size='sm'
                                                    onClick={() =>
                                                        deleteGroup(g)
                                                    }
                                                    aria-label={`Delete ${g.name}`}
                                                >
                                                    Delete
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                        {groupsTotal > GROUPS_PER_PAGE && (
                            <div className='px-4 py-3 border-t border-line-soft'>
                                <Pagination
                                    currentPage={groupsPage}
                                    pageSize={GROUPS_PER_PAGE}
                                    totalItems={groupsTotal}
                                    onPageChange={(page) => {
                                        setGroupsPage(page);
                                        fetchGroups(page);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
                title={confirm?.title}
                message={confirm?.message}
                confirmText={confirm?.confirmText}
                variant='danger'
            />
        </div>
    );
};

export default CommunityModeration;
