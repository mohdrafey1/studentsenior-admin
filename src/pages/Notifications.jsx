import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, RotateCcw, Send, Smartphone, X } from 'lucide-react';
import api from '../utils/api';
import { useColleges } from '../context/CollegeContext';
import { formatNumber, formatShortDateTime } from '../utils/format';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import RecipientSearch from '../components/Notifications/RecipientSearch';
import BlogPostPicker from '../components/Notifications/BlogPostPicker';
import {
    AUDIENCES,
    COLLEGE_TARGETS,
    ITEM_TARGETS,
    MAX_PICKED_STUDENTS,
    NEW_STUDENT_DAYS,
    TAP_TARGETS,
    audienceProblem,
    buildAudience,
    buildData,
    describeAudience,
    describeTarget,
    targetProblem,
} from '../components/Notifications/notificationTargets';
import { blogEndpoints } from './Blog/blogApi';
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

const EMPTY_FORM = {
    title: '',
    body: '',
    audience: 'all',
    days: '7',
    audienceCollege: '',
    students: [],
    screen: '',
    college: '',
    slug: '',
    blog: null,
    url: '',
};

// The app account an admin last chose to test on, per browser.
const TEST_RECIPIENT_KEY = 'ss_admin_test_recipient';
const readStoredRecipient = () => {
    try {
        return JSON.parse(localStorage.getItem(TEST_RECIPIENT_KEY)) || null;
    } catch {
        return null;
    }
};
const storeRecipient = (recipient) => {
    try {
        if (recipient) {
            localStorage.setItem(TEST_RECIPIENT_KEY, JSON.stringify(recipient));
        } else {
            localStorage.removeItem(TEST_RECIPIENT_KEY);
        }
    } catch {
        // Private mode: the choice just isn't remembered.
    }
};

// Expo's error codes, in words an admin can act on.
const pushErrorText = (code) =>
    ({
        DeviceNotRegistered:
            'That phone is no longer registered. Open the app on it, sign in and allow notifications.',
        MessageTooBig: 'The message is too long for a notification.',
        MessageRateExceeded:
            'Too many tests to that phone. Wait a minute and try again.',
    })[code] || `Expo couldn’t deliver it (${code}).`;

const fieldLabel = 'text-[12.5px] text-ink-2';

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
    const [testing, setTesting] = useState(false);
    const [confirming, setConfirming] = useState(false);
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
    const [reach, setReach] = useState({ state: 'idle', devices: null });
    const [ownAccount, setOwnAccount] = useState(undefined); // undefined while loading
    const [chosenTester, setChosenTester] = useState(readStoredRecipient);
    const [pickingTester, setPickingTester] = useState(false);

    // Fetch notification stats
    const fetchStats = async () => {
        try {
            const response = await api.get('/notification/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
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
        api.get('/notification/test-recipient')
            .then((res) => setOwnAccount(res.data.data.recipient))
            .catch(() => setOwnAccount(null));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Count the devices the chosen audience reaches, as it changes.
    const audience = buildAudience(formData);
    const audienceKey = JSON.stringify(audience);
    const audienceIssue = audienceProblem(formData);
    useEffect(() => {
        if (audienceIssue) {
            setReach({ state: 'idle', devices: null });
            return undefined;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setReach((prev) => ({ ...prev, state: 'loading' }));
            try {
                const res = await api.post(
                    '/notification/audience',
                    { audience: JSON.parse(audienceKey) },
                    { signal: controller.signal },
                );
                setReach({ state: 'done', devices: res.data.data.devices });
            } catch {
                if (!controller.signal.aborted) {
                    setReach({ state: 'error', devices: null });
                }
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [audienceKey, audienceIssue]);

    const setField = (key, value) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const tester = chosenTester || ownAccount || null;
    const devices = reach.devices;

    // Title, message and tap target are needed for both a test and a send.
    const messageProblem = () => {
        if (!formData.title.trim() || !formData.body.trim()) {
            return 'Add a title and a message';
        }
        return targetProblem(formData);
    };

    // Checks the form, then asks for confirmation before anything is sent.
    const handleSubmit = (e) => {
        e.preventDefault();
        const problem = messageProblem() || audienceIssue;
        if (problem) {
            toast.error(problem);
            return;
        }
        if (reach.state !== 'done') {
            toast.error(
                'Still counting who this reaches. Try again in a moment.',
            );
            return;
        }
        if (!devices) {
            toast.error('No devices match this audience');
            return;
        }
        setConfirming(true);
    };

    const sendNotification = async () => {
        try {
            setSending(true);
            const response = await api.post('/notification', {
                title: formData.title,
                body: formData.body,
                data: buildData(formData),
                audience,
            });

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

    // Sends the notification to one phone only, so it can be checked first.
    const sendTest = async () => {
        const problem = messageProblem();
        if (problem) {
            toast.error(problem);
            return;
        }
        if (!tester) {
            setPickingTester(true);
            toast.error('Choose an app account to test on');
            return;
        }
        try {
            setTesting(true);
            const res = await api.post('/notification/test', {
                title: formData.title,
                body: formData.body,
                data: buildData(formData),
                userId: tester._id,
            });
            const { recipient, delivered, error } = res.data.data;
            if (delivered) {
                toast.success(
                    `Test sent to @${recipient.username}. Check the phone.`,
                );
            } else {
                toast.error(pushErrorText(error));
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    'Couldn’t send the test. Try again.',
            );
        } finally {
            setTesting(false);
        }
    };

    const chooseTester = (recipient) => {
        const picked = {
            _id: recipient._id,
            username: recipient.username,
            email: recipient.email,
            profilePicture: recipient.profilePicture,
            canReceive: recipient.canReceive,
        };
        // Choosing your own account again just goes back to the default.
        const isOwn = ownAccount && ownAccount._id === picked._id;
        setChosenTester(isOwn ? null : picked);
        storeRecipient(isOwn ? null : picked);
        setPickingTester(false);
    };

    // Copy an earlier notification into the form so it can be edited and sent.
    const handleRepeatNotification = (notification) => {
        const data = notification.data || {};
        const aud = notification.audience || { type: 'all' };
        const screen = data.screen || (data.url ? 'link' : '');
        setFormData({
            ...EMPTY_FORM,
            title: notification.title,
            body: notification.body,
            audience: aud.type || 'all',
            days: String(aud.days || 7),
            audienceCollege: aud.college || '',
            students: (aud.users || []).map((u) => ({
                _id: u._id,
                username: u.username,
            })),
            screen,
            college: COLLEGE_TARGETS.includes(screen)
                ? data.params?.college || ''
                : '',
            slug: ITEM_TARGETS.includes(screen) ? data.params?.slug || '' : '',
            blog:
                screen === 'blog' && data.params?.slug
                    ? { slug: data.params.slug, title: '' }
                    : null,
            url: screen === 'link' ? data.url || '' : '',
        });

        // History only keeps the slug; fetch the post's title for the picker.
        if (screen === 'blog' && data.params?.slug) {
            api.get(blogEndpoints.bySlug(data.params.slug))
                .then((res) =>
                    setFormData((prev) =>
                        prev.blog?.slug === data.params.slug
                            ? {
                                  ...prev,
                                  blog: {
                                      ...prev.blog,
                                      title: res.data.data?.title || '',
                                  },
                              }
                            : prev,
                    ),
                )
                .catch(() => {});
        }

        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast.success('Copied into the form. Edit it and send.');
    };

    const changeScreen = (screen) =>
        setFormData((prev) => ({
            ...prev,
            screen,
            // Clear what the new target can't use.
            college: COLLEGE_TARGETS.includes(screen) ? prev.college : '',
            slug: ITEM_TARGETS.includes(screen) ? prev.slug : '',
            blog: screen === 'blog' ? prev.blog : null,
            url: screen === 'link' ? prev.url : '',
        }));

    const needsCollege = COLLEGE_TARGETS.includes(formData.screen);
    const needsItem = ITEM_TARGETS.includes(formData.screen);

    const collegeSlugOptions = useMemo(() => {
        const options = colleges.map((c) => ({ value: c.slug, label: c.name }));
        if (
            formData.college &&
            !options.some((o) => o.value === formData.college)
        ) {
            options.push({ value: formData.college, label: formData.college });
        }
        return options;
    }, [colleges, formData.college]);

    // Students store their college's name, so the audience matches on names.
    const collegeNameOptions = useMemo(() => {
        const options = colleges.map((c) => ({ value: c.name, label: c.name }));
        if (
            formData.audienceCollege &&
            !options.some((o) => o.value === formData.audienceCollege)
        ) {
            options.push({
                value: formData.audienceCollege,
                label: formData.audienceCollege,
            });
        }
        return options;
    }, [colleges, formData.audienceCollege]);

    const collegeName = (slug) =>
        collegeSlugOptions.find((c) => c.value === slug)?.label || slug;
    const opensText =
        formData.screen === 'blog' && formData.blog
            ? `Blog · ${formData.blog.title || formData.blog.slug}`
            : describeTarget(buildData(formData), collegeName);
    const audienceText = describeAudience({
        ...audience,
        users: formData.students,
    });

    let reachText = '';
    if (audienceIssue) reachText = audienceIssue;
    else if (reach.state === 'loading' || reach.state === 'idle')
        reachText = 'Counting devices…';
    else if (reach.state === 'error') reachText = 'Couldn’t count devices';
    else if (devices === 0) reachText = 'No devices match this audience';
    else
        reachText = `Reaches ${formatNumber(devices)} device${devices === 1 ? '' : 's'}`;

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Push notifications'
                description='Send a message to phones with the StudentSenior app and notifications turned on: everyone, or just the students you choose.'
                actions={
                    <div className='flex items-end gap-6'>
                        <div className='flex flex-col sm:items-end gap-0.5'>
                            <span className='font-serif font-bold text-2xl leading-tight text-ink'>
                                {formatNumber(stats.usersWithPushTokens)}
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

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start mb-6'>
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
                        <legend className='sr-only'>Who gets it</legend>
                        <label
                            htmlFor='notification-audience'
                            className='text-[13px] font-medium text-ink'
                        >
                            Send to
                        </label>
                        <Select
                            id='notification-audience'
                            value={formData.audience}
                            onChange={(e) =>
                                setField('audience', e.target.value)
                            }
                            options={AUDIENCES}
                        />

                        {formData.audience === 'new' && (
                            <Select
                                aria-label='How recently they joined'
                                value={formData.days}
                                onChange={(e) =>
                                    setField('days', e.target.value)
                                }
                                options={NEW_STUDENT_DAYS}
                            />
                        )}

                        {formData.audience === 'college' && (
                            <div className='flex flex-col gap-1.5'>
                                <label
                                    htmlFor='notification-audience-college'
                                    className={fieldLabel}
                                >
                                    College
                                </label>
                                <Select
                                    id='notification-audience-college'
                                    value={formData.audienceCollege}
                                    onChange={(e) =>
                                        setField(
                                            'audienceCollege',
                                            e.target.value,
                                        )
                                    }
                                    placeholder='Choose a college'
                                    options={collegeNameOptions}
                                />
                                <span className='text-xs text-muted'>
                                    Matches the college students chose in their
                                    profile. Students who typed their own
                                    college aren’t included.
                                </span>
                            </div>
                        )}

                        {formData.audience === 'users' && (
                            <div className='flex flex-col gap-2'>
                                {formData.students.length > 0 && (
                                    <ul
                                        aria-label='Chosen students'
                                        className='flex flex-wrap gap-1.5'
                                    >
                                        {formData.students.map((student) => (
                                            <li
                                                key={student._id}
                                                className='inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-sheet border border-line text-[12.5px] text-ink'
                                            >
                                                @{student.username || 'student'}
                                                <button
                                                    type='button'
                                                    aria-label={`Remove @${student.username || 'student'}`}
                                                    onClick={() =>
                                                        setField(
                                                            'students',
                                                            formData.students.filter(
                                                                (s) =>
                                                                    s._id !==
                                                                    student._id,
                                                            ),
                                                        )
                                                    }
                                                    className='w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-sunken cursor-pointer'
                                                >
                                                    <X
                                                        className='w-3 h-3'
                                                        aria-hidden='true'
                                                    />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {formData.students.length <
                                MAX_PICKED_STUDENTS ? (
                                    <RecipientSearch
                                        label='Add a student'
                                        excludeIds={formData.students.map(
                                            (s) => s._id,
                                        )}
                                        onPick={(student) =>
                                            setField('students', [
                                                ...formData.students,
                                                student,
                                            ])
                                        }
                                    />
                                ) : (
                                    <span className='text-xs text-muted'>
                                        That’s the most one notification can
                                        list ({MAX_PICKED_STUDENTS}).
                                    </span>
                                )}
                            </div>
                        )}

                        <span
                            role='status'
                            className={`text-[12.5px] ${
                                audienceIssue ||
                                devices === 0 ||
                                reach.state === 'error'
                                    ? 'text-warn-ink'
                                    : 'text-ink-2'
                            }`}
                        >
                            {reachText}
                        </span>
                    </fieldset>

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
                            options={TAP_TARGETS}
                        />

                        {formData.screen === 'blog' && (
                            <BlogPostPicker
                                value={formData.blog}
                                onChange={(blog) => setField('blog', blog)}
                            />
                        )}

                        {formData.screen === 'link' && (
                            <div className='flex flex-col gap-1.5'>
                                <label
                                    htmlFor='notification-url'
                                    className={fieldLabel}
                                >
                                    Link
                                </label>
                                <Input
                                    id='notification-url'
                                    type='url'
                                    inputMode='url'
                                    value={formData.url}
                                    onChange={(e) =>
                                        setField('url', e.target.value)
                                    }
                                    placeholder='https://'
                                    className='font-mono text-[12.5px]'
                                />
                            </div>
                        )}

                        {(formData.screen === 'blog' ||
                            formData.screen === 'link') && (
                            <span className='text-xs text-muted'>
                                Opens inside the app’s browser. Phones that
                                haven’t updated the app yet just open the app.
                            </span>
                        )}

                        {needsCollege && (
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                                <div className='flex flex-col gap-1.5'>
                                    <label
                                        htmlFor='notification-college'
                                        className={fieldLabel}
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
                                        options={collegeSlugOptions}
                                    />
                                </div>
                                {needsItem && (
                                    <div className='flex flex-col gap-1.5'>
                                        <label
                                            htmlFor='notification-slug'
                                            className={fieldLabel}
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

                    <div className='flex flex-col gap-2.5 mt-auto pt-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Button
                                type='submit'
                                variant='primary'
                                size='lg'
                                icon={Send}
                                disabled={sending || testing}
                            >
                                {sending
                                    ? 'Sending…'
                                    : devices
                                      ? `Send to ${formatNumber(devices)} device${devices === 1 ? '' : 's'}`
                                      : 'Send notification'}
                            </Button>
                            <Button
                                size='lg'
                                icon={Smartphone}
                                onClick={sendTest}
                                disabled={sending || testing}
                            >
                                {testing ? 'Sending test…' : 'Send test'}
                            </Button>
                        </div>
                        <p className='text-[12.5px] text-muted'>
                            {ownAccount === undefined && !chosenTester ? (
                                'Finding your app account…'
                            ) : tester ? (
                                <>
                                    Tests go to{' '}
                                    <b className='font-medium text-ink-2'>
                                        @{tester.username}
                                    </b>
                                    {!chosenTester && ' (your app account)'}.{' '}
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setPickingTester((v) => !v)
                                        }
                                        className='text-link hover:underline cursor-pointer'
                                    >
                                        {pickingTester ? 'Cancel' : 'Change'}
                                    </button>
                                    {chosenTester &&
                                        ownAccount &&
                                        !pickingTester && (
                                            <>
                                                {' · '}
                                                <button
                                                    type='button'
                                                    onClick={() => {
                                                        setChosenTester(null);
                                                        storeRecipient(null);
                                                    }}
                                                    className='text-link hover:underline cursor-pointer'
                                                >
                                                    Use mine
                                                </button>
                                            </>
                                        )}
                                </>
                            ) : (
                                'No app account uses your email. Choose one to test on.'
                            )}
                        </p>
                        {(pickingTester ||
                            (ownAccount === null && !chosenTester)) && (
                            <RecipientSearch
                                label='Choose an app account to test on'
                                placeholder='Find your app account by username or email'
                                onPick={chooseTester}
                            />
                        )}
                        <p className='text-[12.5px] text-muted'>
                            You’ll be asked to confirm before it goes out. A
                            sent notification can’t be recalled.
                        </p>
                    </div>
                </form>

                <section
                    aria-label='Preview'
                    className='flex flex-col gap-4 p-6 rounded-xl bg-inverse lg:sticky lg:top-6'
                >
                    <span className='eyebrow text-on-inverse! opacity-70'>
                        Preview on a phone
                    </span>
                    <div className='flex items-center justify-center py-6'>
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
                    <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px] text-on-inverse'>
                        <dt className='opacity-70'>Goes to</dt>
                        <dd className='m-0 font-medium break-words'>
                            {audienceText}
                        </dd>
                        <dt className='opacity-70'>Tapping opens</dt>
                        <dd className='m-0 font-medium break-words'>
                            {opensText}
                        </dd>
                    </dl>
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
                                                    <span className='text-xs text-ink-2 break-words'>
                                                        To{' '}
                                                        {describeAudience(
                                                            notification.audience,
                                                        )}
                                                        {' · '}opens{' '}
                                                        {describeTarget(
                                                            notification.data,
                                                            collegeName,
                                                        )}
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
                message={`It goes to ${formatNumber(devices || 0)} device${devices === 1 ? '' : 's'} (${audienceText}) straight away and can’t be recalled.`}
                confirmText='Send now'
                variant='info'
            />
        </div>
    );
};

export default Notifications;
