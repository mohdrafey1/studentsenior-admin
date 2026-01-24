import { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    RefreshCw,
    FileText,
    BookOpen,
    Store,
    Users,
    MessageSquare,
    Briefcase,
    Package,
} from 'lucide-react';
import AnalyticsHeader from '../../components/Analytics/AnalyticsHeader';
import OverviewStats from '../../components/Analytics/OverviewStats';
import ContentDistribution from '../../components/Analytics/ContentDistribution';
import EngagementMetrics from '../../components/Analytics/EngagementMetrics';
import TopPerformers from '../../components/Analytics/TopPerformers';
import RecentActivity from '../../components/Analytics/RecentActivity';
import GrowthTrends from '../../components/Analytics/GrowthTrends';
import AnalyticsInsights from '../../components/Analytics/AnalyticsInsights';
import ChatbotAnalytics from '../../components/Analytics/ChatbotAnalytics';

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [collegeData, setCollegeData] = useState(null);
    const [chatbotData, setChatbotData] = useState(null);
    const [timeRange, setTimeRange] = useState('30');

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

    const fetchChatbotAnalytics = useCallback(async () => {
        try {
            const response = await api.get('/analytics/chatbot');
            if (response.data.success) {
                setChatbotData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching chatbot analytics:', error);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        fetchChatbotAnalytics();
    }, [fetchAnalytics, fetchChatbotAnalytics]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchAnalytics(), fetchChatbotAnalytics()]);
        setRefreshing(false);
        toast.success('Analytics refreshed successfully');
    };

    const handleExport = () => {
        toast.success('Export functionality coming soon!');
    };

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

    const calculateEngagementRate = () => {
        if (!analyticsData?.engagement) return '0%';
        let totalViews = 0;
        Object.values(analyticsData.engagement).forEach((item) => {
            totalViews += item.totalViews || 0;
        });
        const totalContent = getTotalContent();
        if (totalContent === 0) return '0%';
        const rate = (totalViews / totalContent / 10).toFixed(0);
        return Math.min(rate, 100) + '%';
    };

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

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Header />
                <div className='flex items-center justify-center py-20'>
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

            <main className='pt-4 md:pt-6 pb-8 md:pb-12'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <AnalyticsHeader
                        timeRange={timeRange}
                        setTimeRange={setTimeRange}
                        onRefresh={handleRefresh}
                        onExport={handleExport}
                        refreshing={refreshing}
                    />

                    <OverviewStats
                        totalContent={getTotalContent()}
                        totalViews={
                            analyticsData?.engagement?.PYQs?.totalViews || 0
                        }
                        engagementRate={calculateEngagementRate()}
                    />

                    <ContentDistribution
                        analyticsCards={analyticsCards}
                        totalContent={getTotalContent()}
                    />

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8'>
                        <EngagementMetrics
                            engagement={analyticsData?.engagement}
                        />
                        <TopPerformers
                            topPerformers={analyticsData?.topPerformers}
                        />
                        <RecentActivity
                            recentActivity={analyticsData?.recentActivity}
                        />
                        <GrowthTrends
                            percentageChanges={analyticsData?.percentageChanges}
                        />
                    </div>

                    <AnalyticsInsights />

                    <ChatbotAnalytics chatbotData={chatbotData} />
                </div>
            </main>
        </div>
    );
}

export default Analytics;
