import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DeltaBadge from '../components/DeltaBadge';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import { useStatsWithDelta } from '../hooks/useStatsWithDelta';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    BarChart3,
    Users,
    Book,
    Building,
    GraduationCap,
    ShoppingBag,
    Gift,
    CreditCard,
    PhoneCall,
    AlertCircle,
    Diamond,
} from 'lucide-react';
import Loader from '../components/Common/Loader';

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { mainContentMargin } = useSidebarLayout();
    const { deltaStats, lastViewedAt, setStats, acknowledgeStat } =
        useStatsWithDelta();

    const navigate = useNavigate();

    const fetchReportStats = async () => {
        try {
            setError(null);
            const response = await api.get('/stats/stats');
            const statsData = response.data.data;
            setData(statsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Failed to load statistics');
            toast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statsCategories = [
        {
            title: 'Financial',
            stats: [
                {
                    id: 'payments',
                    title: 'Total Payments',
                    value: data?.totalPayments || 0,
                    icon: <CreditCard className='w-5 h-5' />,
                    bgColor: 'bg-green-100 dark:bg-green-900',
                    textColor: 'text-green-600 dark:text-green-400',
                    iconColor: 'text-green-500 dark:text-green-300',
                    href: '/reports/payments',
                    statKey: 'totalPayments',
                },

                {
                    id: 'orders',
                    title: 'Total Orders',
                    value: data?.totalOrders || 0,
                    icon: <ShoppingBag className='w-5 h-5' />,
                    bgColor: 'bg-orange-100 dark:bg-orange-900',
                    textColor: 'text-orange-600 dark:text-orange-400',
                    iconColor: 'text-orange-500 dark:text-orange-300',
                    href: '/reports/orders',
                    statKey: 'totalOrders',
                },
                {
                    id: 'redemption',
                    title: 'Redemption Requests',
                    value: data?.totalRedemptionRequest || 0,
                    icon: <Gift className='w-5 h-5' />,
                    bgColor: 'bg-purple-100 dark:bg-purple-900',
                    textColor: 'text-purple-600 dark:text-purple-400',
                    iconColor: 'text-purple-500 dark:text-purple-300',
                    href: '/reports/redemptions',
                    statKey: 'totalRedemptionRequest',
                },
                {
                    id: 'transactions',
                    title: 'Total Transactions',
                    value: data?.totalTransactions || 0,
                    icon: <BarChart3 className='w-5 h-5' />,
                    bgColor: 'bg-blue-100 dark:bg-blue-900',
                    textColor: 'text-blue-600 dark:text-blue-400',
                    iconColor: 'text-blue-500 dark:text-blue-300',
                    href: '/reports/transactions',
                    statKey: 'totalTransactions',
                },
            ],
        },
        {
            title: 'Users & Support',
            stats: [
                {
                    id: 'users',
                    title: 'Total Clients',
                    value: data?.totalClient || 0,
                    icon: <Users className='w-5 h-5' />,
                    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
                    textColor: 'text-indigo-600 dark:text-indigo-400',
                    iconColor: 'text-indigo-500 dark:text-indigo-300',
                    href: '/reports/clients',
                    statKey: 'totalClient',
                },
                {
                    id: 'dashboardUsers',
                    title: 'Dashboard Users',
                    value: data?.totalDashboardUsers || 0,
                    icon: <Users className='w-5 h-5' />,
                    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
                    textColor: 'text-indigo-600 dark:text-indigo-400',
                    iconColor: 'text-indigo-500 dark:text-indigo-300',
                    href: '/reports/dashboard-users',
                    statKey: 'totalDashboardUsers',
                },
                {
                    id: 'contactUs',
                    title: 'Contact Requests',
                    value: data?.totalContactUs || 0,
                    icon: <PhoneCall className='w-5 h-5' />,
                    bgColor: 'bg-pink-100 dark:bg-pink-900',
                    textColor: 'text-pink-600 dark:text-pink-400',
                    iconColor: 'text-pink-500 dark:text-pink-300',
                    href: '/reports/contacts',
                    statKey: 'totalContactUs',
                },
                {
                    id: 'subscriptions',
                    title: 'Subscriptions',
                    value: data?.totalSubscriptions || 0,
                    icon: <Diamond className='w-5 h-5' />,
                    bgColor: 'bg-amber-100 dark:bg-amber-900',
                    textColor: 'text-amber-600 dark:text-amber-400',
                    iconColor: 'text-amber-500 dark:text-amber-300',
                    href: '/reports/subscriptions',
                    statKey: 'totalSubscriptions',
                },
            ],
        },
        {
            title: 'Education & Products',
            stats: [
                {
                    id: 'subjects',
                    title: 'Total Subjects',
                    value: data?.totalSubjects || 0,
                    icon: <Book className='w-5 h-5' />,
                    bgColor: 'bg-cyan-100 dark:bg-cyan-900',
                    textColor: 'text-cyan-600 dark:text-cyan-400',
                    iconColor: 'text-cyan-500 dark:text-cyan-300',
                    href: '/reports/subjects',
                    statKey: 'totalSubjects',
                },
                {
                    id: 'branches',
                    title: 'Total Branches',
                    value: data?.totalBranch || 0,
                    icon: <Building className='w-5 h-5' />,
                    bgColor: 'bg-teal-100 dark:bg-teal-900',
                    textColor: 'text-teal-600 dark:text-teal-400',
                    iconColor: 'text-teal-500 dark:text-teal-300',
                    href: '/reports/branches',
                    statKey: 'totalBranch',
                },
                {
                    id: 'courses',
                    title: 'Total Courses',
                    value: data?.totalCourse || 0,
                    icon: <GraduationCap className='w-5 h-5' />,
                    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
                    textColor: 'text-emerald-600 dark:text-emerald-400',
                    iconColor: 'text-emerald-500 dark:text-emerald-300',
                    href: '/reports/courses',
                    statKey: 'totalCourse',
                },
            ],
        },
    ];

    if (loading) {
        return <Loader />;
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />
            <Sidebar />

            <main
                className={`pt-4 pb-6 ${mainContentMargin} transition-all duration-300`}
            >
                <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6'>
                    {/* Error Message */}
                    {error && (
                        <div className='bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4'>
                            <div className='flex items-center'>
                                <AlertCircle className='w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0' />
                                <span className='text-sm'>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Statistics Categories */}
                    {data ? (
                        <div className='space-y-5'>
                            {statsCategories.map((category, index) => (
                                <div
                                    key={index}
                                    className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'
                                >
                                    {/* Category Header */}
                                    <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
                                        <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide'>
                                            {category.title}
                                        </h2>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className='p-4'>
                                        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                                            {category.stats.map((stat) => (
                                                <button
                                                    key={stat.id}
                                                    onClick={() => {
                                                        if (stat.statKey) {
                                                            acknowledgeStat(
                                                                stat.statKey,
                                                            );
                                                        }
                                                        navigate(stat.href);
                                                    }}
                                                    className='block group w-full text-left'
                                                >
                                                    <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200'>
                                                        {/* Stat Content */}
                                                        <div className='p-3.5'>
                                                            <div className='flex items-start justify-between gap-2 mb-2'>
                                                                <div className='flex-1 min-w-0'>
                                                                    <h3
                                                                        className={`text-xs font-medium ${stat.textColor} truncate leading-tight`}
                                                                    >
                                                                        {
                                                                            stat.title
                                                                        }
                                                                    </h3>
                                                                </div>
                                                                <div
                                                                    className={`p-1.5 rounded-md ${stat.bgColor} ${stat.iconColor} flex-shrink-0`}
                                                                >
                                                                    {React.cloneElement(
                                                                        stat.icon,
                                                                        {
                                                                            className:
                                                                                'w-3.5 h-3.5',
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className='flex items-baseline gap-1.5'>
                                                                <p className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                                                                    {stat.value.toLocaleString()}
                                                                </p>
                                                                {stat.statKey &&
                                                                    deltaStats[
                                                                        stat
                                                                            .statKey
                                                                    ] !==
                                                                        undefined && (
                                                                        <DeltaBadge
                                                                            value={
                                                                                deltaStats[
                                                                                    stat
                                                                                        .statKey
                                                                                ]
                                                                            }
                                                                            lastViewedAt={
                                                                                lastViewedAt
                                                                            }
                                                                        />
                                                                    )}
                                                            </div>
                                                        </div>

                                                        {/* Footer Action */}
                                                        <div className='px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700'>
                                                            <div className='text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center transition-colors'>
                                                                <span>
                                                                    View details
                                                                </span>
                                                                <svg
                                                                    className='ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    viewBox='0 0 24 24'
                                                                >
                                                                    <path
                                                                        strokeLinecap='round'
                                                                        strokeLinejoin='round'
                                                                        strokeWidth='2'
                                                                        d='M9 5l7 7-7 7'
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center p-8'>
                            <div className='mx-auto max-w-md'>
                                <BarChart3 className='w-12 h-12 mx-auto text-gray-400 mb-3' />
                                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                                    No Statistics Available
                                </h3>
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    There are no statistics available to display
                                    at this time.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Reports;
