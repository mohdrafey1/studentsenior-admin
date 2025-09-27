import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Wallet,
    Hash,
    CalendarDays,
    User2,
} from 'lucide-react';

const Badge = ({ color = 'gray', children }) => {
    const map = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return (
        <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${map[color]}`}
        >
            {children}
        </span>
    );
};

const PaymentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState(null);
    const [showRaw, setShowRaw] = useState(false);

    const fetchPayment = async () => {
        try {
            setError(null);
            const res = await api.get(`/transactions/payments/${id}`);
            setPayment(res.data.data || res.data);
        } catch (err) {
            console.error('Failed to load payment', err);
            setError('Failed to load payment details');
            toast.error('Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const statusMeta = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'paid':
                return { icon: CheckCircle2, color: 'green', label: 'Paid' };
            case 'pending':
                return { icon: Clock, color: 'yellow', label: 'Pending' };
            case 'failed':
                return { icon: XCircle, color: 'red', label: 'Failed' };
            case 'refunded':
                return { icon: XCircle, color: 'blue', label: 'Refunded' };
            default:
                return {
                    icon: Clock,
                    color: 'gray',
                    label: status || 'Unknown',
                };
        }
    };

    const typeColor = (type) => {
        switch (type) {
            case 'note_purchase':
                return 'purple';
            case 'pyq_purchase':
                return 'indigo';
            case 'course_purchase':
                return 'blue';
            case 'add_points':
                return 'amber';
            default:
                return 'gray';
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
                    <div className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
                        <CreditCard className='w-5 h-5 animate-pulse' />
                        Loading payment...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
                    <div className='bg-red-50 dark:bg-red-900/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded'>
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!payment) return null;

    const { icon: StatusIcon, color } = statusMeta(payment.status);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <main className='pt-6 pb-12'>
                <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center'>
                            <button
                                onClick={() => navigate(-1)}
                                className='mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5' />
                            </button>
                            <div className='flex items-center'>
                                <div className='bg-green-600 text-white p-3 rounded-lg mr-4'>
                                    <CreditCard className='w-6 h-6' />
                                </div>
                                <div>
                                    <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
                                        Payment Details
                                    </h1>
                                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                                        Transaction overview and metadata
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Badge color={color}>
                            <div className='inline-flex items-center gap-1'>
                                <StatusIcon className='w-4 h-4' />
                                {payment.status}
                            </div>
                        </Badge>
                    </div>

                    {/* Summary Cards */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5'>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                Amount
                            </div>
                            <div className='mt-1 text-2xl font-semibold text-gray-900 dark:text-white'>
                                {payment.currency || '₹'} {payment.amount || 0}
                            </div>
                        </div>
                        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5'>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                Type
                            </div>
                            <div className='mt-1 text-lg font-medium text-gray-900 dark:text-white'>
                                <Badge
                                    color={typeColor(payment.typeOfPurchase)}
                                >
                                    {payment.typeOfPurchase?.replace(
                                        '_',
                                        ' ',
                                    ) || 'N/A'}
                                </Badge>
                            </div>
                        </div>
                        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5'>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                                Date
                            </div>
                            <div className='mt-1 text-lg font-medium text-gray-900 dark:text-white inline-flex items-center gap-2'>
                                <CalendarDays className='w-4 h-4' />
                                {payment.createdAt
                                    ? new Date(
                                          payment.createdAt,
                                      ).toLocaleString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        {/* Left column */}
                        <div className='lg:col-span-2 space-y-6'>
                            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                                    Transaction Info
                                </h2>
                                <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4'>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <Wallet className='w-4 h-4' />{' '}
                                            Payment Method
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                            {payment.paymentMethod ||
                                                payment.provider ||
                                                'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <Hash className='w-4 h-4' />{' '}
                                            Merchant Order ID
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white break-all'>
                                            {payment.merchantOrderId || 'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <Hash className='w-4 h-4' />{' '}
                                            Transaction ID
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white break-all'>
                                            {payment.transactionId ||
                                                payment.referenceId ||
                                                payment._id}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <Hash className='w-4 h-4' />{' '}
                                            Order/Receipt ID
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white break-all'>
                                            {payment.orderId ||
                                                payment.receipt ||
                                                'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <Hash className='w-4 h-4' /> PhonePe
                                            Order ID
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white break-all'>
                                            {payment.phonePeOrderId || 'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                            <CalendarDays className='w-4 h-4' />{' '}
                                            Updated At
                                        </dt>
                                        <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                            {payment.updatedAt
                                                ? new Date(
                                                      payment.updatedAt,
                                                  ).toLocaleString()
                                                : 'N/A'}
                                        </dd>
                                    </div>
                                    {payment.paymentResponse?.state && (
                                        <div className='sm:col-span-2'>
                                            <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                                <Hash className='w-4 h-4' />{' '}
                                                Gateway Status
                                            </dt>
                                            <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                                {payment.paymentResponse.state}
                                                {payment.paymentResponse
                                                    .orderId && (
                                                    <span className='text-gray-500 dark:text-gray-400'>
                                                        {' '}
                                                        {' • '}Order:{' '}
                                                        {
                                                            payment
                                                                .paymentResponse
                                                                .orderId
                                                        }
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                    {(payment.paymentLink ||
                                        payment.paymentResponse?.redirectUrl ||
                                        payment.redirectBackUrl) && (
                                        <div className='sm:col-span-2'>
                                            <dt className='text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2'>
                                                <Hash className='w-4 h-4' />{' '}
                                                Links
                                            </dt>
                                            <dd className='mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 break-all space-y-1'>
                                                {payment.redirectBackUrl && (
                                                    <div>
                                                        <a
                                                            className='hover:underline'
                                                            href={
                                                                payment.redirectBackUrl
                                                            }
                                                            target='_blank'
                                                            rel='noreferrer'
                                                        >
                                                            Resource URL
                                                        </a>
                                                    </div>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            {payment.purchaseItemId && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                                        Purchased Item
                                    </h2>
                                    <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4'>
                                        <div>
                                            <dt className='text-sm text-gray-500 dark:text-gray-400'>
                                                Slug
                                            </dt>
                                            <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white break-all'>
                                                {payment.purchaseItemId.slug ||
                                                    'N/A'}
                                            </dd>
                                        </div>
                                        {typeof payment.purchaseItemId.price !==
                                            'undefined' && (
                                            <div>
                                                <dt className='text-sm text-gray-500 dark:text-gray-400'>
                                                    Item Price
                                                </dt>
                                                <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                                    {
                                                        payment.purchaseItemId
                                                            .price
                                                    }
                                                </dd>
                                            </div>
                                        )}
                                        {payment.purchaseItemId.examType && (
                                            <div>
                                                <dt className='text-sm text-gray-500 dark:text-gray-400'>
                                                    Exam Type
                                                </dt>
                                                <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                                    {
                                                        payment.purchaseItemId
                                                            .examType
                                                    }
                                                </dd>
                                            </div>
                                        )}
                                        {payment.purchaseItemId.year && (
                                            <div>
                                                <dt className='text-sm text-gray-500 dark:text-gray-400'>
                                                    Year
                                                </dt>
                                                <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                                    {
                                                        payment.purchaseItemId
                                                            .year
                                                    }
                                                </dd>
                                            </div>
                                        )}
                                        {typeof payment.purchaseItemId
                                            .solved !== 'undefined' && (
                                            <div>
                                                <dt className='text-sm text-gray-500 dark:text-gray-400'>
                                                    Solved
                                                </dt>
                                                <dd className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>
                                                    {payment.purchaseItemId
                                                        .solved
                                                        ? 'Yes'
                                                        : 'No'}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}

                            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                                <div className='flex items-center justify-between'>
                                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                        Raw Payload
                                    </h2>
                                    <button
                                        onClick={() => setShowRaw((v) => !v)}
                                        className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
                                    >
                                        {showRaw ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {showRaw && (
                                    <pre className='mt-4 text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'>
                                        {JSON.stringify(payment, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className='space-y-6'>
                            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                                    User
                                </h2>
                                <div className='flex items-start gap-3'>
                                    <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center'>
                                        <User2 className='w-5 h-5 text-blue-600 dark:text-blue-300' />
                                    </div>
                                    <div>
                                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                            {payment.user?.username ||
                                                payment.user?.name ||
                                                'N/A'}
                                        </div>
                                        <div className='text-sm text-gray-600 dark:text-gray-300'>
                                            {payment.user?.email || 'N/A'}
                                        </div>
                                        {payment.user?.phone && (
                                            <div className='text-sm text-gray-600 dark:text-gray-300'>
                                                {payment.user?.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(payment.college ||
                                payment.course ||
                                payment.branch) && (
                                <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                                        Context
                                    </h2>
                                    <dl className='space-y-2'>
                                        {payment.college && (
                                            <div>
                                                <dt className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                                    College
                                                </dt>
                                                <dd className='text-sm text-gray-900 dark:text-white'>
                                                    {payment.college?.name ||
                                                        payment.college}
                                                </dd>
                                            </div>
                                        )}
                                        {payment.course && (
                                            <div>
                                                <dt className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                                    Course
                                                </dt>
                                                <dd className='text-sm text-gray-900 dark:text-white'>
                                                    {payment.course?.name ||
                                                        payment.course}
                                                </dd>
                                            </div>
                                        )}
                                        {payment.branch && (
                                            <div>
                                                <dt className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                                                    Branch
                                                </dt>
                                                <dd className='text-sm text-gray-900 dark:text-white'>
                                                    {payment.branch?.name ||
                                                        payment.branch}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentDetail;
