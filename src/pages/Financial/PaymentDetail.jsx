import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, CreditCard, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import { formatDateTime, formatNumber } from '../../utils/format';
import Loader from '../../components/Common/Loader';
import {
    Button,
    EmptyState,
    MetaList,
    PageHeader,
    Panel,
    Segmented,
    StatusBadge,
} from '../../components/ui';
import {
    copyText,
    formatMoney,
    formatOrderAmount,
    formatRupees,
    isObjectId,
    orderTypeLabel,
    paymentMethodLabel,
    userName,
} from './financeFormat';
import { RupeeValue, UserCell } from './financeParts';

const ExternalValue = ({ href }) => (
    <a
        href={href}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-1 text-link hover:underline break-all'
    >
        {href}
        <ExternalLink className='w-3 h-3 shrink-0' aria-hidden='true' />
    </a>
);

const PaymentDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState(null);
    const [viewMode, setViewMode] = useState('formatted');

    const fetchPayment = async () => {
        try {
            setError(null);
            const res = await api.get(`/payment/${id}`);
            setPayment(res.data.data || res.data);
        } catch (err) {
            setError(
                err.response?.status === 404
                    ? 'This payment doesn’t exist or the link is wrong.'
                    : 'Couldn’t load this payment. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return <Loader />;
    }

    if (error || !payment) {
        return (
            <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
                <div className='bg-sheet border border-line rounded-xl'>
                    <EmptyState
                        icon={CreditCard}
                        tone='error'
                        title={
                            error?.startsWith('This payment doesn’t')
                                ? 'Payment not found'
                                : 'Couldn’t load the payment'
                        }
                        description={error}
                        action={
                            <div className='flex flex-wrap justify-center gap-2'>
                                <Button to='/reports/payments'>
                                    Back to payments
                                </Button>
                                <Button
                                    variant='primary'
                                    onClick={() => {
                                        setLoading(true);
                                        fetchPayment();
                                    }}
                                >
                                    Try again
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const order =
        payment.orderId && typeof payment.orderId === 'object'
            ? payment.orderId
            : null;
    const gateway = payment.gatewayResponse || {};
    const gatewayPaymentId = gateway.razorpay_payment_id;
    const returnUrl = order?.metadata?.returnUrl || gateway.returnUrl;
    const resource =
        order?.resourceId && typeof order.resourceId === 'object'
            ? order.resourceId
            : null;
    const isInr = !payment.currency || payment.currency === 'INR';
    const hasRefund = Boolean(
        payment.refundId || payment.refundAmount || payment.refundReason,
    );

    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12'>
            <PageHeader
                eyebrow={`Payment · ${payment.provider || 'Unknown provider'}`}
                badge={<StatusBadge status={payment.status} />}
                title={
                    isInr ? (
                        <RupeeValue amount={payment.amount} />
                    ) : (
                        formatMoney(payment.amount, payment.currency)
                    )
                }
                meta={
                    <p className='text-[13px] text-ink-2'>
                        {order ? orderTypeLabel(order.orderType) : 'Payment'} by{' '}
                        {payment.user?._id ? (
                            <Link
                                to={`/users/${payment.user._id}`}
                                className='font-medium text-link hover:underline'
                            >
                                {userName(payment.user)}
                            </Link>
                        ) : (
                            <span className='font-medium'>
                                {userName(payment.user)}
                            </span>
                        )}{' '}
                        · {formatDateTime(payment.createdAt)}
                    </p>
                }
                actions={
                    <>
                        <Segmented
                            label='View'
                            value={viewMode}
                            onChange={setViewMode}
                            options={[
                                { value: 'formatted', label: 'Details' },
                                { value: 'raw', label: 'JSON' },
                            ]}
                        />
                        <Button
                            icon={Copy}
                            onClick={() =>
                                gatewayPaymentId
                                    ? copyText(
                                          gatewayPaymentId,
                                          'Razorpay payment ID',
                                      )
                                    : copyText(payment._id, 'Payment ID')
                            }
                        >
                            Copy payment ID
                        </Button>
                    </>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start'>
                <div className='flex flex-col gap-5 min-w-0'>
                    {viewMode === 'formatted' ? (
                        <>
                            <Panel
                                title='Gateway'
                                titleId='gateway-title'
                                bodyClassName='px-5 py-4'
                            >
                                <MetaList
                                    labelWidth={148}
                                    items={[
                                        {
                                            label: 'Provider',
                                            value: payment.provider,
                                        },
                                        {
                                            label: 'Razorpay payment ID',
                                            value: gatewayPaymentId,
                                            mono: true,
                                        },
                                        {
                                            label: 'Gateway order ID',
                                            value: payment.gatewayOrderId,
                                            mono: true,
                                        },
                                        {
                                            label: 'Merchant order ID',
                                            value: payment.merchantOrderId,
                                            mono: true,
                                        },
                                        {
                                            label: 'Amount',
                                            value: `${payment.currency || 'INR'} ${Number(
                                                payment.amount || 0,
                                            ).toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}`,
                                            mono: true,
                                        },
                                        {
                                            label: 'Webhook',
                                            value: payment.webhookReceived ? (
                                                <span className='inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-ok-ink'>
                                                    <Check
                                                        className='w-3.5 h-3.5'
                                                        aria-hidden='true'
                                                    />
                                                    Received
                                                    {gateway.webhookEvent && (
                                                        <span className='font-mono text-xs text-muted'>
                                                            {
                                                                gateway.webhookEvent
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                'Not received'
                                            ),
                                        },
                                        {
                                            label: 'Gateway status',
                                            value: gateway.state && (
                                                <>
                                                    {gateway.state}
                                                    {gateway.orderId && (
                                                        <span className='block text-xs text-muted'>
                                                            Order:{' '}
                                                            {gateway.orderId}
                                                        </span>
                                                    )}
                                                </>
                                            ),
                                        },
                                        {
                                            label: 'Payment link',
                                            value: payment.paymentLink && (
                                                <ExternalValue
                                                    href={payment.paymentLink}
                                                />
                                            ),
                                        },
                                        {
                                            label: 'Return URL',
                                            value: returnUrl && (
                                                <ExternalValue
                                                    href={returnUrl}
                                                />
                                            ),
                                        },
                                        {
                                            label: 'Created',
                                            value: formatDateTime(
                                                payment.createdAt,
                                            ),
                                        },
                                        {
                                            label: 'Updated',
                                            value: formatDateTime(
                                                payment.updatedAt,
                                            ),
                                        },
                                        {
                                            label: 'Record ID',
                                            value: payment._id,
                                            mono: true,
                                        },
                                    ]}
                                />
                            </Panel>

                            {order?.resourceId && (
                                <Panel
                                    title='Purchased item'
                                    titleId='item-title'
                                    bodyClassName='px-5 py-4'
                                >
                                    <MetaList
                                        labelWidth={148}
                                        items={[
                                            {
                                                label: 'Title',
                                                value:
                                                    resource?.title ||
                                                    order.metadata
                                                        ?.resourceTitle ||
                                                    'Unknown title',
                                            },
                                            {
                                                label: 'Type',
                                                value: orderTypeLabel(
                                                    order.orderType,
                                                ),
                                            },
                                            {
                                                label: 'Subject',
                                                value:
                                                    typeof resource?.subject ===
                                                        'string' &&
                                                    !isObjectId(
                                                        resource.subject,
                                                    )
                                                        ? resource.subject
                                                        : undefined,
                                            },
                                        ]}
                                    />
                                </Panel>
                            )}
                        </>
                    ) : (
                        <Panel
                            title='Raw data'
                            titleId='raw-title'
                            bodyClassName='p-4'
                        >
                            <pre className='max-h-[640px] overflow-auto p-3 rounded-lg bg-sunken font-mono text-[11.5px] leading-relaxed text-ink-2'>
                                {JSON.stringify(payment, null, 2)}
                            </pre>
                        </Panel>
                    )}
                </div>

                <div className='flex flex-col gap-4'>
                    <Panel
                        title='Paid by'
                        titleId='user-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        <UserCell
                            user={payment.user}
                            size='md'
                            stopPropagation={false}
                        />
                        {payment.user?.wallet?.currentBalance !== undefined && (
                            <MetaList
                                labelWidth={112}
                                items={[
                                    {
                                        label: 'Wallet balance',
                                        value: `${formatNumber(payment.user.wallet.currentBalance)} pts`,
                                    },
                                ]}
                            />
                        )}
                    </Panel>

                    <Panel
                        title='Order'
                        titleId='order-title'
                        action={
                            order?.status && (
                                <StatusBadge status={order.status} />
                            )
                        }
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        {order ? (
                            <>
                                <MetaList
                                    labelWidth={112}
                                    items={[
                                        {
                                            label: 'Type',
                                            value: orderTypeLabel(
                                                order.orderType,
                                            ),
                                        },
                                        {
                                            label: 'Method',
                                            value:
                                                order.paymentMethod ===
                                                    'online' && payment.provider
                                                    ? `Online (${payment.provider})`
                                                    : paymentMethodLabel(
                                                          order.paymentMethod,
                                                      ),
                                        },
                                        {
                                            label: 'Amount',
                                            value: formatOrderAmount(order),
                                            mono: true,
                                        },
                                        order.orderType === 'add_points' &&
                                            order.paymentMethod !==
                                                'points' && {
                                                label: 'Points to add',
                                                value: `${formatNumber(
                                                    Number(order.amount || 0) *
                                                        5,
                                                )} pts`,
                                            },
                                        {
                                            label: 'Failure',
                                            value: order.failureReason,
                                        },
                                        {
                                            label: 'Created',
                                            value: formatDateTime(
                                                order.createdAt,
                                            ),
                                        },
                                    ]}
                                />
                                <Link
                                    to={`/reports/orders?search=${order._id}`}
                                    className='self-start text-[13px] font-medium text-link hover:underline'
                                >
                                    Open in Orders
                                </Link>
                            </>
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No order is linked to this payment.
                            </p>
                        )}
                    </Panel>

                    <Panel
                        title='Refund'
                        titleId='refund-title'
                        bodyClassName='px-5 py-4 flex flex-col gap-3'
                    >
                        {hasRefund ? (
                            <MetaList
                                labelWidth={112}
                                items={[
                                    {
                                        label: 'Amount',
                                        value:
                                            payment.refundAmount != null
                                                ? formatRupees(
                                                      payment.refundAmount,
                                                  )
                                                : undefined,
                                        mono: true,
                                    },
                                    {
                                        label: 'Refund ID',
                                        value: payment.refundId,
                                        mono: true,
                                    },
                                    {
                                        label: 'Reason',
                                        value: payment.refundReason,
                                    },
                                ]}
                            />
                        ) : (
                            <p className='text-[13.5px] text-muted'>
                                No refund recorded for this payment.
                            </p>
                        )}
                        <Link
                            to='/reports/refunds'
                            className='self-start text-[13px] font-medium text-link hover:underline'
                        >
                            Open refund requests
                        </Link>
                    </Panel>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetail;
