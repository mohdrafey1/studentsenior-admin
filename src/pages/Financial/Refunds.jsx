import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, RotateCcw, X } from 'lucide-react';
import api, { apiErrorMessage } from '../../utils/api';
import { formatDateTime } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import Pagination from '../../components/Pagination';
import {
    Alert,
    Button,
    Dialog,
    EmptyState,
    Field,
    MetaList,
    PageHeader,
    SkeletonRows,
    StatusBadge,
    Tabs,
    Textarea,
} from '../../components/ui';
import {
    formatOrderAmount,
    formatPts,
    formatRupees,
    orderTypeLabel,
    paymentMethodLabel,
    userName,
} from './financeFormat';
import { SerifSafe } from './financeParts';

const LIMIT = 20;

const STATUS_TABS = [
    ['', 'All'],
    ['requested', 'Requested'],
    ['reviewing', 'Reviewing'],
    ['processing', 'Processing'],
    ['provider_pending', 'Waiting for provider'],
    ['needs_reconciliation', 'Needs reconciliation'],
    ['refunded', 'Refunded'],
    ['rejected', 'Rejected'],
];

const AWAITING_REVIEW = ['requested', 'reviewing'];

const orderOf = (item) =>
    item.orderId && typeof item.orderId === 'object' ? item.orderId : null;

const amountOf = (item) => {
    const order = orderOf(item);
    return order && order.amount !== undefined
        ? formatOrderAmount(order)
        : 'Amount unknown';
};

const handle = (item) =>
    item.user?.username ? `@${item.user.username}` : userName(item.user);

/** What approving does to money and access, per refund.service processRefund. */
const approvalImpact = (item) => {
    const order = orderOf(item);
    if (!order) return 'The order for this request couldn’t be loaded.';
    const who = handle(item);
    const points = order.paymentMethod === 'points';
    const credited = points
        ? Number(order.amount || 0)
        : Number(order.amount || 0) * 5;
    const content = order.orderType === 'pyq_purchase' ? 'PYQ' : 'note';
    if (points) {
        return `Returns ${formatPts(order.amount)} to ${who}’s wallet straight away, takes back the ${formatPts(credited)} the uploader and StudentSenior earned from the sale, and removes ${who}’s access to the ${content}.`;
    }
    if (order.orderType === 'add_points') {
        return `Sends ${formatRupees(order.amount)} back to ${who} through Razorpay and takes back the ${formatPts(credited)} this top-up added to their wallet.`;
    }
    return `Sends ${formatRupees(order.amount)} back to ${who} through Razorpay and takes back the ${formatPts(credited)} the uploader and StudentSenior earned from the sale. ${who} loses access to the ${content} once Razorpay confirms.`;
};

const PROGRESS_NOTES = {
    processing: [
        'info',
        'Approved. The refund is being sent to Razorpay, and the reserved points stay held until it settles.',
    ],
    provider_pending: [
        'info',
        'Razorpay accepted the refund and is sending the money back. This moves to Refunded when they confirm it.',
    ],
    needs_reconciliation: [
        'bad',
        'Razorpay didn’t confirm this refund, so its outcome is unknown. The reserved points stay held and the refund is checked again automatically. Look the payment up in Razorpay before doing anything by hand.',
    ],
    refunded: ['ok', 'Refunded.'],
};

function RefundDetail({ item, busy, onApprove, onReject }) {
    const order = orderOf(item);
    const actionable = AWAITING_REVIEW.includes(item.status);
    const isIap = order?.paymentMethod === 'iap';
    const progress = PROGRESS_NOTES[item.status];

    return (
        <section
            aria-label='Selected request'
            className='bg-sheet border border-line rounded-xl overflow-hidden'
        >
            <div className='flex flex-wrap items-start gap-3 px-5 py-4 border-b border-line-soft'>
                <div className='flex-1 min-w-[200px] flex flex-col gap-1'>
                    <span className='text-[13px] text-ink-2'>
                        Refund for{' '}
                        {item.user?._id ? (
                            <Link
                                to={`/users/${item.user._id}`}
                                className='font-medium text-link hover:underline'
                            >
                                {handle(item)}
                            </Link>
                        ) : (
                            <span className='font-medium'>{handle(item)}</span>
                        )}{' '}
                        · requested {relativeTime(item.createdAt)}
                    </span>
                    <h2 className='font-serif font-bold text-[22px] leading-tight text-ink'>
                        <SerifSafe
                            text={`${amountOf(item)} · ${order ? orderTypeLabel(order.orderType) : 'Order'}`}
                        />
                    </h2>
                </div>
                <StatusBadge status={item.status} />
            </div>

            <div className='flex flex-col gap-5 px-5 py-5'>
                <div className='flex flex-col gap-1.5'>
                    <span className='eyebrow'>Student’s reason</span>
                    <p className='text-[14px] leading-relaxed text-ink'>
                        {item.reason ? `“${item.reason}”` : 'No reason given.'}
                    </p>
                </div>

                <MetaList
                    labelWidth={132}
                    items={[
                        {
                            label: 'Order',
                            value: order?._id,
                            mono: true,
                        },
                        {
                            label: 'Paid with',
                            value: order
                                ? paymentMethodLabel(order.paymentMethod)
                                : undefined,
                        },
                        {
                            label: 'Amount',
                            value: order ? amountOf(item) : undefined,
                        },
                        {
                            label: 'Order status',
                            value: order?.status && (
                                <StatusBadge status={order.status} />
                            ),
                        },
                        {
                            label: 'Requested',
                            value: formatDateTime(item.createdAt),
                        },
                        {
                            label: 'Last updated',
                            value: item.updatedAt
                                ? formatDateTime(item.updatedAt)
                                : undefined,
                        },
                        {
                            label: 'Provider refund',
                            value: item.providerRefundId,
                            mono: true,
                        },
                        { label: 'Staff note', value: item.staffNote },
                        {
                            label: 'Request ID',
                            value: item._id,
                            mono: true,
                        },
                    ]}
                />

                {actionable ? (
                    <>
                        {isIap ? (
                            <Alert tone='warn'>
                                Paid through Google Play. Refund it in Play
                                Console; store reconciliation then updates
                                access. Here you can only reject the request.
                            </Alert>
                        ) : (
                            <Alert tone='info'>
                                {approvalImpact(item)} If a wallet no longer has
                                those points, the approval is refused.
                            </Alert>
                        )}
                        <div className='flex flex-wrap justify-end gap-2'>
                            <Button
                                variant='danger'
                                icon={X}
                                disabled={busy}
                                onClick={() => onReject(item)}
                            >
                                Reject…
                            </Button>
                            {!isIap && (
                                <Button
                                    variant='primary'
                                    icon={Check}
                                    disabled={busy}
                                    onClick={() => onApprove(item)}
                                >
                                    Approve full refund
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    progress && <Alert tone={progress[0]}>{progress[1]}</Alert>
                )}
            </div>
        </section>
    );
}

export default function Refunds() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [revision, setRevision] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [approving, setApproving] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [note, setNote] = useState('');
    const [noteError, setNoteError] = useState('');
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        api.get('/refunds', {
            signal: controller.signal,
            params: { page, limit: LIMIT, ...(status ? { status } : {}) },
        })
            .then(({ data }) => {
                setItems(data.data.requests);
                setPages(data.data.pagination.totalPages);
                setTotalItems(data.data.pagination.totalItems);
            })
            .catch((err) => {
                if (!controller.signal.aborted) setError(apiErrorMessage(err));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [page, status, revision]);

    const review = async (item, decision, reviewNote = '') => {
        setBusy(item._id);
        setActionError('');
        try {
            const { data } = await api.post(`/refunds/${item._id}/review`, {
                decision,
                note: reviewNote,
            });
            const next = data?.data?.status;
            if (decision === 'reject') toast.success('Refund request rejected');
            else if (next === 'refunded') toast.success('Refund completed');
            else if (next === 'needs_reconciliation')
                toast.error(
                    'Razorpay didn’t confirm the refund. It needs reconciling.',
                );
            else toast.success('Refund approved and sent to Razorpay');
            setApproving(null);
            setRejecting(null);
            setRevision((value) => value + 1);
        } catch (err) {
            setActionError(apiErrorMessage(err));
        } finally {
            setBusy('');
        }
    };

    const openReject = (item) => {
        setNote('');
        setNoteError('');
        setActionError('');
        setRejecting(item);
    };
    const openApprove = (item) => {
        setActionError('');
        setApproving(item);
    };
    const submitReject = () => {
        if (!note.trim()) {
            setNoteError('Add a reason so the student knows why.');
            return;
        }
        review(rejecting, 'reject', note.trim());
    };

    const selected =
        items.find((item) => item._id === selectedId) || items[0] || null;

    const detail = (item) => (
        <RefundDetail
            item={item}
            busy={Boolean(busy)}
            onApprove={openApprove}
            onReject={openReject}
        />
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                title='Refund requests'
                description='Refunds stay in progress until the provider confirms them. Google Play refunds are handled in Play Console.'
            />

            <Tabs
                label='Refund status'
                className='mb-5'
                value={status}
                onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                    setSelectedId(null);
                }}
                items={STATUS_TABS.map(([value, label]) => ({
                    value,
                    label,
                }))}
            />

            {error && (
                <Alert
                    tone='bad'
                    className='mb-4'
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

            {loading ? (
                <div className='bg-sheet border border-line rounded-xl overflow-hidden'>
                    <SkeletonRows rows={6} />
                </div>
            ) : items.length === 0 ? (
                !error && (
                    <div className='bg-sheet border border-line rounded-xl'>
                        <EmptyState
                            icon={RotateCcw}
                            tone={status === 'requested' ? 'done' : 'neutral'}
                            title={
                                status === 'requested'
                                    ? 'Nothing waiting for review'
                                    : status
                                      ? 'No requests with this status'
                                      : 'No refund requests yet'
                            }
                            description='Refund requests students send from their orders appear here.'
                        />
                    </div>
                )
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-5 items-start'>
                    <div className='flex flex-col gap-3 min-w-0'>
                        <ul
                            aria-label='Refund requests'
                            className='flex flex-col gap-2'
                        >
                            {items.map((item) => {
                                const on = selected?._id === item._id;
                                const order = orderOf(item);
                                return (
                                    <li
                                        key={item._id}
                                        className='flex flex-col gap-3'
                                    >
                                        <button
                                            type='button'
                                            aria-pressed={on}
                                            onClick={() =>
                                                setSelectedId(item._id)
                                            }
                                            className={`w-full text-left flex flex-col gap-2 px-4 py-3 bg-sheet border rounded-xl cursor-pointer transition-colors ${
                                                on
                                                    ? 'border-brand ring-1 ring-brand'
                                                    : 'border-line hover:border-line-strong'
                                            }`}
                                        >
                                            <span className='flex items-center gap-2'>
                                                <span className='flex-1 min-w-0 truncate font-medium text-ink'>
                                                    {handle(item)}
                                                </span>
                                                <span className='font-mono text-[13px] font-medium text-ink whitespace-nowrap'>
                                                    {amountOf(item)}
                                                </span>
                                            </span>
                                            <span className='text-[13px] text-ink-2 truncate'>
                                                {order
                                                    ? `${orderTypeLabel(order.orderType)} · ${paymentMethodLabel(order.paymentMethod)}`
                                                    : 'Order unavailable'}
                                            </span>
                                            <span className='flex items-center gap-2'>
                                                <span className='flex-1'>
                                                    <StatusBadge
                                                        status={item.status}
                                                    />
                                                </span>
                                                <span className='text-xs text-muted whitespace-nowrap'>
                                                    {relativeTime(
                                                        item.createdAt,
                                                    )}
                                                </span>
                                            </span>
                                        </button>
                                        {on && (
                                            <div className='lg:hidden'>
                                                {detail(item)}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        {(pages > 1 || totalItems > LIMIT) && (
                            <div className='bg-sheet border border-line rounded-xl px-4 py-3'>
                                <Pagination
                                    currentPage={page}
                                    pageSize={LIMIT}
                                    totalItems={
                                        typeof totalItems === 'number'
                                            ? totalItems
                                            : undefined
                                    }
                                    totalPages={pages}
                                    onPageChange={(next) => {
                                        setPage(next);
                                        setSelectedId(null);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div className='hidden lg:block min-w-0 lg:sticky lg:top-6'>
                        {selected && detail(selected)}
                    </div>
                </div>
            )}

            <Dialog
                open={Boolean(approving)}
                onClose={() => setApproving(null)}
                busy={Boolean(busy)}
                size='sm'
                title={
                    approving ? (
                        <SerifSafe
                            text={`Refund ${amountOf(approving)} to ${handle(approving)}?`}
                        />
                    ) : (
                        ''
                    )
                }
                description={approving ? approvalImpact(approving) : ''}
                footer={
                    <>
                        <Button
                            onClick={() => setApproving(null)}
                            disabled={Boolean(busy)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='primary'
                            icon={Check}
                            disabled={Boolean(busy)}
                            onClick={() => review(approving, 'approve')}
                        >
                            {busy ? 'Processing…' : 'Approve full refund'}
                        </Button>
                    </>
                }
            >
                {approving && (
                    <div className='flex flex-col gap-3'>
                        <MetaList
                            labelWidth={88}
                            items={[
                                { label: 'Student', value: handle(approving) },
                                { label: 'Amount', value: amountOf(approving) },
                                {
                                    label: 'Paid with',
                                    value: orderOf(approving)
                                        ? paymentMethodLabel(
                                              orderOf(approving).paymentMethod,
                                          )
                                        : undefined,
                                },
                                {
                                    label: 'Order',
                                    value: orderOf(approving)?._id,
                                    mono: true,
                                },
                            ]}
                        />
                        <p className='text-[13px] text-muted'>
                            This can’t be undone once the money is sent.
                        </p>
                        {actionError && <Alert tone='bad'>{actionError}</Alert>}
                    </div>
                )}
            </Dialog>

            <Dialog
                open={Boolean(rejecting)}
                onClose={() => setRejecting(null)}
                busy={Boolean(busy)}
                size='sm'
                title='Reject this refund request?'
                description={
                    rejecting
                        ? `The ${amountOf(rejecting)} ${orderOf(rejecting) ? orderTypeLabel(orderOf(rejecting).orderType).toLowerCase() : 'order'} by ${handle(rejecting)} stays as it is; no money or points move. Your reason is saved as the staff note.`
                        : ''
                }
                footer={
                    <>
                        <Button
                            onClick={() => setRejecting(null)}
                            disabled={Boolean(busy)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='danger-solid'
                            icon={X}
                            disabled={Boolean(busy)}
                            onClick={submitReject}
                        >
                            {busy ? 'Rejecting…' : 'Reject request'}
                        </Button>
                    </>
                }
            >
                <div className='flex flex-col gap-3'>
                    <Field label='Reason' required error={noteError}>
                        <Textarea
                            value={note}
                            onChange={(event) => {
                                setNote(event.target.value);
                                setNoteError('');
                            }}
                            rows={4}
                            maxLength={2000}
                            placeholder='For example: the points from this top-up were already spent'
                            disabled={Boolean(busy)}
                        />
                    </Field>
                    {actionError && <Alert tone='bad'>{actionError}</Alert>}
                </div>
            </Dialog>
        </div>
    );
}
