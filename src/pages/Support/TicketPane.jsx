import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Lock,
    Send,
    StickyNote,
    Trash2,
} from 'lucide-react';
import api, { apiErrorMessage } from '../../utils/api';
import { formatDateTime, formatShortDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Alert,
    Avatar,
    Button,
    MetaList,
    Segmented,
    Select,
    Skeleton,
    StatusBadge,
    Textarea,
} from '../../components/ui';
import {
    CATEGORY_LABELS,
    CATEGORY_OPTIONS,
    PRIORITY_OPTIONS,
    REPORT_REASON_LABELS,
    SOURCE_LABELS,
    STATUS_OPTIONS,
    SUPPORT_TEAM_NAME,
    describeTicketStatus,
    requesterName,
    ticketRef,
} from './supportMeta';

const SAVED = {
    status: 'Status changed',
    priority: 'Priority changed',
    category: 'Category changed',
};

const PLATFORMS = { android: 'Android', ios: 'iOS' };

export function TicketStatusBadge({ status }) {
    const { tone, label } = describeTicketStatus(status);
    return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

function Message({ message, ticket }) {
    const when = formatShortDateTime(message.createdAt);
    if (message.internal) {
        return (
            <li className='flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-warn-soft text-warn-ink'>
                <span className='flex flex-wrap items-center gap-1.5 text-xs font-medium'>
                    <Lock className='w-3.5 h-3.5' aria-hidden='true' />
                    Internal note · {message.staffName || 'Staff'} · {when}
                </span>
                <p className='m-0 text-[14px] leading-relaxed whitespace-pre-wrap break-words'>
                    {message.body}
                </p>
            </li>
        );
    }
    const fromStaff = message.author === 'staff';
    return (
        <li
            className={`flex flex-col gap-1 max-w-[88%] ${
                fromStaff ? 'self-end items-end' : 'self-start items-start'
            }`}
        >
            <span className='text-xs text-muted'>
                {fromStaff
                    ? message.staffName || 'Support team'
                    : requesterName(ticket)}{' '}
                · {when}
            </span>
            <p
                className={`m-0 px-4 py-3 rounded-2xl text-[14px] leading-relaxed text-ink whitespace-pre-wrap break-words ${
                    fromStaff
                        ? 'bg-brand-soft rounded-br-md'
                        : 'bg-ground rounded-bl-md'
                }`}
            >
                {message.body}
            </p>
        </li>
    );
}

function Requester({ ticket }) {
    const { user } = ticket;
    return (
        <div className='flex items-start gap-3 min-w-0'>
            <Avatar
                name={user?.username || ticket.email || 'Guest'}
                src={user?.profilePicture}
            />
            <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                <div className='flex flex-wrap items-center gap-1.5'>
                    {user ? (
                        <Link
                            to={`/users/${user._id}`}
                            className='text-[14px] font-medium text-link hover:underline break-all'
                        >
                            @{user.username}
                        </Link>
                    ) : (
                        <span className='text-[14px] font-medium text-ink'>
                            Guest
                        </span>
                    )}
                    {user?.isPremium && (
                        <StatusBadge tone='info'>Premium</StatusBadge>
                    )}
                    {user?.blocked && (
                        <StatusBadge tone='bad'>Blocked</StatusBadge>
                    )}
                </div>
                <span className='text-[13px] text-ink-2 break-all'>
                    {ticket.email || 'No email given'}
                </span>
                {user?.college && (
                    <span className='text-[13px] text-muted'>
                        {user.college}
                    </span>
                )}
            </div>
        </div>
    );
}

/** What staff should know before replying to this person. */
function Notices({ ticket }) {
    const account = ticket.emailAccount;
    return (
        <>
            {!ticket.canReply && (
                <Alert tone='warn'>
                    No email was given, so replies can’t reach this person. You
                    can still add notes for the team.
                </Alert>
            )}
            {ticket.guest && ticket.canReply && (
                <Alert tone='info'>
                    Sent without signing in. Replies go to {ticket.email} by
                    email, and they can’t see this conversation, so put the
                    whole answer in your reply.
                </Alert>
            )}
            {account && (
                <Alert tone='neutral'>
                    An account uses this email:{' '}
                    <Link
                        to={`/users/${account._id}`}
                        className='font-medium text-link hover:underline'
                    >
                        @{account.username}
                    </Link>
                    {account.blocked ? ' (blocked)' : ''}. Guests can type any
                    address, so make sure it’s them before changing that
                    account.
                </Alert>
            )}
        </>
    );
}

function Composer({ ticket, onSent }) {
    const [mode, setMode] = useState(ticket.canReply ? 'reply' : 'note');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(null);
    const [error, setError] = useState('');
    const note = mode === 'note';

    const send = async (status) => {
        const message = text.trim();
        if (!message) {
            setError(
                note ? 'Write the note first.' : 'Write your reply first.',
            );
            return;
        }
        setSending(status || mode);
        setError('');
        try {
            const { data } = await api.post(
                `/support/tickets/${ticket._id}/messages`,
                { message, internal: note, ...(status ? { status } : {}) },
            );
            setText('');
            toast.success(
                note
                    ? 'Note added'
                    : status === 'resolved'
                      ? 'Reply sent and ticket resolved'
                      : 'Reply sent',
            );
            onSent(data.data.ticket);
        } catch (err) {
            setError(apiErrorMessage(err, 'Couldn’t send it. Try again.'));
        } finally {
            setSending(null);
        }
    };

    const hint = note
        ? 'Only staff can see notes. The student isn’t told.'
        : ticket.guest
          ? `Emailed to ${ticket.email}, from “${SUPPORT_TEAM_NAME}”.`
          : `${requesterName(ticket)} gets a notification and an email from “${SUPPORT_TEAM_NAME}”.`;

    const spinner = (key) =>
        sending === key ? '[&>svg]:animate-spin' : undefined;

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                send();
            }}
            noValidate
            className={`flex flex-col gap-3 px-6 pt-4 pb-5 border-t border-line-soft ${
                note ? 'bg-warn-soft' : 'bg-sunken'
            }`}
        >
            {ticket.canReply && (
                <Segmented
                    label='Message type'
                    value={mode}
                    onChange={(value) => {
                        setMode(value);
                        setError('');
                    }}
                    options={[
                        { value: 'reply', label: 'Reply to student' },
                        { value: 'note', label: 'Internal note' },
                    ]}
                    className='self-start'
                />
            )}
            <Textarea
                rows={4}
                value={text}
                onChange={(event) => {
                    setText(event.target.value);
                    setError('');
                }}
                onKeyDown={(event) => {
                    if (
                        (event.metaKey || event.ctrlKey) &&
                        event.key === 'Enter'
                    ) {
                        event.preventDefault();
                        send();
                    }
                }}
                maxLength={4000}
                placeholder={
                    note ? 'What should the team know?' : 'Write your reply…'
                }
                aria-label={note ? 'Internal note' : 'Reply'}
                aria-invalid={error ? true : undefined}
            />
            {error && (
                <p role='alert' className='text-[12.5px] text-bad-ink'>
                    {error}
                </p>
            )}
            <div className='flex flex-wrap items-center gap-2'>
                <span className='flex-1 min-w-[200px] text-[12.5px] text-muted'>
                    {hint}
                </span>
                {note ? (
                    <Button
                        type='submit'
                        variant='dark'
                        icon={sending ? Loader2 : StickyNote}
                        disabled={Boolean(sending)}
                        className={spinner('note')}
                    >
                        Add note
                    </Button>
                ) : (
                    <>
                        <Button
                            icon={
                                sending === 'resolved' ? Loader2 : CheckCircle2
                            }
                            disabled={Boolean(sending)}
                            onClick={() => send('resolved')}
                            className={spinner('resolved')}
                        >
                            Send & resolve
                        </Button>
                        <Button
                            type='submit'
                            variant='primary'
                            icon={sending === 'reply' ? Loader2 : Send}
                            disabled={Boolean(sending)}
                            className={spinner('reply')}
                        >
                            Send reply
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}

function PaneSkeleton() {
    return (
        <div
            role='status'
            aria-label='Loading ticket'
            className='flex flex-col gap-3 p-6'
        >
            <Skeleton className='h-3 w-40' />
            <Skeleton className='h-7 w-3/4' />
            <Skeleton className='h-5 w-56' />
            <div className='flex flex-col gap-3 pt-6'>
                <Skeleton className='h-16 w-3/4' />
                <Skeleton className='h-16 w-2/3 self-end' />
            </div>
        </div>
    );
}

/**
 * One ticket: who sent it, its details, the conversation and the reply box.
 * Opening it marks the student's messages as read.
 */
export default function TicketPane({
    ticketId,
    onBack,
    onLoaded,
    onChanged,
    onDeleted,
}) {
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [saving, setSaving] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const threadRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        setError('');
        api.get(`/support/tickets/${ticketId}`, { signal: controller.signal })
            .then(({ data }) => {
                setTicket(data.data.ticket);
                onLoaded?.(data.data.ticket);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setError(
                    err.response?.status === 404
                        ? 'This ticket no longer exists.'
                        : apiErrorMessage(err, 'Couldn’t load this ticket.'),
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [ticketId, reload, onLoaded]);

    // Pick up replies that arrived while the tab was in the background.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible')
                setReload((value) => value + 1);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () =>
            document.removeEventListener('visibilitychange', onVisible);
    }, []);

    // Keep the newest message in view.
    const messageCount = ticket?.messages.length || 0;
    useEffect(() => {
        const thread = threadRef.current;
        if (thread) thread.scrollTop = thread.scrollHeight;
    }, [messageCount]);

    const patch = async (field, value) => {
        if (!ticket || ticket[field] === value) return;
        setSaving(field);
        try {
            const { data } = await api.patch(`/support/tickets/${ticketId}`, {
                [field]: value,
            });
            setTicket(data.data.ticket);
            onChanged?.();
            toast.success(SAVED[field]);
        } catch (err) {
            toast.error(apiErrorMessage(err, 'Couldn’t save that change.'));
        } finally {
            setSaving('');
        }
    };

    const remove = async () => {
        try {
            await api.delete(`/support/tickets/${ticketId}`);
            toast.success('Ticket deleted');
            onDeleted?.();
        } catch (err) {
            toast.error(apiErrorMessage(err, 'Couldn’t delete the ticket.'));
        }
    };

    const back = (
        <div className='lg:hidden px-4 pt-4'>
            <Button variant='ghost' size='sm' icon={ArrowLeft} onClick={onBack}>
                All tickets
            </Button>
        </div>
    );

    if (loading && !ticket) return <PaneSkeleton />;
    if (!ticket) {
        return (
            <div className='flex flex-col'>
                {back}
                <div className='p-6'>
                    <Alert
                        tone='bad'
                        action={
                            <Button
                                size='sm'
                                onClick={() => setReload((value) => value + 1)}
                            >
                                Try again
                            </Button>
                        }
                    >
                        {error || 'Couldn’t load this ticket.'}
                    </Alert>
                </div>
            </div>
        );
    }

    const context = ticket.context || {};
    const source = [
        SOURCE_LABELS[ticket.source] || ticket.source,
        PLATFORMS[context.platform],
        context.appVersion && `v${context.appVersion}`,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <section
            aria-label={`Ticket ${ticketRef(ticket)}`}
            className='flex flex-col min-w-0'
        >
            {back}
            <header className='flex flex-wrap items-start gap-3 px-6 py-5 border-b border-line-soft'>
                <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                    <span className='eyebrow'>
                        {ticketRef(ticket)} ·{' '}
                        {CATEGORY_LABELS[ticket.category] || 'Other'}
                    </span>
                    <h2 className='font-serif font-bold text-2xl leading-tight text-ink break-words'>
                        {ticket.subject}
                    </h2>
                    <div className='flex flex-wrap items-center gap-2'>
                        <TicketStatusBadge status={ticket.status} />
                        {ticket.priority === 'high' && (
                            <StatusBadge tone='bad'>High priority</StatusBadge>
                        )}
                        <span className='text-[13px] text-muted'>
                            Opened {formatDateTime(ticket.createdAt)}
                        </span>
                    </div>
                </div>
                {user?.role === 'Admin' && (
                    <Button
                        variant='danger'
                        iconOnly
                        icon={Trash2}
                        aria-label='Delete ticket'
                        onClick={() => setConfirmDelete(true)}
                    />
                )}
            </header>

            <div className='grid gap-6 px-6 py-5 border-b border-line-soft xl:grid-cols-2'>
                <div className='flex flex-col gap-3 min-w-0'>
                    <Requester ticket={ticket} />
                    <Notices ticket={ticket} />
                </div>
                <MetaList
                    labelWidth={76}
                    className='self-start'
                    items={[
                        {
                            label: 'Status',
                            value: (
                                <Select
                                    aria-label='Status'
                                    value={ticket.status}
                                    disabled={saving === 'status'}
                                    onChange={(event) =>
                                        patch('status', event.target.value)
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            ),
                        },
                        {
                            label: 'Priority',
                            value: (
                                <Select
                                    aria-label='Priority'
                                    value={ticket.priority}
                                    disabled={saving === 'priority'}
                                    onChange={(event) =>
                                        patch('priority', event.target.value)
                                    }
                                    options={PRIORITY_OPTIONS}
                                />
                            ),
                        },
                        {
                            label: 'Category',
                            value: (
                                <Select
                                    aria-label='Category'
                                    value={ticket.category}
                                    disabled={saving === 'category'}
                                    onChange={(event) =>
                                        patch('category', event.target.value)
                                    }
                                    options={CATEGORY_OPTIONS}
                                />
                            ),
                        },
                        { label: 'From', value: source },
                        {
                            label: 'Reason',
                            value:
                                context.reason &&
                                (REPORT_REASON_LABELS[context.reason] ||
                                    context.reason),
                        },
                        {
                            label: 'Page',
                            value: context.url && (
                                <a
                                    href={context.url}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex items-start gap-1 text-link hover:underline break-all'
                                >
                                    {context.url}
                                    <ExternalLink
                                        className='w-3.5 h-3.5 mt-0.5 shrink-0'
                                        aria-hidden='true'
                                    />
                                </a>
                            ),
                        },
                    ]}
                />
            </div>

            <ol
                ref={threadRef}
                aria-label='Conversation'
                className='flex flex-col gap-4 m-0 px-6 py-5 list-none lg:max-h-[52vh] lg:overflow-y-auto'
            >
                {ticket.messages.map((message) => (
                    <Message
                        key={message._id}
                        message={message}
                        ticket={ticket}
                    />
                ))}
            </ol>

            <Composer
                key={ticket._id}
                ticket={ticket}
                onSent={(next) => {
                    setTicket(next);
                    onChanged?.();
                }}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={remove}
                title={`Delete ticket ${ticketRef(ticket)}?`}
                message='The conversation is removed for everyone, including the student. This can’t be undone.'
                confirmText='Delete ticket'
                variant='danger'
            />
        </section>
    );
}
