import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Bell, RotateCcw, Send } from 'lucide-react';
import api from '../utils/api';
import { useColleges } from '../context/CollegeContext';
import { formatNumber, formatShortDateTime } from '../utils/format';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
    Button,
    EmptyState,
    Input,
    PageHeader,
    Panel,
    Select,
    SkeletonRows,
    Table,
    Td,
    Textarea,
    Th,
    Tr,
} from '../components/ui';

// Screens the app can open when a notification is tapped.
const NAVIGATION_SCREENS = [
    { value: '', label: 'Nothing, just open the app' },
    { value: 'pyqs', label: 'PYQs page' },
    { value: 'notes', label: 'Notes page' },
    { value: 'syllabus', label: 'Syllabus page' },
    { value: 'store', label: 'Store page' },
    { value: 'college', label: 'College home' },
    { value: 'profile', label: 'User profile' },
    { value: 'settings', label: 'Settings' },
    { value: 'collection', label: 'Saved collection' },
];

// Screens that need a college, and the ones that can open a single item.
const COLLEGE_SCREENS = ['pyqs', 'notes', 'syllabus', 'store', 'college'];
const ITEM_SCREENS = ['pyqs', 'notes', 'syllabus', 'store'];

const EMPTY_FORM = {
    title: '',
    body: '',
    screen: '',
    college: '',
    slug: '',
};

function CountedLabel({ htmlFor, children, count, max }) {
    return (
        <div className='flex items-baseline gap-2'>
            <label
                htmlFor={htmlFor}
                className='flex-1 text-[13px] font-medium text-ink'
            >
                {children}
                <span className='text-bad-ink' aria-hidden='true'>
                    {' '}
                    *
                </span>
            </label>
            <span className='font-mono text-[11.5px] text-muted'>
                {count}/{max}
            </span>
        </div>
    );
}

const Notifications = () => {
    const { colleges } = useColleges();
    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [statsLoaded, setStatsLoaded] = useState(false);
    const [stats, setStats] = useState({
        usersWithPushTokens: 0,
        totalNotificationsSent: 0,
    });
    const [notifications, setNotifications] = useState([]);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    // Fetch notification stats
    const fetchStats = async () => {
        try {
            const response = await api.get('/notification/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setStatsLoaded(true);
        }
    };

    // Fetch notification history
    const fetchNotifications = async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get(
                `/notification?page=${page}&limit=${pagination.limit}`,
            );
            if (response.data.success) {
                setNotifications(response.data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    page,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 1,
                }));
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t load sent notifications. Try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setField = (key, value) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    // Checks the form, then asks for confirmation before anything is sent.
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.body.trim()) {
            toast.error('Add a title and a message');
            return;
        }

        if (stats.usersWithPushTokens === 0) {
            toast.error('No devices can receive notifications yet');
            return;
        }

        setConfirming(true);
    };

    const sendNotification = async () => {
        try {
            setSending(true);

            // Build notification payload with navigation data
            const payload = {
                title: formData.title,
                body: formData.body,
                data: {},
            };

            // Add navigation data if screen is selected
            if (formData.screen) {
                payload.data = {
                    screen: formData.screen,
                    params: {},
                };

                if (formData.college) {
                    payload.data.params.college = formData.college;
                }
                if (formData.slug) {
                    payload.data.params.slug = formData.slug;
                }
            }

            const response = await api.post('/notification', payload);

            if (response.data.success) {
                toast.success(
                    `Notification sent to ${formatNumber(response.data.data.successCount)} devices`,
                );
                setFormData(EMPTY_FORM);
                fetchStats();
                fetchNotifications();
            } else {
                throw new Error(
                    response.data.message || 'Failed to send notification',
                );
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t send the notification. Try again.',
            );
        } finally {
            setSending(false);
        }
    };

    // Copy an earlier notification into the form so it can be edited and sent.
    const handleRepeatNotification = (notification) => {
        setFormData({
            title: notification.title,
            body: notification.body,
            screen: notification.data?.screen || '',
            college: notification.data?.params?.college || '',
            slug: notification.data?.params?.slug || '',
        });

        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        toast.success('Copied into the form. Edit it and send.');
    };

    const changeScreen = (screen) =>
        setFormData((prev) => ({
            ...prev,
            screen,
            // Clear what the new screen can't use.
            college: COLLEGE_SCREENS.includes(screen) ? prev.college : '',
            slug: ITEM_SCREENS.includes(screen) ? prev.slug : '',
        }));

    const devices = stats.usersWithPushTokens || 0;
    const needsCollege = COLLEGE_SCREENS.includes(formData.screen);
    const needsItem = ITEM_SCREENS.includes(formData.screen);

    const collegeOptions = colleges.map((c) => ({
        value: c.slug,
        label: c.name,
    }));
    if (
        formData.college &&
        !collegeOptions.some((option) => option.value === formData.college)
    ) {
        collegeOptions.push({
            value: formData.college,
            label: formData.college,
        });
    }

    const screenLabel = NAVIGATION_SCREENS.find(
        (s) => s.value === formData.screen,
    )?.label;
    const collegeName = collegeOptions.find(
        (c) => c.value === formData.college,
    )?.label;
    const opensText = [
        screenLabel,
        needsCollege && collegeName,
        needsItem && formData.slug,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Push notifications'
                description='Send one message to every phone with the StudentSenior app and notifications turned on.'
                actions={
                    <div className='flex items-end gap-6'>
                        <div className='flex flex-col sm:items-end gap-0.5'>
                            <span className='font-serif font-bold text-2xl leading-tight text-ink'>
                                {formatNumber(devices)}
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                devices can receive
                            </span>
                        </div>
                        <div className='flex flex-col sm:items-end gap-0.5'>
                            <span className='font-serif font-bold text-2xl leading-tight text-ink'>
                                {formatNumber(stats.totalNotificationsSent)}
                            </span>
                            <span className='text-[12.5px] text-muted'>
                                sent so far
                            </span>
                        </div>
                    </div>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-stretch mb-6'>
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    aria-labelledby='compose-title'
                    className='flex flex-col gap-4 p-5 sm:px-[22px] bg-sheet border border-line rounded-xl scroll-mt-6'
                >
                    <h2
                        id='compose-title'
                        className='text-[15px] font-semibold text-ink'
                    >
                        New notification
                    </h2>

                    <div className='flex flex-col gap-1.5'>
                        <CountedLabel
                            htmlFor='notification-title'
                            count={formData.title.length}
                            max={100}
                        >
                            Title
                        </CountedLabel>
                        <Input
                            id='notification-title'
                            value={formData.title}
                            onChange={(e) => setField('title', e.target.value)}
                            maxLength={100}
                            placeholder='For example: New PYQs for your end-semester exams'
                            className='h-10'
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <CountedLabel
                            htmlFor='notification-body'
                            count={formData.body.length}
                            max={500}
                        >
                            Message
                        </CountedLabel>
                        <Textarea
                            id='notification-body'
                            value={formData.body}
                            onChange={(e) => setField('body', e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder='What students should know, in a sentence or two'
                        />
                    </div>

                    <fieldset className='flex flex-col gap-3 p-3.5 rounded-[10px] bg-sunken border border-line-soft'>
                        <legend className='sr-only'>When tapped</legend>
                        <label
                            htmlFor='notification-screen'
                            className='text-[13px] font-medium text-ink'
                        >
                            When tapped, open
                        </label>
                        <Select
                            id='notification-screen'
                            value={formData.screen}
                            onChange={(e) => changeScreen(e.target.value)}
                            options={NAVIGATION_SCREENS}
                        />
                        {needsCollege && (
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                                <div className='flex flex-col gap-1.5'>
                                    <label
                                        htmlFor='notification-college'
                                        className='text-[12.5px] text-ink-2'
                                    >
                                        College
                                    </label>
                                    <Select
                                        id='notification-college'
                                        value={formData.college}
                                        onChange={(e) =>
                                            setField('college', e.target.value)
                                        }
                                        placeholder='Choose a college'
                                        options={collegeOptions}
                                    />
                                </div>
                                {needsItem && (
                                    <div className='flex flex-col gap-1.5'>
                                        <label
                                            htmlFor='notification-slug'
                                            className='text-[12.5px] text-ink-2'
                                        >
                                            Specific item (optional)
                                        </label>
                                        <Input
                                            id='notification-slug'
                                            value={formData.slug}
                                            onChange={(e) =>
                                                setField('slug', e.target.value)
                                            }
                                            placeholder='Item slug'
                                            className='font-mono text-[12.5px]'
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </fieldset>

                    <div className='flex flex-wrap items-center gap-3 mt-auto pt-1'>
                        <Button
                            type='submit'
                            variant='primary'
                            size='lg'
                            icon={Send}
                            disabled={sending || devices === 0}
                        >
                            {sending
                                ? 'Sending…'
                                : !statsLoaded
                                  ? 'Send notification'
                                  : devices === 0
                                    ? 'No devices to send to'
                                    : `Send to ${formatNumber(devices)} devices`}
                        </Button>
                        <span className='text-[12.5px] text-muted'>
                            You’ll be asked to confirm. This can’t be undone.
                        </span>
                    </div>
                </form>

                <section
                    aria-label='Preview'
                    className='flex flex-col gap-4 p-6 rounded-xl bg-inverse'
                >
                    <span className='eyebrow text-on-inverse! opacity-70'>
                        Preview on a phone
                    </span>
                    <div className='flex-1 flex items-center justify-center py-4'>
                        <div className='w-full max-w-[340px] flex flex-col gap-2 px-4 py-3.5 rounded-[18px] bg-sheet shadow-[0_8px_24px_rgba(0,0,0,0.25)]'>
                            <div className='flex items-center gap-2'>
                                <span
                                    aria-hidden='true'
                                    className='w-5 h-5 rounded-[5px] bg-inverse text-on-inverse flex items-center justify-center font-serif font-bold text-xs'
                                >
                                    S
                                </span>
                                <span className='flex-1 text-xs text-ink-2'>
                                    StudentSenior
                                </span>
                                <span className='text-xs text-muted'>now</span>
                            </div>
                            <span
                                className={`text-sm font-semibold break-words ${
                                    formData.title ? 'text-ink' : 'text-muted'
                                }`}
                            >
                                {formData.title || 'Your title'}
                            </span>
                            <span
                                className={`text-[13.5px] leading-snug break-words ${
                                    formData.body ? 'text-ink-2' : 'text-muted'
                                }`}
                            >
                                {formData.body ||
                                    'Your message appears here, as students will see it.'}
                            </span>
                        </div>
                    </div>
                    <span className='text-[12.5px] text-on-inverse opacity-70'>
                        Tapping opens:{' '}
                        <b className='font-medium opacity-100'>{opensText}</b>
                    </span>
                </section>
            </div>

            <Panel title='Sent before' titleId='history-title'>
                {loading ? (
                    <SkeletonRows rows={4} />
                ) : notifications.length === 0 ? (
                    <EmptyState
                        icon={Bell}
                        title='No notifications sent yet'
                        description='Notifications you send appear here, with how many reached a phone.'
                    />
                ) : (
                    <>
                        <Table minWidth={820}>
                            <thead>
                                <tr>
                                    <Th>Notification</Th>
                                    <Th>Sent</Th>
                                    <Th align='right'>Recipients</Th>
                                    <Th>Delivered</Th>
                                    <Th>
                                        <span className='sr-only'>Actions</span>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((notification) => {
                                    const recipients =
                                        notification.recipientCount || 0;
                                    const delivered =
                                        notification.successCount || 0;
                                    const failed =
                                        notification.failureCount || 0;
                                    const pct = recipients
                                        ? Math.round(
                                              (delivered / recipients) * 1000,
                                          ) / 10
                                        : 0;
                                    return (
                                        <Tr key={notification._id}>
                                            <Td className='max-w-[380px]'>
                                                <div className='flex flex-col gap-0.5 min-w-0'>
                                                    <span className='font-medium text-ink'>
                                                        {notification.title}
                                                    </span>
                                                    <span className='text-[12.5px] text-muted line-clamp-2'>
                                                        {notification.body}
                                                    </span>
                                                </div>
                                            </Td>
                                            <Td>
                                                <div className='flex flex-col gap-0.5'>
                                                    <span className='whitespace-nowrap text-[13px] text-ink-2'>
                                                        {formatShortDateTime(
                                                            notification.createdAt,
                                                        )}
                                                    </span>
                                                    {notification.sentBy
                                                        ?.name && (
                                                        <span className='text-xs text-muted whitespace-nowrap'>
                                                            by{' '}
                                                            {
                                                                notification
                                                                    .sentBy.name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td align='right' mono>
                                                {formatNumber(recipients)}
                                            </Td>
                                            <Td className='w-[190px]'>
                                                <div className='flex flex-col gap-1'>
                                                    <div className='flex items-center gap-2'>
                                                        <div
                                                            aria-hidden='true'
                                                            className={`flex-1 h-1.5 rounded-full ${
                                                                failed
                                                                    ? 'bg-bad-soft'
                                                                    : 'bg-line-soft'
                                                            }`}
                                                        >
                                                            <div
                                                                className='h-full rounded-full bg-ok'
                                                                style={{
                                                                    width: `${Math.min(pct, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className='font-mono text-xs text-ink-2'>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <span className='text-xs text-muted'>
                                                        {formatNumber(
                                                            delivered,
                                                        )}{' '}
                                                        delivered
                                                        {failed > 0 &&
                                                            ` · ${formatNumber(failed)} failed`}
                                                    </span>
                                                </div>
                                            </Td>
                                            <Td align='right'>
                                                <Button
                                                    size='sm'
                                                    icon={RotateCcw}
                                                    onClick={() =>
                                                        handleRepeatNotification(
                                                            notification,
                                                        )
                                                    }
                                                    aria-label={`Reuse “${notification.title}”`}
                                                >
                                                    Reuse
                                                </Button>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                        {pagination.pages > 1 && (
                            <div className='px-4 py-3 border-t border-line-soft'>
                                <Pagination
                                    currentPage={pagination.page}
                                    totalItems={pagination.total}
                                    pageSize={pagination.limit}
                                    onPageChange={(page) =>
                                        fetchNotifications(page)
                                    }
                                />
                            </div>
                        )}
                    </>
                )}
            </Panel>

            <ConfirmModal
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={sendNotification}
                title='Send this notification?'
                message={`It goes to ${formatNumber(devices)} devices straight away and can’t be recalled.`}
                confirmText='Send now'
                variant='info'
            />
        </div>
    );
};

export default Notifications;
