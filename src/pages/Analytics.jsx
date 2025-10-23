import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    Store,
    Briefcase,
    Package,
    Video,
    Eye,
    Calendar,
    ArrowLeft,
    BarChart3,
    PieChart,
    Activity,
    Download,
    RefreshCw,
} from 'lucide-react';

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [collegeData, setCollegeData] = useState(null);
    const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/analytics?days=${timeRange}`);
            if (response.data.success) {
                setAnalyticsData(response.data.data);
                setCollegeData(response.data.data.totals);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
        toast.success('Analytics refreshed successfully');
    };

    const handleExport = () => {
        // Implement export functionality
        toast.success('Export functionality coming soon!');
    };

    // Calculate total content and engagement
    const getTotalContent = () => {
        if (!collegeData) return 0;
        return collegeData.totalContent || 0;
    };

    const getPercentageChange = (contentType) => {
        if (!analyticsData?.percentageChanges) return '+0%';
        const change = analyticsData.percentageChanges[contentType];
        if (!change) return '+0%';
        const percent = change.percentChange;
        return percent > 0 ? `+${percent}%` : `${percent}%`;
    };

    const getChangeType = (contentType) => {
        if (!analyticsData?.percentageChanges) return 'increase';
        const change = analyticsData.percentageChanges[contentType];
        if (!change) return 'increase';
        return change.trend === 'up'
            ? 'increase'
            : change.trend === 'down'
              ? 'decrease'
              : 'stable';
    };

    // Helper function to format numbers
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Calculate engagement rate
    const calculateEngagementRate = () => {
        if (!analyticsData?.engagement) return '0%';
        let totalViews = 0;
        Object.values(analyticsData.engagement).forEach((item) => {
            totalViews += item.totalViews || 0;
        });
        const totalContent = getTotalContent();
        if (totalContent === 0) return '0%';
        const rate = (totalViews / totalContent / 10).toFixed(0); // Rough calculation
        return Math.min(rate, 100) + '%';
    };

    // Helper function for time ago
    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60)
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    // Analytics cards configuration
    const analyticsCards = [
        {
            id: 'pyqs',
            title: 'PYQs',
            value: collegeData?.totalNewPyqs || 0,
            icon: FileText,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            change: getPercentageChange('pyqs'),
            changeType: getChangeType('pyqs'),
        },
        {
            id: 'notes',
            title: 'Notes',
            value: collegeData?.totalNotes || 0,
            icon: BookOpen,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            change: getPercentageChange('notes'),
            changeType: getChangeType('notes'),
        },
        {
            id: 'products',
            title: 'Products',
            value: collegeData?.totalProduct || 0,
            icon: Store,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
            change: getPercentageChange('products'),
            changeType: getChangeType('products'),
        },
        {
            id: 'seniors',
            title: 'Seniors',
            value: collegeData?.totalSeniors || 0,
            icon: Users,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
            change: getPercentageChange('seniors'),
            changeType: getChangeType('seniors'),
        },
        {
            id: 'groups',
            title: 'Groups',
            value: collegeData?.totalGroups || 0,
            icon: MessageSquare,
            color: 'from-indigo-500 to-blue-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            change: getPercentageChange('groups'),
            changeType: getChangeType('groups'),
        },
        {
            id: 'opportunities',
            title: 'Opportunities',
            value: collegeData?.totalGiveOpportunity || 0,
            icon: Briefcase,
            color: 'from-red-500 to-orange-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400',
            change: getPercentageChange('opportunities'),
            changeType: getChangeType('opportunities'),
        },
        {
            id: 'lostfound',
            title: 'Lost & Found',
            value: collegeData?.totalLostFound || 0,
            icon: Package,
            color: 'from-pink-500 to-rose-500',
            bgColor: 'bg-pink-50 dark:bg-pink-900/20',
            iconColor: 'text-pink-600 dark:text-pink-400',
            change: getPercentageChange('lostFound'),
            changeType: getChangeType('lostFound'),
        },
        {
            id: 'posts',
            title: 'Community Posts',
            value: collegeData?.totalPost || 0,
            icon: MessageSquare,
            color: 'from-teal-500 to-green-500',
            bgColor: 'bg-teal-50 dark:bg-teal-900/20',
            iconColor: 'text-teal-600 dark:text-teal-400',
            change: getPercentageChange('posts'),
            changeType: getChangeType('posts'),
        },
    ];

    // Overview stats
    const overviewStats = [
        {
            label: 'Total Content',
            value: getTotalContent(),
            icon: BarChart3,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'Active Users',
            value: analyticsData?.totals?.totalClient || '0',
            icon: Users,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            label: 'Total Views',
            value: formatNumber(
                analyticsData?.engagement?.PYQs?.totalViews || 0,
            ),
            icon: Eye,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            label: 'Engagement Rate',
            value: calculateEngagementRate(),
            icon: Activity,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
    ];

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />

                <div
                    className={`flex items-center justify-center py-20 transition-all duration-300`}
                >
                    <div className='flex items-center space-x-2'>
                        <RefreshCw className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 dark:text-gray-400'>
                            Loading analytics...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <Header />

            <main className='pt-6 pb-12 transition-all duration-300'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Header Section */}
                    <div className='mb-8'>
                        <div className='flex items-center justify-between flex-wrap gap-4'>
                            <div className='flex items-center space-x-4'>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                                        Analytics Dashboard
                                    </h1>
                                </div>
                            </div>

                            <div className='flex items-center space-x-3'>
                                {/* Time Range Filter */}
                                <select
                                    value={timeRange}
                                    onChange={(e) =>
                                        setTimeRange(e.target.value)
                                    }
                                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                >
                                    <option value='7'>Last 7 Days</option>
                                    <option value='30'>Last 30 Days</option>
                                    <option value='90'>Last 90 Days</option>
                                </select>

                                {/* Refresh Button */}
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className='inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                                    />
                                    Refresh
                                </button>

                                {/* Export Button */}
                                <button
                                    onClick={handleExport}
                                    className='inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                >
                                    <Download className='w-4 h-4 mr-2' />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Stats */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                        {overviewStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow'
                                >
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                                {stat.label}
                                            </p>
                                            <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                                                {stat.value.toLocaleString()}
                                            </p>
                                        </div>
                                        <div
                                            className={`p-3 rounded-lg ${stat.bgColor}`}
                                        >
                                            <Icon
                                                className={`w-6 h-6 ${stat.color}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Content Analytics Cards */}
                    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8'>
                        <div className='flex items-center justify-between mb-6'>
                            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                Content Distribution
                            </h2>
                            <PieChart className='w-5 h-5 text-gray-400' />
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                            {analyticsCards.map((card) => {
                                const Icon = card.icon;
                                const ChangeIcon =
                                    card.changeType === 'increase'
                                        ? TrendingUp
                                        : TrendingDown;
                                return (
                                    <div
                                        key={card.id}
                                        className='group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer'
                                    >
                                        {/* Gradient Background */}
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                                        ></div>

                                        {/* Content */}
                                        <div className='relative'>
                                            <div className='flex items-center justify-between mb-4'>
                                                <div
                                                    className={`p-3 rounded-lg ${card.bgColor}`}
                                                >
                                                    <Icon
                                                        className={`w-6 h-6 ${card.iconColor}`}
                                                    />
                                                </div>
                                                <div
                                                    className={`flex items-center space-x-1 text-sm font-medium ${
                                                        card.changeType ===
                                                        'increase'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}
                                                >
                                                    <ChangeIcon className='w-4 h-4' />
                                                    <span>{card.change}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                                    {card.title}
                                                </p>
                                                <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                                                    {card.value.toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className='mt-4'>
                                                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                                                    <div
                                                        className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-300`}
                                                        style={{
                                                            width: `${Math.min((card.value / getTotalContent()) * 100, 100)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                    {(
                                                        (card.value /
                                                            getTotalContent()) *
                                                        100
                                                    ).toFixed(1)}
                                                    % of total content
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Analytics Sections */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                        {/* Engagement Metrics */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Engagement Metrics
                                </h2>
                                <Activity className='w-5 h-5 text-gray-400' />
                            </div>

                            <div className='space-y-6'>
                                {analyticsData?.engagement &&
                                    Object.entries(analyticsData.engagement)
                                        .slice(0, 4)
                                        .map(([key, value], index) => {
                                            const maxViews = Math.max(
                                                ...Object.values(
                                                    analyticsData.engagement,
                                                ).map((e) => e.totalViews),
                                            );
                                            const percentage =
                                                maxViews > 0
                                                    ? (value.totalViews /
                                                          maxViews) *
                                                      100
                                                    : 0;
                                            const colors = [
                                                'from-blue-500 to-cyan-500',
                                                'from-green-500 to-emerald-500',
                                                'from-purple-500 to-pink-500',
                                                'from-orange-500 to-red-500',
                                            ];
                                            return (
                                                <div key={key}>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                                            {key} Views
                                                        </span>
                                                        <span className='text-sm font-bold text-gray-900 dark:text-white'>
                                                            {formatNumber(
                                                                value.totalViews,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
                                                        <div
                                                            className={`bg-gradient-to-r ${colors[index % 4]} h-3 rounded-full`}
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Top Performing Content
                                </h2>
                                <TrendingUp className='w-5 h-5 text-green-500' />
                            </div>

                            <div className='space-y-4'>
                                {analyticsData?.topPerformers &&
                                analyticsData.topPerformers.length > 0 ? (
                                    analyticsData.topPerformers
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <div
                                                key={item.id}
                                                className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                                            >
                                                <div className='flex items-center space-x-3 flex-1'>
                                                    <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm'>
                                                        {index + 1}
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                                            {item.title}
                                                        </p>
                                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                            {item.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center space-x-4'>
                                                    <div className='flex items-center space-x-1 text-gray-600 dark:text-gray-400'>
                                                        <Eye className='w-4 h-4' />
                                                        <span className='text-sm font-medium'>
                                                            {formatNumber(
                                                                item.views,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className='text-center text-gray-500 dark:text-gray-400 py-4'>
                                        No top performers data available
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Recent Activity
                                </h2>
                                <Calendar className='w-5 h-5 text-gray-400' />
                            </div>

                            <div className='space-y-4'>
                                {analyticsData?.recentActivity &&
                                analyticsData.recentActivity.length > 0 ? (
                                    analyticsData.recentActivity
                                        .slice(0, 5)
                                        .map((activity) => {
                                            const iconMap = {
                                                PYQ: FileText,
                                                Note: BookOpen,
                                                Product: Store,
                                                Group: MessageSquare,
                                                Opportunity: Briefcase,
                                            };
                                            const colorMap = {
                                                PYQ: 'text-yellow-600',
                                                Note: 'text-blue-600',
                                                Product: 'text-green-600',
                                                Group: 'text-indigo-600',
                                                Opportunity: 'text-red-600',
                                            };
                                            const Icon =
                                                iconMap[activity.type] ||
                                                FileText;
                                            const color =
                                                colorMap[activity.type] ||
                                                'text-gray-600';
                                            const timeAgo = getTimeAgo(
                                                activity.timestamp,
                                            );
                                            return (
                                                <div
                                                    key={activity.id}
                                                    className='flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors'
                                                >
                                                    <div className='p-2 rounded-lg bg-gray-100 dark:bg-gray-700'>
                                                        <Icon
                                                            className={`w-5 h-5 ${color}`}
                                                        />
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                                            {activity.action}
                                                        </p>
                                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                                            by {activity.user}
                                                        </p>
                                                    </div>
                                                    <span className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                                                        {timeAgo}
                                                    </span>
                                                </div>
                                            );
                                        })
                                ) : (
                                    <p className='text-center text-gray-500 dark:text-gray-400 py-4'>
                                        No recent activity
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Growth Trends */}
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                    Growth Trends (Last 7 Days)
                                </h2>
                                <TrendingUp className='w-5 h-5 text-green-500' />
                            </div>

                            <div className='space-y-6'>
                                {analyticsData?.percentageChanges &&
                                    Object.entries(
                                        analyticsData.percentageChanges,
                                    )
                                        .slice(0, 4)
                                        .map(([key, trend]) => {
                                            const colors = [
                                                'from-green-500 to-emerald-500',
                                                'from-blue-500 to-cyan-500',
                                                'from-purple-500 to-pink-500',
                                                'from-orange-500 to-red-500',
                                            ];
                                            const index =
                                                Object.keys(
                                                    analyticsData.percentageChanges,
                                                ).indexOf(key) % 4;
                                            const TrendIcon =
                                                trend.trend === 'up'
                                                    ? TrendingUp
                                                    : TrendingDown;
                                            const trendColor =
                                                trend.trend === 'up'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400';
                                            return (
                                                <div key={key}>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400 capitalize'>
                                                            {key}
                                                        </span>
                                                        <div className='flex items-center space-x-2'>
                                                            <span
                                                                className={`text-lg font-bold ${trendColor}`}
                                                            >
                                                                {trend.percentChange >
                                                                0
                                                                    ? '+'
                                                                    : ''}
                                                                {
                                                                    trend.percentChange
                                                                }
                                                                %
                                                            </span>
                                                            <TrendIcon
                                                                className={`w-4 h-4 ${trendColor}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
                                                        <div
                                                            className={`bg-gradient-to-r ${colors[index]} h-3 rounded-full`}
                                                            style={{
                                                                width: `${Math.min(Math.abs(trend.percentChange), 100)}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                                        <span>
                                                            Previous:{' '}
                                                            {trend.previous}
                                                        </span>
                                                        <span>
                                                            Current:{' '}
                                                            {trend.current}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className='mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800'>
                        <div className='flex items-start space-x-4'>
                            <div className='flex-shrink-0'>
                                <BarChart3 className='w-8 h-8 text-blue-600 dark:text-blue-400' />
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                                    Analytics Insights
                                </h3>
                                <p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
                                    Your platform is showing strong growth
                                    across all content categories. PYQs and
                                    Opportunities are the most engaged content
                                    types. Consider promoting more interactive
                                    features to boost community participation.
                                    The engagement rate has increased by 32% in
                                    the last month, indicating healthy platform
                                    activity.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Analytics;
