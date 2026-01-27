import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useSidebarLayout } from '../../hooks/useSidebarLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Wallet,
    Hash,
    User2,
    Code,
    Eye,
    AlertTriangle,
    ShoppingBag,
    Link as LinkIcon,
} from 'lucide-react';
import BackButton from '../../components/Common/BackButton';
import Loader from '../../components/Common/Loader';

const Badge = ({ color = 'gray', children }) => {
    const map = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return (
        <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${map[color]}`}
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
    const [viewMode, setViewMode] = useState('formatted');
    const { mainContentMargin } = useSidebarLayout();

    const fetchPayment = async () => {
        try {
            setError(null);
            const res = await api.get(`/payment/${id}`);
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
            case 'captured':
                return {
                    icon: CheckCircle2,
                    color: 'green',
                    label: 'Captured',
                };
            case 'pending':
                return { icon: Clock, color: 'yellow', label: 'Pending' };
            case 'created':
                return { icon: Clock, color: 'blue', label: 'Created' };
            case 'failed':
                return { icon: XCircle, color: 'red', label: 'Failed' };
            case 'refunded':
                return { icon: XCircle, color: 'purple', label: 'Refunded' };
            default:
                return {
                    icon: HelpCircle, // helper
                    color: 'gray',
                    label: status || 'Unknown',
                };
        }
    };

    // Helper for unknown icons
    const HelpCircle = (props) => (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <circle cx='12' cy='12' r='10' />
            <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
            <path d='M12 17h.01' />
        </svg>
    );

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <Sidebar />
                <main
                    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${mainContentMargin} transition-all duration-300`}
                >
                    <div className='bg-red-50 dark:bg-red-900/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center justify-between'>
                        <div>{error}</div>
                        <button
                            onClick={() => navigate(-1)}
                            className='text-sm underline hover:text-red-900 dark:hover:text-red-100'
                        >
                            Go Back
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!payment) return null;

    const { icon: StatusIcon } = statusMeta(payment.status);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 font-sans'>
            <Header />
            <Sidebar />
            <main
                className={`py-4 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-4 sm:px-6'>
                    {/* Compact Navigation */}
                    <BackButton
                        title='Payment Details'
                        TitleIcon={CreditCard}
                    />

                    {/* Compact Header */}
                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                        payment.status === 'captured'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    <StatusIcon className='w-3 h-3 mr-1' />
                                    {payment.status}
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                    {new Date(
                                        payment.createdAt,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                type='button'
                                onClick={() =>
                                    setViewMode(
                                        viewMode === 'formatted'
                                            ? 'raw'
                                            : 'formatted',
                                    )
                                }
                                className='inline-flex items-center px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                            >
                                {viewMode === 'formatted' ? (
                                    <>
                                        <Code className='mr-1 h-3 w-3' />
                                        Raw
                                    </>
                                ) : (
                                    <>
                                        <Eye className='mr-1 h-3 w-3' />
                                        Formatted
                                    </>
                                )}
                            </button>
                        </div>
                        <div className='mt-2'>
                            <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {payment.currency || 'INR'}{' '}
                                {payment.amount?.toLocaleString() || 0}
                            </div>
                        </div>
                    </div>

                    {/* Compact Content */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-3'>
                        {/* Main Info (Left Column) */}
                        <div className='lg:col-span-2 space-y-3'>
                            {viewMode === 'formatted' ? (
                                <>
                                    {/* Transaction Info */}
                                    <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                        <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-700'>
                                            <h3 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5'>
                                                <CreditCard className='w-3.5 h-3.5 text-gray-400' />
                                                Transaction Details
                                            </h3>
                                        </div>
                                        <div className='px-3 py-2'>
                                            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2'>
                                                <div>
                                                    <dt className='text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                                        <Wallet className='w-3 h-3' />
                                                        Provider
                                                    </dt>
                                                    <dd className='mt-0.5 text-sm text-gray-900 dark:text-white'>
                                                        {payment.provider ||
                                                            'N/A'}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className='text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                                        <Hash className='w-3 h-3' />
                                                        Payment ID
                                                    </dt>
                                                    <dd className='mt-0.5 font-mono text-gray-900 dark:text-white break-all text-xs'>
                                                        {payment._id}
                                                    </dd>
                                                </div>
                                                <div className='sm:col-span-2'>
                                                    <dt className='text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                                        <Hash className='w-3 h-3' />
                                                        Merchant Order ID
                                                    </dt>
                                                    <dd className='mt-0.5 font-mono text-gray-900 dark:text-white break-all text-xs'>
                                                        {payment.merchantOrderId ||
                                                            'N/A'}
                                                    </dd>
                                                </div>
                                                {payment.gatewayResponse
                                                    ?.state && (
                                                    <div className='sm:col-span-2'>
                                                        <dt className='text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                                            <AlertTriangle className='w-4 h-4' />
                                                            Gateway Status
                                                        </dt>
                                                        <dd className='mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700'>
                                                            {
                                                                payment
                                                                    .gatewayResponse
                                                                    .state
                                                            }
                                                            {payment
                                                                .gatewayResponse
                                                                .orderId && (
                                                                <span className='block mt-1 text-xs text-gray-500'>
                                                                    Order:{' '}
                                                                    {
                                                                        payment
                                                                            .gatewayResponse
                                                                            .orderId
                                                                    }
                                                                </span>
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                                {(payment.paymentLink ||
                                                    payment.orderId?.metadata
                                                        ?.returnUrl) && (
                                                    <div className='sm:col-span-2'>
                                                        <dt className='text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                                            <LinkIcon className='w-4 h-4' />
                                                            Links
                                                        </dt>
                                                        <dd className='mt-1 text-sm text-blue-600 dark:text-blue-400'>
                                                            {payment.orderId
                                                                ?.metadata
                                                                ?.returnUrl && (
                                                                <a
                                                                    href={
                                                                        payment
                                                                            .orderId
                                                                            .metadata
                                                                            .returnUrl
                                                                    }
                                                                    target='_blank'
                                                                    rel='noreferrer'
                                                                    className='flex items-center gap-1 hover:underline'
                                                                >
                                                                    Resource URL
                                                                    <LinkIcon className='w-3 h-3' />
                                                                </a>
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>
                                    </div>

                                    {/* Purchased Item */}
                                    {payment.orderId?.resourceId && (
                                        <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                            <div className='px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700'>
                                                <h3 className='text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2'>
                                                    <ShoppingBag className='w-3.5 h-3.5 text-gray-400' />
                                                    Purchased Item
                                                </h3>
                                            </div>
                                            <div className='px-3 py-2'>
                                                <div className='flex items-center gap-4'>
                                                    <div className='h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400'>
                                                        <ShoppingBag className='w-6 h-6' />
                                                    </div>
                                                    <div>
                                                        <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                            {payment.orderId
                                                                .resourceId
                                                                ?.title ||
                                                                'Unknown Title'}
                                                        </h4>
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {payment.orderId
                                                                .resourceId
                                                                ?.subject ||
                                                                'Unknown Subject'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                    <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-700'>
                                        <h3 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5'>
                                            <Code className='w-3.5 h-3.5 text-gray-400' />
                                            Raw JSON Data
                                        </h3>
                                    </div>
                                    <div className='px-3 py-2'>
                                        <pre className='bg-gray-900 text-green-400 p-2 rounded overflow-x-auto text-xs font-mono'>
                                            {JSON.stringify(payment, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compact Details (Right Column) */}
                        <div className='space-y-3'>
                            {/* User Info */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5'>
                                        <User2 className='w-3.5 h-3.5 text-gray-400' />
                                        User Details
                                    </h3>
                                </div>
                                <div className='px-3 py-2'>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300'>
                                            <span className='text-xs font-bold'>
                                                {payment.user?.username?.[0]?.toUpperCase() ||
                                                    'U'}
                                            </span>
                                        </div>
                                        <div className='overflow-hidden'>
                                            <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                {payment.user?.username ||
                                                    payment.user?.name ||
                                                    'Unknown User'}
                                            </p>
                                            <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                                {payment.user?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className='bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden'>
                                <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-700'>
                                    <h3 className='text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5'>
                                        <ShoppingBag className='w-3.5 h-3.5 text-gray-400' />
                                        Order Details
                                    </h3>
                                </div>
                                <div className='px-3 py-2'>
                                    {payment.orderId ? (
                                        <dl>
                                            <div className='py-2 grid grid-cols-2 gap-2 border-b border-gray-200 dark:border-gray-700'>
                                                <dt className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                    Status
                                                </dt>
                                                <dd className='text-xs text-gray-900 dark:text-white text-right'>
                                                    <Badge
                                                        color={
                                                            payment.orderId
                                                                .status ===
                                                            'completed'
                                                                ? 'green'
                                                                : 'yellow'
                                                        }
                                                    >
                                                        {payment.orderId.status}
                                                    </Badge>
                                                </dd>
                                            </div>
                                            <div className='py-2 grid grid-cols-2 gap-2 border-b border-gray-200 dark:border-gray-700'>
                                                <dt className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                    Type
                                                </dt>
                                                <dd className='text-sm text-gray-900 dark:text-white text-right capitalize'>
                                                    {payment.orderId.orderType}
                                                </dd>
                                            </div>
                                            <div className='py-2 grid grid-cols-2 gap-2 border-b border-gray-200 dark:border-gray-700'>
                                                <dt className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                    Method
                                                </dt>
                                                <dd className='text-sm text-gray-900 dark:text-white text-right font-medium'>
                                                    {
                                                        payment.orderId
                                                            .paymentMethod
                                                    }
                                                </dd>
                                            </div>
                                            <div className='py-2 grid grid-cols-2 gap-2'>
                                                <dt className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                                    Order Created
                                                </dt>
                                                <dd className='text-xs text-gray-900 dark:text-white text-right'>
                                                    {payment.orderId.createdAt
                                                        ? new Date(
                                                              payment.orderId.createdAt,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </dd>
                                            </div>
                                        </dl>
                                    ) : (
                                        <div className='p-6 text-sm text-gray-500 dark:text-gray-400 italic text-center'>
                                            No order information available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentDetail;
