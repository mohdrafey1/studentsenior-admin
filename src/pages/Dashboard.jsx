import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Building2,
    CheckCircle2,
    ChevronRight,
    Pencil,
    Search,
    Trash2,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useColleges } from '../context/CollegeContext';
import {
    Button,
    EmptyState,
    PageHeader,
    Panel,
    Segmented,
    SkeletonRows,
    Stat,
    StatusBadge,
} from '../components/ui';
import EditCollegeModal from '../components/College/EditCollegeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { collegeInitials } from '../utils/initials';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
// PT Serif has no ₹ glyph, so headline amounts set the sign in the UI font.
const inrHeadline = (n) => (
    <>
        <span className='font-sans font-semibold'>₹</span>
        {Number(n || 0).toLocaleString('en-IN')}
    </>
);
const num = (n) => Number(n || 0).toLocaleString('en-IN');

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

// A failed or forbidden request (moderators can't read money endpoints)
// becomes null, so one missing number never blanks the whole page.
const settle = (request) =>
    request.then((response) => response.data?.data ?? null).catch(() => null);

function useHomeData() {
    const [state, setState] = useState({ loading: true });

    useEffect(() => {
        let cancelled = false;
        const tz = new Date().getTimezoneOffset();

        Promise.all([
            settle(api.get('/stats/stats')),
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
            settle(
                api.get('/payment', {
                    params: {
                        status: 'captured',
                        timeFilter: 'last7d',
                        page: 1,
                        pageSize: 1,
                        timezoneOffset: tz,
                    },
                }),
            ),
            settle(api.get('/tasks')),
        ]).then(
            ([
                stats,
                requested,
                reviewing,
                redemptions,
                contacts,
                reports,
                payments,
                tasks,
            ]) => {
                if (cancelled) return;
                setState({
                    loading: false,
                    stats,
                    refunds:
                        requested || reviewing
                            ? (requested?.pagination?.totalItems || 0) +
                              (reviewing?.pagination?.totalItems || 0)
                            : null,
                    redemptions: redemptions
                        ? {
                              count: redemptions.pagination?.total || 0,
                              rupees: redemptions.totals?.rupees || 0,
                          }
                        : null,
                    contacts: Array.isArray(contacts)
                        ? contacts.filter(
                              (c) => (c.status || 'pending') === 'pending',
                          ).length
                        : null,
                    reports: reports ? (reports.reports || []).length : null,
                    payments: payments
                        ? {
                              count: payments.pagination?.total || 0,
                              rupees: payments.totals?.rupees || 0,
                          }
                        : null,
                    tasks: Array.isArray(tasks) ? tasks : null,
                });
            },
        );

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}

/**
 * Per-college content counts. Each college costs one request, so they run
 * a few at a time and fill in as they arrive.
 */
function useCollegeCounts(colleges) {
    const [counts, setCounts] = useState({});

    useEffect(() => {
        let cancelled = false;
        const queue = colleges.map((c) => c.slug);
        const worker = async () => {
            while (queue.length && !cancelled) {
                const slug = queue.shift();
                const data = await settle(api.get(`/college-data/${slug}`));
                if (!cancelled)
                    setCounts((prev) => ({ ...prev, [slug]: data }));
            }
        };
        Array.from({ length: 4 }, worker);
        return () => {
            cancelled = true;
        };
    }, [colleges]);

    return counts;
}

function AttentionRow({ to, label, note, value }) {
    return (
        <Link
            to={to}
            className='flex items-center gap-3 px-5 py-3.5 border-b border-line-soft last:border-b-0 hover:bg-sunken transition-colors'
        >
            <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
                <span className='text-[13.5px] font-medium text-ink'>
                    {label}
                </span>
                <span className='text-[12.5px] text-muted'>{note}</span>
            </span>
            {value > 0 ? (
                <StatusBadge tone='warn'>{num(value)} waiting</StatusBadge>
            ) : (
                <StatusBadge tone='ok'>All clear</StatusBadge>
            )}
            <ChevronRight className='w-4 h-4 text-muted' aria-hidden='true' />
        </Link>
    );
}

const Dashboard = () => {
    const { user } = useAuth();
    const { colleges, loading: collegesLoading, refresh } = useColleges();
    const home = useHomeData();
    const counts = useCollegeCounts(colleges);

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingCollege, setEditingCollege] = useState(null);
    const [collegeToDelete, setCollegeToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const attention = [
        home.refunds,
        home.redemptions?.count,
        home.contacts,
        home.reports,
    ].reduce((sum, n) => sum + (n || 0), 0);

    const myTasks = useMemo(() => {
        if (!home.tasks || !user) return [];
        return home.tasks
            .filter(
                (task) =>
                    task.status !== 'Completed' &&
                    (task.assignedTo?._id === user.id ||
                        task.assignedTo === user.id),
            )
            .slice(0, 5);
    }, [home.tasks, user]);

    const visibleColleges = useMemo(() => {
        const q = query.trim().toLowerCase();
        return colleges.filter((college) => {
            if (statusFilter === 'active' && !college.status) return false;
            if (statusFilter === 'inactive' && college.status) return false;
            return (
                !q ||
                college.name?.toLowerCase().includes(q) ||
                college.location?.toLowerCase().includes(q) ||
                college.slug?.toLowerCase().includes(q)
            );
        });
    }, [colleges, query, statusFilter]);

    const activeCount = colleges.filter((c) => c.status).length;

    const handleSaveCollege = async (formData) => {
        if (!editingCollege) return;
        try {
            setIsSubmitting(true);
            const response = await api.put(
                `/college/${editingCollege._id}`,
                formData,
            );
            if (!response.data.success) {
                throw new Error(response.data.message || 'Update failed');
            }
            toast.success('College updated');
            setEditingCollege(null);
            await refresh();
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Couldn’t save the college',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!collegeToDelete) return;
        try {
            setIsSubmitting(true);
            const response = await api.delete(
                `/college/${collegeToDelete._id}`,
            );
            if (!response.data.success) {
                throw new Error(response.data.message || 'Delete failed');
            }
            toast.success('College deleted');
            setCollegeToDelete(null);
            await refresh();
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Couldn’t delete the college',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const firstName = (user?.name || '').split(' ')[0];
    const todayLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    let summary = 'Nothing needs your attention right now.';
    if (home.loading) summary = 'Checking what needs your attention…';
    else if (attention === 1) summary = '1 thing needs your attention.';
    else if (attention > 1)
        summary = `${num(attention)} things need your attention.`;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={todayLabel}
                title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
                description={summary}
                actions={<Button to='/analytics'>Open analytics</Button>}
            />

            <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6'>
                <Stat
                    label='Needs attention'
                    attention={attention > 0}
                    loading={home.loading}
                    value={num(attention)}
                    note='Refunds, payouts, messages and reports'
                />
                <Stat
                    label='Captured, last 7 days'
                    loading={home.loading}
                    value={
                        home.payments ? inrHeadline(home.payments.rupees) : '—'
                    }
                    note={
                        home.payments
                            ? `${num(home.payments.count)} payments`
                            : 'Only admins can see payments'
                    }
                    to={home.payments ? '/reports/payments' : undefined}
                />
                <Stat
                    label='Students'
                    loading={home.loading}
                    value={home.stats ? num(home.stats.totalClient) : '—'}
                    note={
                        home.stats
                            ? `${num(home.stats.totalSubscriptions)} subscriptions`
                            : undefined
                    }
                    to='/users'
                />
                <Stat
                    label='Colleges'
                    loading={collegesLoading && colleges.length === 0}
                    value={num(colleges.length)}
                    note={`${num(activeCount)} active`}
                />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 mb-6 items-start'>
                <Panel title='Needs your attention' titleId='attention-title'>
                    {home.loading ? (
                        <SkeletonRows rows={4} />
                    ) : (
                        <>
                            {home.refunds !== null && (
                                <AttentionRow
                                    to='/reports/refunds'
                                    label='Refund requests'
                                    note='Waiting for a decision before Razorpay refunds'
                                    value={home.refunds}
                                />
                            )}
                            {home.redemptions && (
                                <AttentionRow
                                    to='/reports/redemptions'
                                    label='UPI redemptions'
                                    note={
                                        home.redemptions.count
                                            ? `${inr(home.redemptions.rupees)} to pay out`
                                            : 'No payouts waiting'
                                    }
                                    value={home.redemptions.count}
                                />
                            )}
                            {home.contacts !== null && (
                                <AttentionRow
                                    to='/reports/contacts'
                                    label='Contact requests'
                                    note='Messages from the website contact form'
                                    value={home.contacts}
                                />
                            )}
                            {home.reports !== null && (
                                <AttentionRow
                                    to='/community'
                                    label='Community reports'
                                    note='Messages students flagged in group chats'
                                    value={home.reports}
                                />
                            )}
                        </>
                    )}
                </Panel>

                <Panel
                    title='My tasks'
                    titleId='tasks-title'
                    action={
                        <Link
                            to='/tasks'
                            className='text-[13px] font-medium text-link hover:underline'
                        >
                            All tasks
                        </Link>
                    }
                >
                    {home.loading ? (
                        <SkeletonRows rows={3} />
                    ) : myTasks.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            tone='done'
                            title='Nothing assigned to you'
                            description='Pick up an open task or create one on the Tasks page.'
                            className='py-8'
                        />
                    ) : (
                        <ul>
                            {myTasks.map((task) => (
                                <li
                                    key={task._id}
                                    className='flex items-start gap-3 px-5 py-3 border-b border-line-soft last:border-b-0'
                                >
                                    <span className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                        <span className='text-[13.5px] text-ink'>
                                            {task.title}
                                        </span>
                                        <span className='text-xs text-muted'>
                                            {task.priority}
                                            {task.dueDate &&
                                                ` · Due ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                        </span>
                                    </span>
                                    <StatusBadge status={task.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <Panel
                title='Colleges'
                titleId='colleges-title'
                action={
                    <div className='flex flex-wrap items-center gap-2'>
                        <label className='flex items-center gap-2 w-56 h-8 px-2.5 rounded-lg border border-line-strong text-muted'>
                            <Search
                                className='w-[15px] h-[15px]'
                                aria-hidden='true'
                            />
                            <input
                                type='search'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder='Search colleges'
                                aria-label='Search colleges'
                                className='flex-1 min-w-0 bg-transparent outline-none text-[13px] text-ink placeholder:text-muted'
                            />
                        </label>
                        <Segmented
                            label='Status'
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                    </div>
                }
            >
                {collegesLoading && colleges.length === 0 ? (
                    <SkeletonRows rows={5} />
                ) : visibleColleges.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title='No colleges match'
                        description='Try another name or clear the search.'
                    />
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full min-w-[860px] text-[13.5px]'>
                            <thead>
                                <tr className='bg-sunken border-b border-line-soft'>
                                    <th
                                        scope='col'
                                        className='eyebrow text-left font-normal px-5 py-2.5'
                                    >
                                        College
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-left font-normal px-3 py-2.5'
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-right font-normal px-3 py-2.5'
                                    >
                                        PYQs
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-right font-normal px-3 py-2.5'
                                    >
                                        Notes
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-right font-normal px-3 py-2.5'
                                    >
                                        Seniors
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-right font-normal px-3 py-2.5'
                                    >
                                        Views
                                    </th>
                                    <th
                                        scope='col'
                                        className='eyebrow text-left font-normal px-3 py-2.5'
                                    >
                                        Slug
                                    </th>
                                    <th scope='col' className='px-5 py-2.5'>
                                        <span className='sr-only'>Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleColleges.map((college) => {
                                    const c = counts[college.slug];
                                    return (
                                        <tr
                                            key={college._id}
                                            className='border-b border-line-soft last:border-b-0 hover:bg-sunken/60'
                                        >
                                            <td className='px-5 py-3'>
                                                <div className='flex items-center gap-3 min-w-0'>
                                                    <span className='w-8 h-8 rounded-lg bg-brand-soft text-brand-ink flex items-center justify-center text-xs font-semibold shrink-0'>
                                                        {collegeInitials(
                                                            college.name,
                                                        )}
                                                    </span>
                                                    <span className='min-w-0 flex flex-col gap-0.5'>
                                                        <Link
                                                            to={`/${college.slug}`}
                                                            className='font-medium text-ink hover:underline truncate'
                                                        >
                                                            {college.name}
                                                        </Link>
                                                        <span className='text-[12.5px] text-muted truncate'>
                                                            {college.location}
                                                        </span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-3 py-3'>
                                                <StatusBadge
                                                    status={
                                                        college.status
                                                            ? 'active'
                                                            : 'inactive'
                                                    }
                                                />
                                            </td>
                                            <td className='px-3 py-3 text-right font-mono text-[13px]'>
                                                {c ? num(c.totalNewPyqs) : '—'}
                                            </td>
                                            <td className='px-3 py-3 text-right font-mono text-[13px]'>
                                                {c ? num(c.totalNotes) : '—'}
                                            </td>
                                            <td className='px-3 py-3 text-right font-mono text-[13px]'>
                                                {c ? num(c.totalSeniors) : '—'}
                                            </td>
                                            <td className='px-3 py-3 text-right font-mono text-[13px]'>
                                                {num(college.clickCounts)}
                                            </td>
                                            <td className='px-3 py-3'>
                                                <code className='font-mono text-xs text-ink-2'>
                                                    {college.slug}
                                                </code>
                                            </td>
                                            <td className='px-5 py-3'>
                                                <div className='flex justify-end gap-1'>
                                                    <Button
                                                        to={`/${college.slug}`}
                                                        size='sm'
                                                    >
                                                        Open
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        iconOnly
                                                        icon={Pencil}
                                                        aria-label={`Edit ${college.name}`}
                                                        onClick={() =>
                                                            setEditingCollege(
                                                                college,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        iconOnly
                                                        icon={Trash2}
                                                        aria-label={`Delete ${college.name}`}
                                                        className='text-bad-ink hover:text-bad-ink'
                                                        onClick={() =>
                                                            setCollegeToDelete(
                                                                college,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <EditCollegeModal
                isOpen={Boolean(editingCollege)}
                onClose={() => !isSubmitting && setEditingCollege(null)}
                college={editingCollege}
                onSave={handleSaveCollege}
                loading={isSubmitting}
            />

            <DeleteConfirmationModal
                isOpen={Boolean(collegeToDelete)}
                onClose={() => !isSubmitting && setCollegeToDelete(null)}
                onConfirm={handleConfirmDelete}
                title='Delete this college?'
                message='This permanently removes the college and everything students added to it: PYQs, notes, seniors, store listings and groups. To hide it instead, edit it and mark it inactive.'
                itemName={collegeToDelete?.name}
                loading={isSubmitting}
            />
        </div>
    );
};

export default Dashboard;
